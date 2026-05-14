const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => { req.user = { id: 'test-user-id', role: 'admin' }; next(); },
    authorize: () => (req, res, next) => next(),
    optionalProtect: (req, res, next) => { req.user = { id: 'test-user-id', role: 'admin' }; next(); }
}));

describe('Users Endpoints', () => {
    it('GET /api/users should return all users for admin', async () => {
        supabaseAdmin.from().order.mockResolvedValueOnce({
            data: [{ id: 'user-1', email: 'test@admin.com' }],
            error: null,
            count: 1
        });

        const res = await request(app).get('/api/users/admin/all');
        expect(res.status).toBe(200);
    });
});
