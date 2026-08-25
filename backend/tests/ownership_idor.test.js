/**
 * backend/tests/ownership_idor.test.js
 * Comprehensive tests for Resource Ownership Boundaries and IDOR Vulnerability Audit.
 */
'use strict';

const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

jest.mock('../utils/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

describe('Resource Ownership & IDOR Vulnerability Audit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const setupAuthUser = (userId = 'user-alice-123', role = 'user') => {
        supabaseAdmin.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: `${userId}@test.com` } },
            error: null
        });

        return {
            id: userId,
            name: `User ${userId}`,
            email: `${userId}@test.com`,
            role: role,
            is_active: true,
            is_verified: true
        };
    };

    describe('1. Address Resource Ownership Enforcement', () => {
        it('PUT /api/addresses/:id should enforce user_id scoping and return 404 when address belongs to another user', async () => {
            const user = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: user, error: null })
                    };
                }
                if (table === 'addresses') {
                    return {
                        update: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: null, error: null })
                                })
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .put('/api/addresses/address-belonging-to-bob')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ city: 'Berlin' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Address not found');
        });

        it('DELETE /api/addresses/:id should enforce user_id scoping on deletion query', async () => {
            const user = setupAuthUser('user-alice-123', 'user');
            const eqMock = jest.fn().mockReturnThis();

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: user, error: null })
                    };
                }
                if (table === 'addresses') {
                    return {
                        delete: jest.fn().mockReturnValue({
                            eq: eqMock
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/addresses/address-123')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(200);
            expect(eqMock).toHaveBeenCalledWith('user_id', 'user-alice-123');
        });
    });

    describe('2. Order Ownership Boundaries (IDOR Prevention)', () => {
        it('GET /api/orders/:id should return 403 Forbidden when User Alice attempts to view User Bob order', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'order-bob-456',
                                    user_id: 'user-bob-789', // Belongs to Bob!
                                    order_number: 'HL-2026-BOB',
                                    total_amount: 150
                                },
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .get('/api/orders/order-bob-456')
                .set('Authorization', 'Bearer token-alice');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized');
        });

        it('GET /api/orders/:id should return 200 when Admin accesses any user order', async () => {
            const admin = setupAuthUser('admin-root-001', 'admin');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: admin, error: null })
                    };
                }
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'order-bob-456',
                                    user_id: 'user-bob-789',
                                    order_number: 'HL-2026-BOB',
                                    total_amount: 150
                                },
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .get('/api/orders/order-bob-456')
                .set('Authorization', 'Bearer token-admin');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('3. Repair Ticket Ownership Boundaries', () => {
        it('GET /api/repairs/:id should return 403 Forbidden when User Alice attempts to view User Bob repair ticket', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'repair_tickets') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'ticket-bob-999',
                                    user_id: 'user-bob-789', // Belongs to Bob!
                                    ticket_id: 'REP-26-BOB',
                                    device: 'iPhone 15 Pro'
                                },
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .get('/api/repairs/tickets/ticket-bob-999')
                .set('Authorization', 'Bearer token-alice');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized');
        });
    });

    describe('4. Refund Request Ownership Boundaries', () => {
        it('POST /api/refunds should return 403 when User Alice attempts to request a refund on User Bob order', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'orders') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'order-bob-456',
                                    user_id: 'user-bob-789', // Belongs to Bob!
                                    created_at: new Date().toISOString()
                                },
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/refunds')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ orderId: 'order-bob-456', reason: 'Defective item' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized');
        });

        it('DELETE /api/refunds/:id should return 403 when User Alice attempts to delete User Bob refund request', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'refund_requests') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'refund-bob-777',
                                    user_id: 'user-bob-789', // Belongs to Bob!
                                    order_id: 'order-bob-456'
                                },
                                error: null
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/refunds/refund-bob-777')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized');
        });
    });

    describe('5. Cart Item Deletion Ownership Scoping (Regression Tests)', () => {
        it('Attacker User Alice cannot delete User Bob cart item and receives 404 without leaking item existence', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');
            let capturedDeleteFilters = [];

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'carts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: 'cart-alice-111' }, error: null })
                    };
                }
                if (table === 'cart_items') {
                    return {
                        delete: jest.fn().mockReturnValue({
                            eq: jest.fn().mockImplementation((col1, val1) => {
                                capturedDeleteFilters.push({ col: col1, val: val1 });
                                return {
                                    eq: jest.fn().mockImplementation((col2, val2) => {
                                        capturedDeleteFilters.push({ col: col2, val: val2 });
                                        return {
                                            select: jest.fn().mockResolvedValue({ data: [], error: null }) // 0 rows deleted because item belongs to Bob
                                        };
                                    })
                                };
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/cart/bob-item-uuid-999')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Cart item not found');
            // Verifies that deletion was scoped to Alice's cart
            expect(capturedDeleteFilters).toEqual([
                { col: 'id', val: 'bob-item-uuid-999' },
                { col: 'cart_id', val: 'cart-alice-111' }
            ]);
        });

        it('no-row cart lookup (PGRST116) returns 404 Cart item not found without insert side effects', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');
            const insertCartMock = jest.fn();

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'carts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
                            })
                        }),
                        insert: insertCartMock
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/cart/nonexistent-item-123')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Cart item not found');
            expect(insertCartMock).not.toHaveBeenCalled();
        });

        it('unexpected Supabase lookup error reaches error middleware and does not return normal ownership 404', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'carts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { code: '57014', message: 'query_canceled: database connection timeout' }
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/cart/item-123')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            // Must NOT return the standard 404 Cart item not found; must propagate to error handler (500)
            expect(res.status).toBe(500);
            expect(res.body.message).not.toBe('Cart item not found');
        });

        it('Owner User Alice successfully deletes her own cart item', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'carts') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: 'cart-alice-111', cart_items: [] }, error: null })
                    };
                }
                if (table === 'cart_items') {
                    return {
                        delete: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    select: jest.fn().mockResolvedValue({
                                        data: [{ id: 'alice-item-123', cart_id: 'cart-alice-111' }],
                                        error: null
                                    })
                                })
                            })
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .delete('/api/cart/alice-item-123')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('6. Support-Message Reply Ownership & Authorization (Regression Tests)', () => {
        it('Ordinary User Alice attempting to reply to User Bob message receives 403 Forbidden with zero side effects', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');
            const insertReplyMock = jest.fn();
            const updateMessageMock = jest.fn();

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-bob-555',
                                    user_id: 'user-bob-789', // Message owned by Bob
                                    email: 'bob@test.com',
                                    name: 'Bob Test',
                                    message: 'Help with my order'
                                },
                                error: null
                            })
                        }),
                        update: updateMessageMock
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-bob-555/reply')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ message: 'Unauthorized reply injection attempt' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to reply to this message');
            // Assert zero database mutations or side effects
            expect(insertReplyMock).not.toHaveBeenCalled();
            expect(updateMessageMock).not.toHaveBeenCalled();
        });

        it('Attacker claiming matching email but different user_id receives 403 (proving email fallback removal)', async () => {
            // Alice's email matches the message email 'shared@test.com', BUT user_id differs ('user-alice-123' vs 'user-bob-789')
            const userAlice = {
                id: 'user-alice-123',
                name: 'Alice Attacker',
                email: 'shared@test.com',
                role: 'user',
                is_active: true,
                is_verified: true
            };
            supabaseAdmin.auth.getUser.mockResolvedValue({
                data: { user: { id: userAlice.id, email: userAlice.email } },
                error: null
            });
            const insertReplyMock = jest.fn();

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-target-999',
                                    user_id: 'user-bob-789', // Target message owned by Bob
                                    email: 'shared@test.com', // Message has same email string
                                    name: 'Target User',
                                    message: 'Sensitive inquiry'
                                },
                                error: null
                            })
                        })
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-target-999/reply')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ message: 'Exploit attempt via email match' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to reply to this message');
            expect(insertReplyMock).not.toHaveBeenCalled();
        });

        it('Unowned guest message (user_id is null) cannot be replied to by arbitrary authenticated user and returns 403', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');
            const insertReplyMock = jest.fn();

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-guest-404',
                                    user_id: null, // Guest message without user_id
                                    email: 'guest@test.com',
                                    name: 'Guest Customer',
                                    message: 'Guest question'
                                },
                                error: null
                            })
                        })
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-guest-404/reply')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ message: 'Attempting to reply to unowned guest message' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Not authorized to reply to this message');
            expect(insertReplyMock).not.toHaveBeenCalled();
        });

        it('Message Owner User Alice can successfully reply to her own message thread', async () => {
            const userAlice = setupAuthUser('user-alice-123', 'user');
            const insertReplyMock = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'reply-1',
                            message_id: 'msg-alice-111',
                            message: 'Here is additional info',
                            is_admin: false,
                            user_id: 'user-alice-123',
                            created_at: new Date().toISOString()
                        },
                        error: null
                    })
                })
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: userAlice, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-alice-111',
                                    user_id: 'user-alice-123', // Owned by Alice
                                    email: 'user-alice-123@test.com',
                                    name: 'Alice',
                                    message: 'Support request from Alice',
                                    message_replies: []
                                },
                                error: null
                            })
                        })
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-alice-111/reply')
                .set('Authorization', 'Bearer token-alice')
                .set('x-app-type', 'frontend')
                .send({ message: 'Here is additional info' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(insertReplyMock).toHaveBeenCalledWith(expect.objectContaining({
                message_id: 'msg-alice-111',
                message: 'Here is additional info',
                is_admin: false,
                user_id: 'user-alice-123'
            }));
        });

        it('Staff user can reply to any user message and updates thread', async () => {
            const staff = setupAuthUser('staff-sam-002', 'staff');
            const insertReplyMock = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'reply-staff-1',
                            message_id: 'msg-bob-555',
                            message: 'Staff reply on ticket',
                            is_admin: true,
                            user_id: 'staff-sam-002',
                            created_at: new Date().toISOString()
                        },
                        error: null
                    })
                })
            });
            const updateMessageMock = jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: {}, error: null })
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: staff, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-bob-555',
                                    user_id: 'user-bob-789',
                                    email: 'bob@test.com',
                                    name: 'Bob',
                                    message: 'Help needed',
                                    message_replies: []
                                },
                                error: null
                            })
                        }),
                        update: updateMessageMock
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-bob-555/reply')
                .set('Authorization', 'Bearer token-staff')
                .set('x-app-type', 'admin')
                .send({ message: 'Staff reply on ticket' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(insertReplyMock).toHaveBeenCalledWith(expect.objectContaining({
                is_admin: true,
                user_id: 'staff-sam-002'
            }));
            expect(updateMessageMock).toHaveBeenCalledWith(expect.objectContaining({
                status: 'replied'
            }));
        });

        it('Admin can reply to any user message and marks status as replied', async () => {
            const admin = setupAuthUser('admin-root-001', 'admin');
            const insertReplyMock = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: {
                            id: 'reply-admin-1',
                            message_id: 'msg-bob-555',
                            message: 'We have solved your ticket',
                            is_admin: true,
                            user_id: 'admin-root-001',
                            created_at: new Date().toISOString()
                        },
                        error: null
                    })
                })
            });
            const updateMessageMock = jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: {}, error: null })
            });

            supabaseAdmin.from.mockImplementation((table) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: admin, error: null })
                    };
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-bob-555',
                                    user_id: 'user-bob-789',
                                    email: 'bob@test.com',
                                    name: 'Bob',
                                    message: 'Help needed',
                                    message_replies: []
                                },
                                error: null
                            })
                        }),
                        update: updateMessageMock
                    };
                }
                if (table === 'message_replies') {
                    return { insert: insertReplyMock };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const res = await request(app)
                .post('/api/messages/msg-bob-555/reply')
                .set('Authorization', 'Bearer token-admin')
                .set('x-app-type', 'admin')
                .send({ message: 'We have solved your ticket' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(insertReplyMock).toHaveBeenCalledWith(expect.objectContaining({
                is_admin: true,
                user_id: 'admin-root-001'
            }));
            expect(updateMessageMock).toHaveBeenCalledWith(expect.objectContaining({
                status: 'replied'
            }));
        });
    });
});
