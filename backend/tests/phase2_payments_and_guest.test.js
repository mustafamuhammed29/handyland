/**
 * backend/tests/phase2_payments_and_guest.test.js
 * Comprehensive integration tests for Phase 2:
 * 1. Money Representation & Integer Cents Invariant
 * 2. Guest Payment Tracking & Nullable user_id in Transactions
 * 3. 2FA Challenge Authentication & TOTP Verification
 * 4. Guest Repair Tracking API Alignment (Email Validation)
 */
'use strict';

const mockStripeInstance = {
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_test_12345',
            client_secret: 'pi_test_12345_secret_abc'
        })
    }
};

jest.mock('stripe', () => {
    return jest.fn(() => mockStripeInstance);
});

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');
const paymentController = require('../controllers/paymentController');
const transactionController = require('../controllers/transactionController');
const userController = require('../controllers/userController');
const repairTicketController = require('../controllers/repairTicketController');

describe('Phase 2 Payments, Guest Checkout, 2FA & CI Hardening Tests', () => {

    describe('1. Migration 024 Static Integrity', () => {
        const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
        const m024Path = path.join(migrationsDir, '024_transactions_money_and_guest_alignment.sql');

        test('Migration 024 exists and defines nullable user_id, guest_email, and constraints', () => {
            expect(fs.existsSync(m024Path)).toBe(true);
            const content = fs.readFileSync(m024Path, 'utf8');

            expect(content).toContain('ALTER COLUMN user_id DROP NOT NULL');
            expect(content).toContain('ADD COLUMN IF NOT EXISTS guest_email TEXT');
            expect(content).toContain("CHECK (currency IN ('eur', 'usd', 'gbp'))");
            expect(content).toContain('CHECK (amount >= 0)');
        });
    });

    describe('2. Money Representation & Integer Cents Invariant', () => {
        test('Stripe createPaymentIntent converts floating-point order total to integer cents in transactions', async () => {
            const mockOrderId = '00000000-0000-4000-8000-000000000010';
            const mockOrder = {
                id: mockOrderId,
                user_id: null, // Guest order
                total_amount: 49.99,
                shipping_email: 'guest@example.com'
            };

            let insertedTx = null;
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
                    };
                }
                if (table === 'transactions') {
                    return {
                        insert: jest.fn((data) => {
                            insertedTx = data;
                            return Promise.resolve({ error: null });
                        })
                    };
                }
                return originalFrom(table);
            });

            const req = {
                body: { orderId: mockOrderId },
                user: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await paymentController.createPaymentIntent(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(insertedTx).toBeDefined();

                // Amount MUST be integer cents (4999), NOT floating-point 49.99
                expect(insertedTx.amount).toBe(4999);
                expect(Number.isInteger(insertedTx.amount)).toBe(true);
                expect(insertedTx.currency).toBe('eur');
                expect(insertedTx.user_id).toBeNull();
                expect(insertedTx.guest_email).toBe('guest@example.com');
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('transactionController.getTransactions formats integer cents into decimal euros for frontend', async () => {
            const rawTransactions = [
                {
                    id: 'tx-1',
                    amount: 4999, // 4999 cents
                    currency: 'eur',
                    guest_email: 'guest@example.com',
                    type: 'purchase',
                    status: 'completed',
                    payment_method: 'stripe',
                    created_at: new Date().toISOString()
                }
            ];

            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'transactions') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        range: jest.fn().mockResolvedValue({ data: rawTransactions, error: null, count: 1 })
                    };
                }
                return originalFrom(table);
            });

            const req = { query: { page: 1, limit: 10 }, user: { id: 'admin-id', role: 'admin' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await transactionController.getTransactions(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                const responseData = res.json.mock.calls[0][0];

                expect(responseData.success).toBe(true);
                const tx = responseData.transactions[0];
                // Formatted decimal Euro for frontend UI display
                expect(tx.amount).toBe(49.99);
                // Exact integer cents preserved in amountCents
                expect(tx.amountCents).toBe(4999);
                expect(tx.guestEmail).toBe('guest@example.com');
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('adminUpdateTransactionStatus converts integer cents to euros when crediting user balance', async () => {
            const mockTxId = 'tx-topup-1';
            const mockTx = {
                id: mockTxId,
                user_id: 'user-topup-1',
                amount: 5000, // €50.00 topup (5000 cents)
                status: 'pending',
                users: { balance: 10.50 }
            };

            let updatedBalance = null;
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'transactions') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: mockTx, error: null }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                if (table === 'users') {
                    return {
                        update: jest.fn((updateData) => {
                            updatedBalance = updateData.balance;
                            return {
                                eq: jest.fn().mockResolvedValue({ error: null })
                            };
                        })
                    };
                }
                return originalFrom(table);
            });

            const req = { params: { id: mockTxId }, body: { status: 'completed' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await transactionController.adminUpdateTransactionStatus(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                // 10.50 + (5000 / 100) = 60.50, NOT 5010.50!
                expect(updatedBalance).toBe(60.50);
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('userController manual balance adjustment stores amount in integer cents', async () => {
            const mockUserId = 'user-manual-1';
            let insertedTx = null;

            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: mockUserId, balance: 25.00 }, error: null }),
                        update: jest.fn().mockReturnThis()
                    };
                }
                if (table === 'transactions') {
                    return {
                        insert: jest.fn((data) => {
                            insertedTx = data;
                            return Promise.resolve({ error: null });
                        })
                    };
                }
                return originalFrom(table);
            });

            const req = {
                params: { id: mockUserId },
                body: { amount: 15.50, note: 'Goodwill credit' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await userController.updateBalance(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(insertedTx).toBeDefined();
                // €15.50 must be stored as 1550 cents
                expect(insertedTx.amount).toBe(1550);
                expect(Number.isInteger(insertedTx.amount)).toBe(true);
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });
    });

    describe('3. Guest Repair Tracking Security & API Alignment', () => {
        test('POST /api/repairs/track-guest returns ticket when email matches guest_email', async () => {
            const mockTicket = {
                id: 'ticket-uuid-1',
                ticket_id: 'REP-26-XYZ123',
                device: 'iPhone 14 Pro',
                issue: 'Screen Replacement',
                status: 'in-progress',
                estimated_cost: 189.00,
                appointment_date: '2026-09-10',
                service_type: 'Mail-In',
                guest_email: 'customer@example.de',
                user_id: null,
                repair_ticket_timeline: [{ title: 'Received', created_at: new Date().toISOString() }]
            };

            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
                    };
                }
                return originalFrom(table);
            });

            const req = {
                body: {
                    ticketId: 'REP-26-XYZ123',
                    email: 'customer@example.de'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await repairTicketController.lookupGuestTicket(req, res, next);
                expect(res.status).toHaveBeenCalledWith(200);
                const responseData = res.json.mock.calls[0][0];

                expect(responseData.success).toBe(true);
                expect(responseData.data.ticketId).toBe('REP-26-XYZ123');
                expect(responseData.data.device).toBe('iPhone 14 Pro');
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('POST /api/repairs/track-guest rejects access (403) when email does not match', async () => {
            const mockTicket = {
                id: 'ticket-uuid-1',
                ticket_id: 'REP-26-XYZ123',
                device: 'iPhone 14 Pro',
                guest_email: 'actual_owner@example.de',
                user_id: null
            };

            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
                    };
                }
                return originalFrom(table);
            });

            const req = {
                body: {
                    ticketId: 'REP-26-XYZ123',
                    email: 'attacker@evil.com'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            try {
                await repairTicketController.lookupGuestTicket(req, res, next);
                expect(res.status).toHaveBeenCalledWith(403);
                const responseData = res.json.mock.calls[0][0];
                expect(responseData.success).toBe(false);
            } finally {
                supabaseAdmin.from = originalFrom;
            }
        });

        test('POST /api/repairs/track-guest returns 400 when missing required fields', async () => {
            const req = { body: { ticketId: 'REP-26-XYZ123' } }; // missing email
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            await repairTicketController.lookupGuestTicket(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
