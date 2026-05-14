const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => { req.user = { id: 'test-user-id' }; next(); },
    authorize: () => (req, res, next) => next(),
    optionalProtect: (req, res, next) => { req.user = { id: 'test-user-id' }; next(); }
}));

describe('Orders Endpoints', () => {
    it('GET /api/orders/myorders should return user orders', async () => {
        supabaseAdmin.from().order.mockResolvedValueOnce({
            data: [{ id: 'order-1', total_amount: 100 }],
            error: null
        });

        const res = await request(app).get('/api/orders/my');
        expect(res.status).toBe(200);
    });
});
