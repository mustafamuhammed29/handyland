const request = require('supertest');
const app = require('../server');
const { supabaseAdmin } = require('../config/supabase');

describe('Products Endpoints', () => {
    it('GET /api/products should return a list of products', async () => {
        const res = await request(app).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
