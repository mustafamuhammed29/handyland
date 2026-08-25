/**
 * backend/tests/lifecycle_infra.test.js
 * Tests for Background Cron, Socket.IO Lifecycle, Idempotent Teardown, and Event Broadcasters.
 */
'use strict';

const http = require('http');
const { initSocket, getIO, closeSocket, emitOrderUpdate, emitNewOrder, emitNotification, emitAdminNotification, emitUserMessage } = require('../utils/socket');
const { initCronJobs, stopCronJobs } = require('../services/cronService');

describe('Infrastructure Lifecycle & Background Services Teardown', () => {
    afterEach(async () => {
        await closeSocket();
        stopCronJobs();
    });

    describe('1. Background Services Teardown Idempotency', () => {
        it('stopCronJobs() can be called repeatedly without throwing', () => {
            expect(() => {
                stopCronJobs();
                stopCronJobs();
                stopCronJobs();
            }).not.toThrow();
        });

        it('closeSocket() can be called repeatedly without throwing', async () => {
            await expect(closeSocket()).resolves.toBeUndefined();
            await expect(closeSocket()).resolves.toBeUndefined();
            await expect(closeSocket()).resolves.toBeUndefined();
        });
    });

    describe('2. Socket.IO Event Broadcaster Graceful Degradation', () => {
        it('emitOrderUpdate should not throw when socket is uninitialized', () => {
            expect(() => {
                emitOrderUpdate('user-1', { _id: 'o-1', orderNumber: 'HL-1', status: 'delivered', paymentStatus: 'paid' });
            }).not.toThrow();
        });

        it('emitNewOrder should not throw when socket is uninitialized', () => {
            expect(() => {
                emitNewOrder({ _id: 'o-1', orderNumber: 'HL-1', totalAmount: 100, items: [] });
            }).not.toThrow();
        });

        it('emitNotification should not throw when socket is uninitialized', () => {
            expect(() => {
                emitNotification('user-1', { title: 'Hello', message: 'World' });
            }).not.toThrow();
        });

        it('emitAdminNotification should not throw when socket is uninitialized', () => {
            expect(() => {
                emitAdminNotification('new_order', { title: 'New order' });
            }).not.toThrow();
        });

        it('emitUserMessage should not throw when socket is uninitialized', () => {
            expect(() => {
                emitUserMessage('user-1', { type: 'reply', text: 'hi' });
            }).not.toThrow();
        });
    });

    describe('3. Socket.IO Real Emission to Rooms with Mocked Server', () => {
        let testHttpServer;

        beforeEach((done) => {
            testHttpServer = http.createServer();
            testHttpServer.listen(0, () => {
                initSocket(testHttpServer);
                done();
            });
        });

        afterEach(async () => {
            await closeSocket();
            if (testHttpServer && testHttpServer.listening) {
                await new Promise((resolve) => testHttpServer.close(resolve));
            }
        });

        it('getIO() should return the active Socket.IO server after initSocket()', () => {
            const io = getIO();
            expect(io).toBeDefined();
            expect(typeof io.to).toBe('function');
        });

        it('emitOrderUpdate should broadcast to user and admin rooms', () => {
            const io = getIO();
            const emitMock = jest.fn();
            const toSpy = jest.spyOn(io, 'to').mockReturnValue({ emit: emitMock });

            emitOrderUpdate('user-99', {
                _id: 'order-99',
                orderNumber: 'HL-2026-99',
                status: 'shipped',
                paymentStatus: 'paid',
                shippingAddress: { fullName: 'Alice Example' }
            });

            expect(toSpy).toHaveBeenCalledWith('user:user-99');
            expect(toSpy).toHaveBeenCalledWith('admin');
            expect(emitMock).toHaveBeenCalledWith('order:updated', expect.objectContaining({
                orderId: 'order-99',
                orderNumber: 'HL-2026-99',
                status: 'shipped'
            }));
        });

        it('emitAdminNotification should broadcast structured payload to admin room', () => {
            const io = getIO();
            const emitMock = jest.fn();
            jest.spyOn(io, 'to').mockReturnValue({ emit: emitMock });

            emitAdminNotification('new_repair', {
                title: 'New Repair Ticket',
                body: 'iPhone 15 screen replacement'
            });

            expect(emitMock).toHaveBeenCalledWith('admin:notification', expect.objectContaining({
                type: 'new_repair',
                title: 'New Repair Ticket',
                body: 'iPhone 15 screen replacement'
            }));
        });
    });
});
