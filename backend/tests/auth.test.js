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
            data: { session: { access_token: 'token', refresh_token: 'refresh' }, user: { id: 'test-id' } },
            error: null
        });
        supabaseAdmin.from().single.mockResolvedValueOnce({
            data: { id: 'test-id', is_active: true },
            error: null
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123!'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
