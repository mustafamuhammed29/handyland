/**
 * backend/tests/warehouse_movements.test.js
 * Unit and integration tests for Phase 1B warehouse atomic movement service.
 */
'use strict';

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { supabaseAdmin } = require('../config/supabase');
const warehouseRoutes = require('../routes/warehouseRoutes');

// Mock server for isolated route testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/warehouse', warehouseRoutes);

const VALID_PART_ID = '11111111-1111-4111-8111-111111111111';
const VALID_LOC_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_LOC_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ADMIN_USER_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOMER_USER_ID = '88888888-8888-4888-8888-888888888888';

describe('Warehouse Movements API (Phase 1B)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function mockAuthUser(userId, role = 'admin', isActive = true) {
        supabaseAdmin.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: 'admin@handyland.de' } },
            error: null
        });

        supabaseAdmin.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: {
                    id: userId,
                    name: 'Warehouse Admin',
                    email: 'admin@handyland.de',
                    role,
                    is_active: isActive,
                    is_verified: true
                },
                error: null
            })
        });
    }

    describe('Authentication & Role Authorization', () => {
        it('should return 401 if request has no token', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 if authenticated user is not an admin', async () => {
            mockAuthUser(CUSTOMER_USER_ID, 'customer');

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer valid-customer-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should allow active admin user to proceed', async () => {
            mockAuthUser(ADMIN_USER_ID, 'admin');

            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: {
                    movementId: '22222222-2222-4222-8222-222222222222',
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    sourceLocationId: null,
                    destinationLocationId: VALID_LOC_A,
                    sourceAvailableQuantity: null,
                    destinationAvailableQuantity: 15,
                    createdAt: '2026-08-31T20:00:00Z'
                },
                error: null
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.movementType).toBe('RECEIVE');
            expect(res.body.data.destinationAvailableQuantity).toBe(15);
        });
    });

    describe('Input Validation & Strict Schema Enforcement', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should reject invalid or non-UUID repairPartId', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: 'not-a-uuid',
                    movementType: 'RECEIVE',
                    quantity: 5,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
        });

        it('should reject unsupported movement types (e.g. RESERVE or unknown)', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RESERVE',
                    quantity: 1,
                    sourceLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
        });

        it('should reject invalid, zero, negative, or oversized quantities', async () => {
            const invalidQuantities = [0, -5, 100001, 'abc', 3.5];

            for (const qty of invalidQuantities) {
                const res = await request(app)
                    .post('/api/warehouse/movements')
                    .set('Authorization', 'Bearer token')
                    .send({
                        repairPartId: VALID_PART_ID,
                        movementType: 'RECEIVE',
                        quantity: qty,
                        destinationLocationId: VALID_LOC_A
                    });

                expect(res.status).toBe(400);
                expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
            }
        });

        it('should reject RECEIVE when destinationLocationId is missing or sourceLocationId is supplied', async () => {
            const resNoDest = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5
                });
            expect(resNoDest.status).toBe(400);

            const resWithSource = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: VALID_LOC_B
                });
            expect(resWithSource.status).toBe(400);
        });

        it('should reject TRANSFER when source and destination are the same', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'TRANSFER',
                    quantity: 3,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
        });

        it('should reject adjustments and damage when reason is missing or empty', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'DAMAGE',
                    quantity: 1,
                    sourceLocationId: VALID_LOC_A,
                    reason: '   '
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
        });

        it('should reject client-supplied lifecycle or override fields', async () => {
            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 5,
                    destinationLocationId: VALID_LOC_A,
                    performedBy: 'attacker-uuid',
                    repairTicketId: 'ticket-uuid',
                    costPrice: 50
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_INVALID');
        });
    });

    describe('Atomic Movement Operations & Server-Side Actor Derivation', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should pass server-derived actor ID to RPC for TRANSFER', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: {
                    movementId: '33333333-3333-4333-8333-333333333333',
                    repairPartId: VALID_PART_ID,
                    movementType: 'TRANSFER',
                    quantity: 2,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: VALID_LOC_B,
                    sourceAvailableQuantity: 8,
                    destinationAvailableQuantity: 12,
                    createdAt: '2026-08-31T20:05:00Z'
                },
                error: null
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'TRANSFER',
                    quantity: 2,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: VALID_LOC_B,
                    notes: 'Internal reorganization'
                });

            expect(res.status).toBe(201);
            expect(supabaseAdmin.rpc).toHaveBeenCalledWith('apply_part_stock_movement', {
                p_repair_part_id: VALID_PART_ID,
                p_movement_type: 'TRANSFER',
                p_quantity: 2,
                p_source_location_id: VALID_LOC_A,
                p_destination_location_id: VALID_LOC_B,
                p_performed_by: ADMIN_USER_ID,
                p_reason: null,
                p_notes: 'Internal reorganization'
            });

            // Verify sanitized response — notes and cost must NOT be echoed
            expect(res.body.data.notes).toBeUndefined();
            expect(res.body.data.costPrice).toBeUndefined();
            expect(res.body.data.sourceAvailableQuantity).toBe(8);
            expect(res.body.data.destinationAvailableQuantity).toBe(12);
        });

        it('should handle DAMAGE movement with mandatory reason', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: {
                    movementId: '44444444-4444-4444-8444-444444444444',
                    repairPartId: VALID_PART_ID,
                    movementType: 'DAMAGE',
                    quantity: 1,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: null,
                    sourceAvailableQuantity: 7,
                    destinationAvailableQuantity: null,
                    createdAt: '2026-08-31T20:10:00Z'
                },
                error: null
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'DAMAGE',
                    quantity: 1,
                    sourceLocationId: VALID_LOC_A,
                    reason: 'Cracked during unpacking'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.sourceAvailableQuantity).toBe(7);
        });

        it('should handle SUPPLIER_RETURN movement with mandatory reason', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: {
                    movementId: '55555555-5555-4555-8555-555555555555',
                    repairPartId: VALID_PART_ID,
                    movementType: 'SUPPLIER_RETURN',
                    quantity: 3,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: null,
                    sourceAvailableQuantity: 4,
                    destinationAvailableQuantity: null,
                    createdAt: '2026-08-31T20:12:00Z'
                },
                error: null
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'SUPPLIER_RETURN',
                    quantity: 3,
                    sourceLocationId: VALID_LOC_A,
                    reason: 'RMA return to supplier'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.movementType).toBe('SUPPLIER_RETURN');
        });
    });

    describe('Domain Error Mapping & Security Fallbacks', () => {
        beforeEach(() => {
            mockAuthUser(ADMIN_USER_ID, 'admin');
        });

        it('should map INSUFFICIENT_AVAILABLE_STOCK to HTTP 409', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'INSUFFICIENT_AVAILABLE_STOCK' }
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'ADJUSTMENT_OUT',
                    quantity: 10,
                    sourceLocationId: VALID_LOC_A,
                    reason: 'Audit reconciliation'
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_INSUFFICIENT_STOCK');
        });

        it('should map PART_NOT_ACTIVE or location errors to HTTP 409 without leaking metadata', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'PART_NOT_ACTIVE' }
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 1,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_PART_OR_LOCATION_NOT_AVAILABLE');
        });

        it('should map deadlock / serialization conflict to HTTP 409', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'deadlock detected in transaction (40P01)' }
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'TRANSFER',
                    quantity: 1,
                    sourceLocationId: VALID_LOC_A,
                    destinationLocationId: VALID_LOC_B
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('WAREHOUSE_MOVEMENT_CONFLICT');
        });

        it('should map unexpected database errors to 503 without leaking raw SQL or credentials', async () => {
            supabaseAdmin.rpc.mockResolvedValueOnce({
                data: null,
                error: { message: 'FATAL: database connection lost at 10.0.0.1 (SELECT * FROM private_secrets)' }
            });

            const res = await request(app)
                .post('/api/warehouse/movements')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    repairPartId: VALID_PART_ID,
                    movementType: 'RECEIVE',
                    quantity: 1,
                    destinationLocationId: VALID_LOC_A
                });

            expect(res.status).toBe(503);
            expect(res.body.error).toBe('WAREHOUSE_SERVICE_UNAVAILABLE');
            expect(res.body.message).not.toContain('private_secrets');
            expect(res.body.message).not.toContain('10.0.0.1');
        });
    });
});
