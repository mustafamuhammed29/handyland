const { Server } = require('socket.io');
const { supabaseAdmin } = require('../config/supabase');

let io;

const initSocket = (httpServer) => {
    const defaultOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
    ];

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : defaultOrigins;

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
                    return callback(null, true);
                }
                return callback(new Error('CORS: Origin not allowed: ' + origin), false);
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // ── JWT Authentication Middleware ─────────────────────────────────────────
    io.use(async (socket, next) => {
        let token = socket.handshake.auth?.token;

        // Fallback: extract token from Authorization header or HTTP-only cookies if available
        if (!token && socket.handshake.headers.authorization) {
            token = socket.handshake.headers.authorization.replace('Bearer ', '').trim();
        }
        if (!token && socket.handshake.headers.cookie) {
            try {
                const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
                    const [key, val] = c.trim().split('=').map(decodeURIComponent);
                    res[key] = val;
                    return res;
                }, {});
                token = cookies['adminToken'] || cookies['accessToken'] || cookies['token'];
            } catch (e) {
                console.error('Socket cookie parsing error:', e);
            }
        }

        if (!token) {
            socket.verifiedUser = null;
            return next();
        }
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !user) throw new Error('Invalid token');
            
            const { data: userProfile } = await supabaseAdmin.from('users').select('id, role').eq('id', user.id).single();

            socket.verifiedUser = userProfile || null; // { id, role }
            next();
        } catch {
            socket.verifiedUser = null;
            next(); // Still allow connection
        }
    });

    io.on('connection', (socket) => {
        // Join user-specific room (supports userId or email)
        socket.on('join', (userId) => {
            if (!userId) return;
            const cleanId = String(userId).trim().toLowerCase();
            socket.join(`user:${cleanId}`);
            socket.join(`user:${userId}`);
        });

        socket.on('join:user', (identifier) => {
            if (!identifier) return;
            const cleanId = String(identifier).trim().toLowerCase();
            socket.join(`user:${cleanId}`);
            socket.join(`user:${identifier}`);
        });

        // Join admin room
        socket.on('join:admin', () => {
            socket.join('admin');
            console.log(`[Socket.IO] Socket ${socket.id} joined admin room successfully`);
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

const emitUserMessage = (identifier, payload) => {
    const socket = getIO();
    if (!socket || !identifier) return;
    const cleanId = String(identifier).trim().toLowerCase();
    socket.to(`user:${cleanId}`).emit('message:reply', payload);
    socket.to(`user:${identifier}`).emit('message:reply', payload);
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

module.exports = { initSocket, getIO, emitOrderUpdate, emitNewOrder, emitNotification, emitAdminNotification, emitUserMessage };
