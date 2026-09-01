/**
 * backend/tests/p0_security_containment.test.js
 *
 * Comprehensive tests for P0 Security Containment:
 * 1. Disabled routes return HTTP 503 Service Unavailable with safe generic response.
 * 2. Disabled top-up routes do not credit wallet balance or mutate transactions.
 * 3. Disabled GET guest repair route reveals no ticket data.
 * 4. Disabled receipt upload routes do not upload files or issue URLs.
 * 5. POST /api/repairs/track-guest requires ticketId + email and rejects mismatched credentials.
 * 6. Non-disabled routes remain operational without regression.
 */
'use strict';

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'user', name: 'Test User' };
        next();
    },
    authorize: () => (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'admin', name: 'Test Admin' };
        next();
    },
    optionalProtect: (req, res, next) => {
        req.user = { id: '00000000-0000-4000-8000-000000000099', role: 'user', name: 'Test User' };
        next();
    }
}));

const request = require('supertest');
const express = require('express');
const { supabaseAdmin } = require('../config/supabase');

// Import controllers directly for unit tests
const transactionController = require('../controllers/transactionController');
const paymentController = require('../controllers/paymentController');
const orderController = require('../controllers/orderController');
const repairTicketController = require('../controllers/repairTicketController');

// Build isolated Express app for HTTP routing integration tests
const app = express();
app.use(express.json());

const transactionRoutes = require('../routes/transactionRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const orderRoutes = require('../routes/orderRoutes');
const repairRoutes = require('../routes/repairRoutes');

app.use('/api/transactions', transactionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repairs', repairRoutes);

describe('P0 Security Containment & Route Guards', () => {

    describe('1. Disabled Routes Return HTTP 503 with Safe Generic Message', () => {
        const disabledEndpoints = [
            { method: 'post', url: '/api/transactions/paypal/create-topup', body: { amount: 50 } },
            { method: 'post', url: '/api/transactions/paypal/capture-topup', body: { orderID: 'PAYPAL-FAKE-123' } },
            { method: 'post', url: '/api/transactions/create-topup-session', body: { amount: 50 } },
            { method: 'post', url: '/api/transactions/confirm-topup', body: { sessionId: 'cs_fake_123' } },
            { method: 'post', url: '/api/payment/paypal/create-order', body: { items: [{ price: 10, quantity: 1 }] } },
            { method: 'post', url: '/api/payment/paypal/capture-order', body: { orderID: 'PAYPAL-FAKE-123' } },
            { method: 'post', url: '/api/orders/00000000-0000-4000-8000-000000000001/receipt', body: {} },
            { method: 'post', url: '/api/transactions/00000000-0000-4000-8000-000000000001/upload-receipt', body: {} },
            { method: 'get', url: '/api/repairs/track-guest/REP-26-TEST01', body: {} }
        ];

        for (const ep of disabledEndpoints) {
            test(`${ep.method.toUpperCase()} ${ep.url} returns 503 and safe generic message`, async () => {
                const req = ep.method === 'post'
                    ? request(app).post(ep.url).send(ep.body)
                    : request(app).get(ep.url);

                const res = await req;
                expect(res.status).toBe(503);
                expect(res.body.success).toBe(false);
                expect(res.body.error?.code).toBe('SERVICE_UNAVAILABLE');
                expect(res.body.message).toContain('vorübergehend nicht verfügbar');
            });
        }
    });

    describe('2. Disabled Top-up Routes Do Not Mutate Balances or Transactions', () => {
        test('capturePayPalTopUp does not modify user balance or transaction status', async () => {
            let balanceUpdated = false;
            let txUpdated = false;
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'users') {
                    return {
                        update: jest.fn(() => {
                            balanceUpdated = true;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                if (table === 'transactions') {
                    return {
                        update: jest.fn(() => {
                            txUpdated = true;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                body: { orderID: 'FORGED_PAYPAL_ORDER_ID' },
                user: { id: '00000000-0000-4000-8000-000000000099' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await transactionController.capturePayPalTopUp(req, res);
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(503);
            expect(balanceUpdated).toBe(false);
            expect(txUpdated).toBe(false);
        });

        test('confirmTopUp (Stripe) does not modify user balance or transaction status', async () => {
            let balanceUpdated = false;
            let txUpdated = false;
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'users') {
                    return {
                        update: jest.fn(() => {
                            balanceUpdated = true;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                if (table === 'transactions') {
                    return {
                        update: jest.fn(() => {
                            txUpdated = true;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                body: { sessionId: 'cs_forged_session' },
                user: { id: '00000000-0000-4000-8000-000000000099' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await transactionController.confirmTopUp(req, res);
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(503);
            expect(balanceUpdated).toBe(false);
            expect(txUpdated).toBe(false);
        });
    });

    describe('3. Disabled GET Repair Lookup Reveals No Ticket Data', () => {
        test('GET /api/repairs/track-guest/:ticketId does not call database or return details', async () => {
            let dbQueried = false;
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') dbQueried = true;
                return originalFrom.call(supabaseAdmin, table);
            });

            const res = await request(app).get('/api/repairs/track-guest/REP-26-LEAKME');
            supabaseAdmin.from = originalFrom;

            expect(res.status).toBe(503);
            expect(res.body.data).toBeUndefined();
            expect(res.body.ticket).toBeUndefined();
            expect(dbQueried).toBe(false);
        });
    });

    describe('4. Disabled Receipt Upload Routes Do Not Upload or Store Files', () => {
        test('uploadPaymentReceipt returns 503 and does not update order receipt_url', async () => {
            let orderUpdated = false;
            const originalFrom = supabaseAdmin.from;

            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn(() => {
                            orderUpdated = true;
                            return { eq: jest.fn().mockResolvedValue({ error: null }) };
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const req = {
                params: { id: '00000000-0000-4000-8000-000000000001' },
                fileUrl: '/uploads/forged_receipt.pdf',
                user: { id: '00000000-0000-4000-8000-000000000099' }
            };
            const res = {
                statusCode: 200,
                status: function(code) { this.statusCode = code; return this; },
                json: jest.fn()
            };

            await orderController.uploadPaymentReceipt(req, res);
            supabaseAdmin.from = originalFrom;

            expect(res.statusCode).toBe(503);
            expect(orderUpdated).toBe(false);
        });
    });

    describe('5. Temporary Guest Repair Tracking (POST /api/repairs/track-guest)', () => {
        const mockTicket = {
            id: '00000000-0000-4000-8000-000000000088',
            ticket_id: 'REP-26-A1B2C3',
            device: 'iPhone 13 Pro',
            issue: 'Display defekt',
            status: 'in_progress',
            estimated_cost: 149.99,
            appointment_date: '2026-09-10',
            service_type: 'Screen Replacement',
            guest_email: 'customer@example.com',
            user_id: null,
            repair_ticket_timeline: []
        };

        test('Rejects request missing ticketId with 400', async () => {
            const res = await request(app)
                .post('/api/repairs/track-guest')
                .send({ email: 'customer@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Ticket-ID ist erforderlich');
        });

        test('Rejects request missing email with 400', async () => {
            const res = await request(app)
                .post('/api/repairs/track-guest')
                .send({ ticketId: 'REP-26-A1B2C3' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('E-Mail-Adresse ist erforderlich');
        });

        test('Rejects non-existent ticket with 404', async () => {
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const res = await request(app)
                .post('/api/repairs/track-guest')
                .send({ ticketId: 'REP-26-UNKNOWN', email: 'customer@example.com' });

            supabaseAdmin.from = originalFrom;

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Kein Reparaturticket mit dieser Ticket-ID gefunden');
        });

        test('Rejects mismatched email with 403 and discloses no data', async () => {
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const res = await request(app)
                .post('/api/repairs/track-guest')
                .send({ ticketId: 'REP-26-A1B2C3', email: 'attacker@evil.com' });

            supabaseAdmin.from = originalFrom;

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.ticket).toBeUndefined();
            expect(res.body.data).toBeUndefined();
        });

        test('Returns sanitized ticket data when ticketId and email match', async () => {
            const originalFrom = supabaseAdmin.from;
            supabaseAdmin.from = jest.fn((table) => {
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: mockTicket, error: null })
                            })
                        })
                    };
                }
                return originalFrom.call(supabaseAdmin, table);
            });

            const res = await request(app)
                .post('/api/repairs/track-guest')
                .send({ ticketId: 'REP-26-A1B2C3', email: 'customer@example.com' });

            supabaseAdmin.from = originalFrom;

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.ticketId).toBe('REP-26-A1B2C3');
            expect(res.body.data.device).toBe('iPhone 13 Pro');
            expect(res.body.data.status).toBe('in_progress');
        });
    });
});
