const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:5174'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // ── JWT Authentication Middleware ─────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            // Allow connection but socket will have no verified identity
            socket.verifiedUser = null;
            return next();
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.verifiedUser = decoded; // { id, role, ... }
            next();
        } catch {
            socket.verifiedUser = null;
            next(); // Still allow connection, but restrict room joins below
        }
    });

    io.on('connection', (socket) => {
        // Join user-specific room — only allowed if token matches the requested userId
        socket.on('join', (userId) => {
            if (!userId) return;

            const verified = socket.verifiedUser;
            if (!verified || (verified.id !== userId && verified.role !== 'admin')) {
                console.warn(`[Socket.IO] Unauthorized join attempt for user:${userId} by socket ${socket.id}`);
                return;
            }

            socket.join(`user:${userId}`);
        });

        // Join admin room — only allowed for verified admins
        socket.on('join:admin', () => {
            const verified = socket.verifiedUser;
            if (!verified || verified.role !== 'admin') {
                console.warn(`[Socket.IO] Unauthorized admin join attempt by socket ${socket.id}`);
                return;
            }
            socket.join('admin');
        });

        socket.on('disconnect', () => {
            // Silent disconnect — no log needed in production
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        console.warn('[Socket.IO] Not initialized yet');
        return null;
    }
    return io;
};

// Emit helpers
const emitOrderUpdate = (userId, order) => {
    const socket = getIO();
    if (!socket) {return;}

    // Notify the user
    if (userId) {
        socket.to(`user:${userId}`).emit('order:updated', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus
        });
    }

    // Notify admins
    socket.to('admin').emit('order:updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        userName: order.shippingAddress?.fullName
    });
};

const emitNewOrder = (order) => {
    const socket = getIO();
    if (!socket) {return;}
    socket.to('admin').emit('order:new', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        itemCount: order.items?.length
    });
};

const emitNotification = (userId, notification) => {
    const socket = getIO();
    if (!socket) { return; }
    socket.to(`user:${userId}`).emit('notification', notification);
};

/**
 * Emit a generic real-time notification to ALL connected admins.
 * @param {'new_user'|'new_order'|'new_message'|'new_repair'|'new_valuation'} type
 * @param {Object} payload
 */
const emitAdminNotification = (type, payload) => {
    const socket = getIO();
    if (!socket) { return; }
    socket.to('admin').emit('admin:notification', {
        id: Date.now(),
        type,
        ...payload,
        timestamp: new Date().toISOString(),
    });
};

module.exports = { initSocket, getIO, emitOrderUpdate, emitNewOrder, emitNotification, emitAdminNotification };
