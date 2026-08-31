/**
 * backend/tests/socket_and_admin_routes.test.js
 * Focused tests for Socket.IO handshake auth/room derivation and Admin-only route authorization.
 */
'use strict';

const http = require('http');
const express = require('express');
const request = require('supertest');
const { Server } = require('socket.io');
let Client;
try {
    Client = require('socket.io-client');
} catch {
    Client = require('../../front-end/node_modules/socket.io-client');
}

const { initSocket, closeSocket } = require('../utils/socket');
const { supabaseAdmin } = require('../config/supabase');

// Mock supabaseAdmin
jest.mock('../config/supabase', () => ({
    supabaseAdmin: {
        auth: {
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
    createAuthClient: jest.fn(),
}));

describe('Containment Commit 1: Socket.IO & Admin Route Security Tests', () => {
    let server;
    let io;
    let port;

    beforeAll((done) => {
        const app = express();
        server = http.createServer(app);
        io = initSocket(server);
        server.listen(() => {
            port = server.address().port;
            done();
        });
    });

    afterAll(async () => {
        await closeSocket();
        await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. Socket.IO Handshake Authentication & Room Derivation', () => {
        it('1. Should reject connection when handshake auth token is missing', (done) => {
            const clientSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                autoConnect: true,
            });

            clientSocket.on('connect_error', (err) => {
                expect(err.message).toBe('AUTHENTICATION_REQUIRED');
                clientSocket.disconnect();
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.disconnect();
                done(new Error('Connection should have been rejected'));
            });
        });

        it('2. Should reject connection when handshake token is invalid or expired', (done) => {
            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid JWT' },
            });

            const clientSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token: 'invalid_token_123' },
            });

            clientSocket.on('connect_error', (err) => {
                expect(err.message).toBe('INVALID_TOKEN');
                clientSocket.disconnect();
                done();
            });

            clientSocket.on('connect', () => {
                clientSocket.disconnect();
                done(new Error('Connection should have been rejected'));
            });
        });

        it('3. Valid regular user should automatically join only their user rooms and NOT admin room', (done) => {
            const normalUserId = '11111111-1111-1111-1111-111111111111';
            const normalUserEmail = 'user@example.com';

            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: normalUserId } },
                error: null,
            });

            supabaseAdmin.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: { id: normalUserId, email: normalUserEmail, role: 'user', is_active: true },
                            error: null,
                        }),
                    }),
                }),
            });

            const clientSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token: 'valid_user_token' },
            });

            clientSocket.on('connect', () => {
                // Check rooms on the server socket instance
                const serverSockets = Array.from(io.sockets.sockets.values());
                const currentSocket = serverSockets.find((s) => s.id === clientSocket.id);

                expect(currentSocket).toBeDefined();
                expect(currentSocket.rooms.has(`user:${normalUserId}`)).toBe(true);
                expect(currentSocket.rooms.has(`user:${normalUserEmail}`)).toBe(true);
                expect(currentSocket.rooms.has('admin')).toBe(false);

                // Attempt client-controlled join should be ignored (no handler)
                clientSocket.emit('join:admin');
                clientSocket.emit('join', 'victim_user_id');

                setTimeout(() => {
                    expect(currentSocket.rooms.has('admin')).toBe(false);
                    expect(currentSocket.rooms.has('user:victim_user_id')).toBe(false);
                    clientSocket.disconnect();
                    done();
                }, 100);
            });
        });

        it('4. Valid admin user should automatically join user rooms AND admin room', (done) => {
            const adminId = '99999999-9999-9999-9999-999999999999';
            const adminEmail = 'admin@handyland.de';

            supabaseAdmin.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: adminId } },
                error: null,
            });

            supabaseAdmin.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: { id: adminId, email: adminEmail, role: 'admin', is_active: true },
                            error: null,
                        }),
                    }),
                }),
            });

            const clientSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token: 'valid_admin_token' },
            });

            clientSocket.on('connect', () => {
                const serverSockets = Array.from(io.sockets.sockets.values());
                const currentSocket = serverSockets.find((s) => s.id === clientSocket.id);

                expect(currentSocket).toBeDefined();
                expect(currentSocket.rooms.has(`user:${adminId}`)).toBe(true);
                expect(currentSocket.rooms.has(`user:${adminEmail}`)).toBe(true);
                expect(currentSocket.rooms.has('admin')).toBe(true);

                clientSocket.disconnect();
                done();
            });
        });

        it('5. Real Broadcast Isolation: normal user socket cannot receive admin broadcasts, while admin socket receives them', (done) => {
            const normalUserId = '22222222-2222-2222-2222-222222222222';
            const adminId = '88888888-8888-8888-8888-888888888888';

            // First connection auth (normal user)
            supabaseAdmin.auth.getUser
                .mockResolvedValueOnce({ data: { user: { id: normalUserId } }, error: null })
                .mockResolvedValueOnce({ data: { user: { id: adminId } }, error: null });

            supabaseAdmin.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValueOnce({
                        eq: jest.fn().mockReturnValueOnce({
                            single: jest.fn().mockResolvedValueOnce({
                                data: { id: normalUserId, email: 'normal@test.com', role: 'user', is_active: true },
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValueOnce({
                        eq: jest.fn().mockReturnValueOnce({
                            single: jest.fn().mockResolvedValueOnce({
                                data: { id: adminId, email: 'admin@test.com', role: 'admin', is_active: true },
                                error: null,
                            }),
                        }),
                    }),
                });

            const userSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token: 'user_token' },
            });

            const adminSocket = Client(`http://localhost:${port}`, {
                transports: ['websocket'],
                auth: { token: 'admin_token' },
            });

            let userReceivedAdminBroadcast = false;
            let adminReceivedAdminBroadcast = false;

            userSocket.on('admin:notification', () => {
                userReceivedAdminBroadcast = true;
            });

            adminSocket.on('admin:notification', (data) => {
                if (data.type === 'sensitive_admin_alert') {
                    adminReceivedAdminBroadcast = true;
                }
            });

            let connections = 0;
            const onBothConnected = () => {
                connections++;
                if (connections === 2) {
                    // Emit to admin room
                    io.to('admin').emit('admin:notification', { type: 'sensitive_admin_alert', secret: 'confidential' });

                    setTimeout(() => {
                        expect(userReceivedAdminBroadcast).toBe(false);
                        expect(adminReceivedAdminBroadcast).toBe(true);

                        userSocket.disconnect();
                        adminSocket.disconnect();
                        done();
                    }, 100);
                }
            };

            userSocket.on('connect', onBothConnected);
            adminSocket.on('connect', onBothConnected);
        });
    });


    describe('2. Admin Route Protection Middleware Verification', () => {
        let testApp;

        beforeAll(() => {
            testApp = express();
            testApp.use(express.json());
            testApp.use('/api/repairs/archive', require('../routes/repairArchiveRoutes'));
            testApp.use('/api/ebay-catalog', require('../routes/ebayCatalogRoutes'));
        });

        it('5. Unauthenticated request to repair archive mutation routes returns 401', async () => {
            const resPost = await request(testApp).post('/api/repairs/archive').send({ title: 'Test Case' });
            expect(resPost.status).toBe(401);

            const resPut = await request(testApp).put('/api/repairs/archive/case-123').send({ title: 'Updated Case' });
            expect(resPut.status).toBe(401);

            const resDelete = await request(testApp).delete('/api/repairs/archive/case-123');
            expect(resDelete.status).toBe(401);
        });

        it('6. Normal user (role: user) receives 403 Forbidden on repair archive mutations', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null,
            });

            supabaseAdmin.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'user-123', role: 'user', is_active: true },
                            error: null,
                        }),
                    }),
                }),
            });

            const resPost = await request(testApp)
                .post('/api/repairs/archive')
                .set('Authorization', 'Bearer user-token')
                .send({ title: 'Test Case' });
            expect(resPost.status).toBe(403);
            expect(resPost.body.message).toMatch(/not authorized|forbidden|admin/i);

            const resPut = await request(testApp)
                .put('/api/repairs/archive/case-123')
                .set('Authorization', 'Bearer user-token')
                .send({ title: 'Updated' });
            expect(resPut.status).toBe(403);

            const resDelete = await request(testApp)
                .delete('/api/repairs/archive/case-123')
                .set('Authorization', 'Bearer user-token');
            expect(resDelete.status).toBe(403);
        });

        it('7. Normal user receives 403 on eBay catalog search and import routes', async () => {
            supabaseAdmin.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null,
            });

            supabaseAdmin.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'user-123', role: 'user', is_active: true },
                            error: null,
                        }),
                    }),
                }),
            });

            const resSearch = await request(testApp)
                .get('/api/ebay-catalog/search?q=iPhone')
                .set('Authorization', 'Bearer user-token');
            expect(resSearch.status).toBe(403);

            const resImport = await request(testApp)
                .post('/api/ebay-catalog/import')
                .set('Authorization', 'Bearer user-token')
                .send({ devices: [] });
            expect(resImport.status).toBe(403);
        });

        it('8. Public GET /api/repairs/archive remains accessible without credentials', async () => {
            supabaseAdmin.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    order: jest.fn().mockReturnValueOnce({
                        range: jest.fn().mockResolvedValueOnce({
                            data: [{ id: 'case-1', title: 'iPhone 13 Screen', created_at: new Date().toISOString() }],
                            count: 1,
                            error: null,
                        }),
                    }),
                }),
            });

            const res = await request(testApp).get('/api/repairs/archive');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.cases)).toBe(true);
        });
    });
});
