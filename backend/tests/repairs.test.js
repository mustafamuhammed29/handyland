const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => { req.user = { id: 'test-user-id' }; next(); },
    authorize: () => (req, res, next) => next(),
    optionalProtect: (req, res, next) => { req.user = { id: 'test-user-id' }; next(); }
}));

describe('Repairs Endpoints', () => {
    it('GET /api/repairs/my-repairs should return user repairs', async () => {
        supabaseAdmin.from().order.mockResolvedValueOnce({
            data: [{ id: 'repair-1', status: 'pending' }],
            error: null
        });

        const res = await request(app).get('/api/repairs/my-repairs');
        expect(res.status).toBe(200);
    });
});
