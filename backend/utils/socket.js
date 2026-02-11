const { Server } = require('socket.io');

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

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Join user-specific room for private notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`[Socket.IO] User ${userId} joined their room`);
            }
        });

        // Join admin room
        socket.on('join:admin', () => {
            socket.join('admin');
            console.log(`[Socket.IO] Admin joined`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
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
    if (!socket) return;

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
    if (!socket) return;
    socket.to('admin').emit('order:new', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        itemCount: order.items?.length
    });
};

const emitNotification = (userId, notification) => {
    const socket = getIO();
    if (!socket) return;
    socket.to(`user:${userId}`).emit('notification', notification);
};

module.exports = { initSocket, getIO, emitOrderUpdate, emitNewOrder, emitNotification };
