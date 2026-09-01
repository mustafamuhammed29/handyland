/**
 * backend/tests/milestone3_financial_rpcs.test.js
 * 
 * Isolated Integration Test Suite for Milestone 3 (Migration 028)
 * Uses a disposable local PostgreSQL 18 cluster created via initdb.
 * 
 * Verifies:
 * 1. Input validation & error code enforcement (22003, 22023, P0001, P0002, 42501).
 * 2. Admin authorization & audit log generation on admin_adjust_wallet_ledger_entry.
 * 3. External provider payment ID validation & idempotent webhook reconciliation.
 * 4. Atomic rollback protection on insufficient balance.
 * 5. High-concurrency row locking (20 parallel operations on a single wallet).
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PG_BIN = process.env.PG_BIN || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const SCRATCH_DIR = path.resolve(__dirname, '../../.test_scratch_pgdata_m3');
const MIGRATION_027 = path.resolve(__dirname, '../../supabase/migrations/027_immutable_wallet_ledger_and_provider_identity.sql');
const MIGRATION_028 = path.resolve(__dirname, '../../supabase/migrations/028_trusted_financial_rpcs.sql');
const TEST_PORT = process.env.TEST_PG_PORT || '5435';
const DB_NAME = 'milestone3_test_db';

let pool = null;

function runPsql(db, sql, ignoreError = false) {
    const psqlPath = path.join(PG_BIN, 'psql.exe');
    const result = spawnSync(psqlPath, [
        '-U', 'postgres',
        '-h', '127.0.0.1',
        '-p', TEST_PORT,
        '-d', db,
        '-w',
        '-v', 'ON_ERROR_STOP=1',
        '-v', 'VERBOSITY=verbose',
        '-c', sql
    ], { encoding: 'utf8' });

    if (result.status !== 0 && !ignoreError) {
        throw new Error(`psql command failed with exit code ${result.status}:\n${result.stderr || result.stdout}`);
    }
    return result;
}

function runPsqlFile(db, filePath, ignoreError = false) {
    const psqlPath = path.join(PG_BIN, 'psql.exe');
    const result = spawnSync(psqlPath, [
        '-U', 'postgres',
        '-h', '127.0.0.1',
        '-p', TEST_PORT,
        '-d', db,
        '-w',
        '-v', 'ON_ERROR_STOP=1',
        '-v', 'VERBOSITY=verbose',
        '-f', filePath
    ], { encoding: 'utf8' });

    if (result.status !== 0 && !ignoreError) {
        throw new Error(`psql file execution failed with exit code ${result.status}:\n${result.stderr || result.stdout}`);
    }
    return result;
}

function initDisposableCluster() {
    console.log('[TEST SETUP] Initializing disposable PostgreSQL cluster for Milestone 3...');
    if (fs.existsSync(SCRATCH_DIR)) {
        stopDisposableCluster();
        try { fs.rmSync(SCRATCH_DIR, { recursive: true, force: true }); } catch (e) {}
    }

    const initdbPath = path.join(PG_BIN, 'initdb.exe');
    const res = spawnSync(initdbPath, [
        '-D', SCRATCH_DIR,
        '-U', 'postgres',
        '-A', 'trust',
        '--encoding=UTF8'
    ], { encoding: 'utf8' });

    if (res.status !== 0) {
        throw new Error(`initdb failed: ${res.stderr || res.stdout}`);
    }

    console.log('[TEST SETUP] Starting temporary PostgreSQL server on port ' + TEST_PORT);
    const pgCtlPath = path.join(PG_BIN, 'pg_ctl.exe');
    const logPath = path.join(SCRATCH_DIR, 'server.log');
    execSync(`"${pgCtlPath}" -D "${SCRATCH_DIR}" -l "${logPath}" -o "-p ${TEST_PORT}" start`, { stdio: 'ignore' });

    let ready = false;
    const psqlPath = path.join(PG_BIN, 'psql.exe');
    for (let i = 0; i < 20; i++) {
        const ping = spawnSync(psqlPath, ['-U', 'postgres', '-h', '127.0.0.1', '-p', TEST_PORT, '-w', '-c', 'SELECT 1;'], { encoding: 'utf8' });
        if (ping.status === 0) {
            ready = true;
            break;
        }
        execSync('powershell -Command "Start-Sleep -Milliseconds 200"');
    }
    if (!ready) {
        throw new Error('Disposable PostgreSQL server failed to start within timeout');
    }
}

function stopDisposableCluster() {
    console.log('[CLEANUP] Stopping disposable PostgreSQL server...');
    const pgCtlPath = path.join(PG_BIN, 'pg_ctl.exe');
    try {
        execSync(`"${pgCtlPath}" -D "${SCRATCH_DIR}" -m immediate stop`, { stdio: 'ignore' });
    } catch (e) {}
    if (fs.existsSync(SCRATCH_DIR)) {
        try { fs.rmSync(SCRATCH_DIR, { recursive: true, force: true }); } catch (e) {}
    }
}

async function expectPgError(promise, expectedCode, expectedMessageRegex) {
    try {
        await promise;
        throw new Error('Expected query to fail but it succeeded');
    } catch (err) {
        if (err.message === 'Expected query to fail but it succeeded') throw err;
        expect(err.code).toBe(expectedCode);
        if (expectedMessageRegex) {
            expect(err.message).toMatch(expectedMessageRegex);
        }
    }
}

describe('Milestone 3 - Trusted Financial RPCs Test Suite', () => {
    beforeAll(() => {
        initDisposableCluster();
    });

    afterAll(async () => {
        if (pool) {
            await pool.end().catch(() => {});
        }
        stopDisposableCluster();
    });

    beforeEach(() => {
        if (pool) {
            pool.end().catch(() => {});
            pool = null;
        }
        runPsql('postgres', `DROP DATABASE IF EXISTS ${DB_NAME};`, true);
        runPsql('postgres', `CREATE DATABASE ${DB_NAME};`);

        // Setup base schema prerequisites
        runPsql(DB_NAME, `
            CREATE SCHEMA IF NOT EXISTS auth;
            CREATE TABLE auth.users (id UUID PRIMARY KEY);
            CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
                SELECT '00000000-0000-0000-0000-000000000001'::uuid;
            $$ LANGUAGE sql STABLE;

            CREATE TABLE public.users (
                id UUID PRIMARY KEY,
                role TEXT NOT NULL DEFAULT 'user',
                balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                wallet_balance_cents BIGINT NOT NULL DEFAULT 0
            );

            CREATE TABLE public.transactions (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES public.users(id),
                amount BIGINT NOT NULL,
                type TEXT,
                status TEXT,
                stripe_payment_id TEXT,
                payment_method TEXT
            );

            CREATE TABLE public.audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES public.users(id),
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                details JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Setup Supabase roles
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                    CREATE ROLE service_role;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    CREATE ROLE authenticated;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                    CREATE ROLE anon;
                END IF;
            END $$;
        `);

        // Apply Migration 027 & Migration 028
        runPsqlFile(DB_NAME, MIGRATION_027);
        runPsqlFile(DB_NAME, MIGRATION_028);

        pool = new Pool({
            user: 'postgres',
            host: '127.0.0.1',
            database: DB_NAME,
            port: parseInt(TEST_PORT, 10),
            max: 25
        });
    });

    test('Scenario 1: Input Validation & Error Codes Enforcement', async () => {
        const client = await pool.connect();
        try {
            // Seed a test user
            await client.query(`INSERT INTO public.users (id, balance, wallet_balance_cents) VALUES ('00000000-0000-0000-0000-000000000001', 10.00, 1000);`);

            // 1. Negative amount -> 22003
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000001', 'credit', -500, 'topup', 'transaction', 't1', 'stripe', 'pi_1', 'k1'
                );
            `), '22003', /Amount must be positive/);

            // 2. Withdrawal reason -> 22023
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000001', 'debit', 500, 'withdrawal', 'manual', 't2', 'system', NULL, 'k2'
                );
            `), '22023', /unsupported ledger reason/);

            // 3. Invalid direction -> 22023
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000001', 'invalid_dir', 500, 'topup', 'transaction', 't3', 'stripe', 'pi_3', 'k3'
                );
            `), '22023', /Invalid direction/);

            // 4. Missing provider payment id for Stripe -> 22023
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000001', 'credit', 500, 'topup', 'transaction', 't4', 'stripe', NULL, 'k4'
                );
            `), '22023', /requires a non-empty provider_payment_id/);

            // 5. Non-existent user -> P0002
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000999', 'credit', 500, 'topup', 'transaction', 't5', 'stripe', 'pi_5', 'k5'
                );
            `), 'P0002', /User not found/);

            // 6. Insufficient balance on debit -> P0001
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '00000000-0000-0000-0000-000000000001', 'debit', 5000, 'purchase', 'order', 'ord_1', 'system', NULL, 'k6'
                );
            `), 'P0001', /Insufficient wallet balance/);
        } finally {
            client.release();
        }
    });

    test('Scenario 2: Admin Authorization & Audit Logging', async () => {
        const client = await pool.connect();
        try {
            // Seed regular user and admin user
            const userId = '00000000-0000-0000-0000-000000000001';
            const regularId = '00000000-0000-0000-0000-000000000002';
            const adminId = '00000000-0000-0000-0000-000000000003';

            await client.query(`
                INSERT INTO public.users (id, role, balance, wallet_balance_cents) VALUES 
                ('${userId}', 'user', 0.00, 0),
                ('${regularId}', 'user', 0.00, 0),
                ('${adminId}', 'admin', 0.00, 0);
            `);

            // Non-admin calling admin adjustment must fail with 42501
            await expectPgError(client.query(`
                SELECT * FROM public.admin_adjust_wallet_ledger_entry(
                    '${regularId}', '${userId}', 'credit', 2500, 'Manual compensation credit', 'admin_adj_k1'
                );
            `), '42501', /Access denied/);

            // Admin calling adjustment succeeds
            const adjRes = await client.query(`
                SELECT * FROM public.admin_adjust_wallet_ledger_entry(
                    '${adminId}', '${userId}', 'credit', 2500, 'Customer goodwill compensation credit', 'admin_adj_k2'
                );
            `);
            expect(adjRes.rows.length).toBe(1);
            expect(adjRes.rows[0].balance_after_cents).toBe('2500');
            expect(adjRes.rows[0].admin_id).toBe(adminId);

            // Verify user balance updated
            const userCheck = await client.query(`SELECT wallet_balance_cents, balance FROM public.users WHERE id = '${userId}';`);
            expect(userCheck.rows[0].wallet_balance_cents).toBe('2500');
            expect(userCheck.rows[0].balance).toBe('25.00');

            // Verify audit_log entry created
            const auditCheck = await client.query(`SELECT * FROM public.audit_logs WHERE user_id = '${adminId}';`);
            expect(auditCheck.rows.length).toBe(1);
            expect(auditCheck.rows[0].action).toBe('WALLET_ADJUSTMENT');
            expect(auditCheck.rows[0].details.amount_cents).toBe(2500);
        } finally {
            client.release();
        }
    });

    test('Scenario 3: Webhook Reconciliation & Idempotency', async () => {
        const client = await pool.connect();
        try {
            const userId = '00000000-0000-0000-0000-000000000001';
            await client.query(`INSERT INTO public.users (id, balance, wallet_balance_cents) VALUES ('${userId}', 0.00, 0);`);

            // 1. Initial Top-up via webhook
            const topup1 = await client.query(`
                SELECT * FROM public.top_up_wallet_atomic(
                    '${userId}', 5000, 'stripe', 'pi_stripe_webhook_100', 'evt_stripe_100', '{"description": "Top-up 50 EUR"}'::jsonb
                );
            `);
            expect(topup1.rows.length).toBe(1);
            expect(topup1.rows[0].is_idempotent).toBe(false);
            expect(topup1.rows[0].balance_after_cents).toBe('5000');

            // 2. Duplicate Webhook delivery with same provider payment ID
            const topup2 = await client.query(`
                SELECT * FROM public.top_up_wallet_atomic(
                    '${userId}', 5000, 'stripe', 'pi_stripe_webhook_100', 'evt_stripe_100', '{"description": "Top-up 50 EUR"}'::jsonb
                );
            `);
            expect(topup2.rows.length).toBe(1);
            expect(topup2.rows[0].is_idempotent).toBe(true);
            expect(topup2.rows[0].entry_id).toBe(topup1.rows[0].entry_id);

            // 3. User balance must be exactly 5000 cents (not doubled to 10000)
            const balanceCheck = await client.query(`SELECT wallet_balance_cents, balance FROM public.users WHERE id = '${userId}';`);
            expect(balanceCheck.rows[0].wallet_balance_cents).toBe('5000');
            expect(balanceCheck.rows[0].balance).toBe('50.00');

            // 4. Exactly one transaction row created
            const txCheck = await client.query(`SELECT * FROM public.transactions WHERE provider_payment_id = 'pi_stripe_webhook_100';`);
            expect(txCheck.rows.length).toBe(1);
            expect(txCheck.rows[0].status).toBe('completed');
        } finally {
            client.release();
        }
    });

    test('Scenario 4: Atomic Rollback Protection on Insufficient Funds', async () => {
        const client = await pool.connect();
        try {
            const userId = '00000000-0000-0000-0000-000000000001';
            await client.query(`INSERT INTO public.users (id, balance, wallet_balance_cents) VALUES ('${userId}', 10.00, 1000);`);

            // Attempt debit of 2500 (balance is only 1000)
            await expectPgError(client.query(`
                SELECT * FROM public.process_wallet_ledger_entry(
                    '${userId}', 'debit', 2500, 'purchase', 'order', 'ord_fail_1', 'system', NULL, 'k_fail_overdraft'
                );
            `), 'P0001', /Insufficient wallet balance/);

            // Balance must remain strictly 1000
            const balanceCheck = await client.query(`SELECT wallet_balance_cents, balance FROM public.users WHERE id = '${userId}';`);
            expect(balanceCheck.rows[0].wallet_balance_cents).toBe('1000');
            expect(balanceCheck.rows[0].balance).toBe('10.00');

            // Ledger must contain zero entries
            const ledgerCheck = await client.query(`SELECT count(*) FROM public.wallet_ledger_entries WHERE user_id = '${userId}';`);
            expect(ledgerCheck.rows[0].count).toBe('0');
        } finally {
            client.release();
        }
    });

    test('Scenario 5: High-Concurrency Stress Test (20 Parallel Operations on Single User)', async () => {
        const userId = '00000000-0000-0000-0000-000000000001';
        
        // Initial setup: user starts with 10000 cents (100.00 EUR)
        const initClient = await pool.connect();
        try {
            await initClient.query(`INSERT INTO public.users (id, balance, wallet_balance_cents) VALUES ('${userId}', 100.00, 10000);`);
        } finally {
            initClient.release();
        }

        // 10 credits of 500 cents (+5000 cents)
        // 10 debits of 300 cents (-3000 cents)
        // Expected net balance: 10000 + 5000 - 3000 = 12000 cents (120.00 EUR)
        const operations = [];
        for (let i = 1; i <= 10; i++) {
            operations.push({
                direction: 'credit',
                amount: 500,
                reason: 'topup',
                refType: 'transaction',
                provider: 'stripe',
                providerPaymentId: `pi_concurrent_credit_${i}`,
                idempotencyKey: `concurrent_credit_${i}`
            });
            operations.push({
                direction: 'debit',
                amount: 300,
                reason: 'purchase',
                refType: 'order',
                provider: 'system',
                providerPaymentId: null,
                idempotencyKey: `concurrent_debit_${i}`
            });
        }

        // Shuffle operations to maximize race conditions
        operations.sort(() => Math.random() - 0.5);

        // Execute all 20 operations concurrently across pool
        const results = await Promise.all(
            operations.map(op => {
                return pool.query(`
                    SELECT * FROM public.process_wallet_ledger_entry(
                        $1, $2, $3, $4, $5, $6, $7, $8, $9
                    );
                `, [
                    userId,
                    op.direction,
                    op.amount,
                    op.reason,
                    op.refType,
                    `ref_${op.idempotencyKey}`,
                    op.provider,
                    op.providerPaymentId,
                    op.idempotencyKey
                ]);
            })
        );

        expect(results.length).toBe(20);

        // Verify final wallet balance in database
        const verifyClient = await pool.connect();
        try {
            const finalUser = await verifyClient.query(`SELECT wallet_balance_cents, balance FROM public.users WHERE id = '${userId}';`);
            expect(finalUser.rows[0].wallet_balance_cents).toBe('12000');
            expect(finalUser.rows[0].balance).toBe('120.00');

            // Verify 20 ledger rows exist
            const ledgerCount = await verifyClient.query(`SELECT count(*) FROM public.wallet_ledger_entries WHERE user_id = '${userId}';`);
            expect(ledgerCount.rows[0].count).toBe('20');
        } finally {
            verifyClient.release();
        }
    });
});
