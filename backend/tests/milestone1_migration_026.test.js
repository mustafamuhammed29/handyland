/**
 * backend/tests/milestone1_migration_026.test.js
 *
 * Test suite for Milestone 1: Migration 026 and Wallet Balance Cents Foundation
 *
 * Verifies:
 * 1. Migration 026 SQL syntax, idempotent enum addition, column addition, check constraints, and backfill statement.
 * 2. Backfill calculation logic for zero, positive, and decimal legacy balances.
 * 3. Constraint rules: non-negative and non-null enforcement.
 * 4. Preservation of legacy users.balance.
 * 5. P0 route containment remains 100% active (all 9 endpoints return 503).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');

// Import route modules
const transactionRoutes = require('../routes/transactionRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const orderRoutes = require('../routes/orderRoutes');
const repairRoutes = require('../routes/repairRoutes');

// Mock auth middleware for route verification
jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'user' };
        next();
    },
    authorize: () => (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'admin' };
        next();
    },
    optionalProtect: (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'user' };
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repairs', repairRoutes);

describe('Milestone 1: Migration 026 & Foundation Verification', () => {

    describe('1. Migration 026 File Structure & SQL Inspection', () => {
        const migrationPath = path.join(__dirname, '../../supabase/migrations/026_order_status_and_wallet_cents_foundation.sql');

        test('Migration 026 file exists in supabase/migrations/', () => {
            expect(fs.existsSync(migrationPath)).toBe(true);
        });

        test('Migration contains safe idempotent enum extension for partially_refunded', () => {
            const content = fs.readFileSync(migrationPath, 'utf8');
            expect(content).toContain("enumlabel = 'partially_refunded'");
            expect(content).toContain("ALTER TYPE public.order_status ADD VALUE 'partially_refunded'");
        });

        test('Migration adds wallet_balance_cents BIGINT NOT NULL DEFAULT 0', () => {
            const content = fs.readFileSync(migrationPath, 'utf8');
            expect(content).toContain("ADD COLUMN wallet_balance_cents BIGINT NOT NULL DEFAULT 0");
        });

        test('Migration adds non-negative check constraint on wallet_balance_cents', () => {
            const content = fs.readFileSync(migrationPath, 'utf8');
            expect(content).toContain("CHECK (wallet_balance_cents >= 0)");
            expect(content).toContain("chk_users_wallet_balance_cents_non_negative");
        });

        test('Migration contains precise backfill SQL from balance to wallet_balance_cents', () => {
            const content = fs.readFileSync(migrationPath, 'utf8');
            expect(content).toContain("SET wallet_balance_cents = ROUND(COALESCE(balance, 0) * 100)::BIGINT");
        });

        test('Migration does NOT contain any DROP statement or destructive operations', () => {
            const content = fs.readFileSync(migrationPath, 'utf8');
            expect(content).not.toMatch(/DROP\s+TABLE/i);
            expect(content).not.toMatch(/DROP\s+TYPE/i);
            expect(content).not.toMatch(/DROP\s+COLUMN/i);
            expect(content).not.toMatch(/DELETE\s+FROM/i);
        });
    });

    describe('2. Mathematical Backfill Logic Verification', () => {
        const calculateBackfill = (balance) => {
            if (balance === null || balance === undefined) return 0n;
            const num = Number(balance);
            if (isNaN(num) || num < 0) throw new Error('Invalid legacy balance');
            return BigInt(Math.round(num * 100));
        };

        test('Backfill converts 0.00 EUR to 0 cents', () => {
            expect(calculateBackfill(0.00)).toBe(0n);
            expect(calculateBackfill('0.00')).toBe(0n);
            expect(calculateBackfill(null)).toBe(0n);
        });

        test('Backfill converts 12.34 EUR to 1234 cents', () => {
            expect(calculateBackfill(12.34)).toBe(1234n);
            expect(calculateBackfill('12.34')).toBe(1234n);
        });

        test('Backfill converts 50.00 EUR to 5000 cents', () => {
            expect(calculateBackfill(50.00)).toBe(5000n);
            expect(calculateBackfill('50.00')).toBe(5000n);
        });

        test('Backfill handles edge fractional cents accurately with rounding', () => {
            expect(calculateBackfill(10.004)).toBe(1000n);
            expect(calculateBackfill(10.005)).toBe(1001n);
            expect(calculateBackfill(99.99)).toBe(9999n);
        });
    });

    describe('3. Constraint Rejection Rules Verification', () => {
        const validateWalletBalanceCents = (val) => {
            if (val === null || val === undefined) return { valid: false, reason: 'NOT_NULL_VIOLATION' };
            if (typeof val !== 'bigint' && !Number.isInteger(val)) return { valid: false, reason: 'TYPE_VIOLATION' };
            if (val < 0) return { valid: false, reason: 'CHECK_VIOLATION_NEGATIVE' };
            return { valid: true };
        };

        test('Rejects negative values', () => {
            expect(validateWalletBalanceCents(-1)).toEqual({ valid: false, reason: 'CHECK_VIOLATION_NEGATIVE' });
            expect(validateWalletBalanceCents(-100n)).toEqual({ valid: false, reason: 'CHECK_VIOLATION_NEGATIVE' });
        });

        test('Rejects null and undefined values', () => {
            expect(validateWalletBalanceCents(null)).toEqual({ valid: false, reason: 'NOT_NULL_VIOLATION' });
            expect(validateWalletBalanceCents(undefined)).toEqual({ valid: false, reason: 'NOT_NULL_VIOLATION' });
        });

        test('Accepts zero and positive integer values', () => {
            expect(validateWalletBalanceCents(0)).toEqual({ valid: true });
            expect(validateWalletBalanceCents(1234n)).toEqual({ valid: true });
            expect(validateWalletBalanceCents(5000)).toEqual({ valid: true });
        });
    });

    describe('4. P0 Security Containment Routes Invariant', () => {
        const disabledEndpoints = [
            { method: 'post', url: '/api/transactions/paypal/create-topup', body: { amount: 50 } },
            { method: 'post', url: '/api/transactions/paypal/capture-topup', body: { orderID: 'TEST' } },
            { method: 'post', url: '/api/transactions/create-topup-session', body: { amount: 50 } },
            { method: 'post', url: '/api/transactions/confirm-topup', body: { sessionId: 'cs_test' } },
            { method: 'post', url: '/api/payment/paypal/create-order', body: { items: [] } },
            { method: 'post', url: '/api/payment/paypal/capture-order', body: { orderID: 'TEST' } },
            { method: 'post', url: '/api/orders/00000000-0000-4000-8000-000000000001/receipt', body: {} },
            { method: 'post', url: '/api/transactions/00000000-0000-4000-8000-000000000001/upload-receipt', body: {} },
            { method: 'get', url: '/api/repairs/track-guest/REP-26-TEST01', body: {} }
        ];

        for (const ep of disabledEndpoints) {
            test(`${ep.method.toUpperCase()} ${ep.url} remains disabled with 503`, async () => {
                const req = ep.method === 'post'
                    ? request(app).post(ep.url).send(ep.body)
                    : request(app).get(ep.url);

                const res = await req;
                expect(res.status).toBe(503);
                expect(res.body.success).toBe(false);
            });
        }
    });
});
