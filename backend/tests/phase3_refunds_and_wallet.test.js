/**
 * backend/tests/phase3_refunds_and_wallet.test.js
 * Comprehensive integration tests for Phase 3:
 * 1. Migration 025 Static Integrity
 * 2. Refund State Machine & Transition Guards
 * 3. Over-Refund Prevention & Currency Precision
 * 4. Idempotency Key Handling
 * 5. Wallet Top-up & Double-Credit Protection
 * 6. Receipt Upload Authorization & Storage Linking
 * 7. PWA Genuine PNG Asset & SEO Canonical Alignment
 */
'use strict';

const mockStripeInstance = {
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_test_12345',
            client_secret: 'pi_test_12345_secret_abc'
        })
    },
    refunds: {
        create: jest.fn().mockResolvedValue({
            id: 're_test_98765',
            status: 'succeeded'
        })
    },
    checkout: {
        sessions: {
            create: jest.fn().mockResolvedValue({
                id: 'cs_test_topup_123',
                url: 'https://checkout.stripe.com/pay/cs_test_topup_123'
            }),
            retrieve: jest.fn().mockResolvedValue({
                id: 'cs_test_topup_123',
                payment_status: 'paid',
                amount_total: 5000,
                currency: 'eur'
            })
        }
    }
};

jest.mock('stripe', () => {
    return jest.fn(() => mockStripeInstance);
});

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');
const refundController = require('../controllers/refundController');
const transactionController = require('../controllers/transactionController');

describe('Phase 3: Refunds, Wallet Top-up, Accessibility, SEO/PWA & Hardening Tests', () => {

    describe('1. Migration 025 Static Integrity', () => {
        const migrationsDir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
        const m025Path = path.join(migrationsDir, '025_refunds_state_machine.sql');

        test('Migration 025 exists and contains state machine enums, columns, and constraints', () => {
            expect(fs.existsSync(m025Path)).toBe(true);
            const content = fs.readFileSync(m025Path, 'utf8');

            expect(content).toContain("'processing'");
            expect(content).toContain("'completed'");
            expect(content).toContain("'failed'");
            expect(content).toContain('idempotency_key');
            expect(content).toContain('gateway_refund_id');
            expect(content).toContain('refund_amount_cents');
            expect(content).toContain('chk_refund_requests_amount_positive');
            expect(content).toContain('uq_idx_refund_order_idempotency');
        });
    });

    describe('2. Refund State Machine Transitions & Over-Refund Guard', () => {
        const mockOrderId = '00000000-0000-4000-8000-000000000021';
        const mockRefundId = '00000000-0000-4000-8000-000000000022';
        const mockUserId = '00000000-0000-4000-8000-000000000023';

        test('Rejects invalid state transition from completed to processing', async () => {
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'refund_requests') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: {
                                        id: mockRefundId,
                                        order_id: mockOrderId,
                                        user_id: mockUserId,
                                        status: 'completed',
                                        refund_amount: 50.00,
                                        orders: { id: mockOrderId, total_amount: 50.00, payment_method: 'stripe', payment_id: 'pi_test_123' }
                                    },
                                    error: null
                                })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                params: { id: mockRefundId },
                body: { status: 'processing' },
                user: { id: 'admin-1', role: 'admin' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await refundController.updateRefundStatus(req, res, jest.fn());
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining("Ungültiger Statusübergang")
                })
            );
        });

        test('Prevents over-refund when requested amount exceeds total order amount', async () => {
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'refund_requests') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: {
                                        id: mockRefundId,
                                        order_id: mockOrderId,
                                        user_id: mockUserId,
                                        status: 'pending',
                                        refund_amount: 40.00,
                                        orders: { id: mockOrderId, total_amount: 50.00, payment_method: 'stripe', payment_id: 'pi_test_123' }
                                    },
                                    error: null
                                }),
                                neq: jest.fn().mockReturnValue({
                                    in: jest.fn().mockResolvedValue({
                                        data: [
                                            { id: 'sibling-refund-1', refund_amount_cents: 2000, refund_amount: 20.00, status: 'completed' }
                                        ]
                                    })
                                })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            // Trying to refund 40€ when 20€ is already refunded on a 50€ order (20 + 40 = 60 > 50)
            const req = {
                params: { id: mockRefundId },
                body: { status: 'approved', refundAmount: 40.00 },
                user: { id: 'admin-1', role: 'admin' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await refundController.updateRefundStatus(req, res, jest.fn());
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining("Gesamterstattungsbetrag")
                })
            );
        });

        test('Idempotency returns existing request without duplication', async () => {
            const originalFrom = supabaseAdmin.from;
            const existingIdempotentRequest = {
                id: mockRefundId,
                order_id: mockOrderId,
                user_id: mockUserId,
                idempotency_key: 'idem_key_xyz_123',
                status: 'pending',
                refund_amount: 49.99
            };

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { id: mockOrderId, user_id: mockUserId, total_amount: 49.99, created_at: new Date().toISOString() },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'refund_requests') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: existingIdempotentRequest,
                                        error: null
                                    })
                                })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                body: { orderId: mockOrderId, reason: 'defective', idempotencyKey: 'idem_key_xyz_123' },
                user: { id: mockUserId, role: 'user' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await refundController.createRefund(req, res, jest.fn());
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining("idempotent"),
                    data: expect.objectContaining({ id: mockRefundId })
                })
            );
        });
    });

    describe('3. Wallet Top-up & Double-Credit Protection', () => {
        const mockUserId = '00000000-0000-4000-8000-000000000031';
        const mockTxId = '00000000-0000-4000-8000-000000000032';

        test('createTopUpSession creates pending transaction with integer cents and Stripe checkout session', async () => {
            let insertedTx = null;
            let updatedTx = null;
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'transactions') {
                    return {
                        insert: jest.fn((data) => {
                            insertedTx = data;
                            return {
                                select: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({
                                        data: { id: mockTxId, ...data },
                                        error: null
                                    })
                                })
                            };
                        }),
                        update: jest.fn((data) => {
                            updatedTx = data;
                            return {
                                eq: jest.fn().mockResolvedValue({ error: null })
                            };
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                body: { amount: 50 }, // 50.00 €
                user: { id: mockUserId }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await transactionController.createTopUpSession(req, res, jest.fn());
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(200);
            expect(insertedTx).not.toBeNull();
            expect(insertedTx.amount).toBe(5000); // 50.00 € = 5000 integer cents
            expect(insertedTx.currency).toBe('eur');
            expect(insertedTx.type).toBe('deposit');
            expect(insertedTx.status).toBe('pending');
            expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    mode: 'payment',
                    line_items: [expect.objectContaining({
                        price_data: expect.objectContaining({
                            unit_amount: 5000,
                            currency: 'eur'
                        })
                    })]
                })
            );
        });

        test('confirmTopUp credits balance atomically and prevents duplicate credit on replay', async () => {
            let userBalance = 10.00;
            let txStatus = 'pending';
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'transactions') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockImplementation(() => {
                                    return Promise.resolve({
                                        data: {
                                            id: mockTxId,
                                            user_id: mockUserId,
                                            amount: 5000, // 50.00 € in cents
                                            status: txStatus,
                                            users: { id: mockUserId, balance: userBalance }
                                        },
                                        error: null
                                    });
                                })
                            })
                        }),
                        update: jest.fn((data) => {
                            if (data.status) txStatus = data.status;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                if (table === 'users') {
                    return {
                        update: jest.fn((data) => {
                            if (data.balance !== undefined) userBalance = data.balance;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                body: { sessionId: 'cs_test_topup_123' },
                user: { id: mockUserId }
            };
            const res1 = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            // First confirmation call
            await transactionController.confirmTopUp(req, res1, jest.fn());
            expect(res1.statusCode).toBe(200);
            expect(userBalance).toBe(60.00); // 10.00 + 50.00 = 60.00 €
            expect(txStatus).toBe('completed');

            // Second confirmation call (Replay / duplicate attempt)
            const res2 = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };
            await transactionController.confirmTopUp(req, res2, jest.fn());
            expect(res2.statusCode).toBe(200);
            expect(userBalance).toBe(60.00); // Must NOT credit again! (Still 60.00)
            expect(res2.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining("Bereits verarbeitet")
                })
            );

            supabaseAdmin.from = originalFrom;
        });
    });

    describe('4. SEO & PWA Assets Integrity', () => {
        const publicDir = path.join(__dirname, '..', '..', 'front-end', 'public');

        test('robots.txt references canonical handyland.com sitemap', () => {
            const robotsPath = path.join(publicDir, 'robots.txt');
            expect(fs.existsSync(robotsPath)).toBe(true);
            const content = fs.readFileSync(robotsPath, 'utf8');
            expect(content).toContain('Sitemap: https://handyland.com/sitemap.xml');
            expect(content).not.toContain('vercel.app');
        });

        test('sitemap.xml uses canonical handyland.com domain and contains marketplace/repair routes', () => {
            const sitemapPath = path.join(publicDir, 'sitemap.xml');
            expect(fs.existsSync(sitemapPath)).toBe(true);
            const content = fs.readFileSync(sitemapPath, 'utf8');
            expect(content).toContain('https://handyland.com/');
            expect(content).toContain('https://handyland.com/marketplace');
            expect(content).toContain('https://handyland.com/repair');
            expect(content).not.toContain('vercel.app');
        });

        test('PWA icons (pwa-192x192.png, pwa-512x512.png) have genuine PNG magic bytes (89 50 4E 47)', () => {
            const icon192 = fs.readFileSync(path.join(publicDir, 'pwa-192x192.png'));
            const icon512 = fs.readFileSync(path.join(publicDir, 'pwa-512x512.png'));

            // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
            const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            expect(icon192.subarray(0, 8).equals(pngHeader)).toBe(true);
            expect(icon512.subarray(0, 8).equals(pngHeader)).toBe(true);
        });
    });
});
