const request = require('supertest');
const app = require('../server');
const { supabaseAdmin, createAuthClient } = require('../config/supabase');

describe('Auth Endpoints', () => {
    it('POST /api/auth/register should register a user', async () => {
        supabaseAdmin.auth.admin.createUser.mockResolvedValueOnce({
            data: { user: { id: 'test-id' } },
            error: null
        });
        createAuthClient().auth.signInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token', refresh_token: 'refresh' }, user: { id: 'test-id' } },
            error: null
        });

        const res = await request(app)
            .post('/api/auth/register')
            .set('x-app-type', 'frontend')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/auth/login should log in a user', async () => {
        createAuthClient().auth.signInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token', refresh_token: 'refresh' }, user: { id: 'test-id', email_confirmed_at: '2026-01-01T00:00:00Z' } },
            error: null
        });
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'test-id', is_active: true, is_verified: true, role: 'user' }, error: null }),
            single: jest.fn().mockResolvedValue({ data: { id: 'test-id', is_active: true, is_verified: true, role: 'user' }, error: null })
        };
        supabaseAdmin.from.mockReturnValueOnce(mockQuery);

        const res = await request(app)
            .post('/api/auth/login')
            .set('x-app-type', 'frontend')
            .send({
                email: 'test@example.com',
                password: 'Password123!'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
