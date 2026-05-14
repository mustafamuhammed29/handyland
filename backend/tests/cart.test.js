const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

// Mock authenticate middleware for protected routes
jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    },
    authorize: () => (req, res, next) => next(),
    optionalProtect: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    }
}));

describe('Cart Endpoints', () => {
    it('GET /api/cart should return user cart', async () => {
        supabaseAdmin.from().single.mockResolvedValueOnce({
            data: { id: 'cart-1', items: [] },
            error: null
        });

        const res = await request(app).get('/api/cart');
        expect(res.status).toBe(200);
    });
});
