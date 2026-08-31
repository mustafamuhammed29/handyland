const { Server } = require('socket.io');
const { supabaseAdmin } = require('../config/supabase');
const { isOriginAllowed } = require('../config/originSecurity');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (isOriginAllowed(origin)) {
                    return callback(null, true);
                }
                return callback(new Error('CORS: Origin not allowed: ' + origin), false);
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // ── Strict JWT Authentication Middleware ─────────────────────────────────
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
                    if (key) res[key] = val;
                    return res;
                }, {});
                token = cookies['adminToken'] || cookies['accessToken'] || cookies['token'];
            } catch (e) {
                console.error('[Socket.IO] Cookie parsing error:', e.message);
            }
        }

        if (!token) {
            const err = new Error('AUTHENTICATION_REQUIRED');
            err.data = { code: 'UNAUTHORIZED', message: 'Authentication token is required to connect to Socket.IO' };
            return next(err);
        }

        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                const err = new Error('INVALID_TOKEN');
                err.data = { code: 'UNAUTHORIZED', message: 'Provided token is invalid or expired' };
                return next(err);
            }
            
            const { data: userProfile, error: profileError } = await supabaseAdmin
                .from('users')
                .select('id, email, role, is_active')
                .eq('id', user.id)
                .single();

            if (profileError || !userProfile || userProfile.is_active === false) {
                const err = new Error('USER_NOT_FOUND_OR_INACTIVE');
                err.data = { code: 'FORBIDDEN', message: 'User account not found or deactivated' };
                return next(err);
            }

            socket.verifiedUser = userProfile; // { id, email, role, is_active }
            next();
        } catch (err) {
            const authErr = new Error('AUTHENTICATION_FAILED');
            authErr.data = { code: 'UNAUTHORIZED', message: 'Socket authentication failed' };
            return next(authErr);
        }
    });

    io.on('connection', (socket) => {
        const user = socket.verifiedUser;
        if (!user) {
            socket.disconnect(true);
            return;
        }

        // Automatically join user's own private rooms derived server-side
        socket.join(`user:${user.id}`);
        if (user.email) {
            socket.join(`user:${user.email.toLowerCase().trim()}`);
        }

        // Automatically join admin room ONLY if verified role is admin
        if (user.role === 'admin') {
            socket.join('admin');
        }

        // Client-controlled room join handlers ('join', 'join:user', 'join:admin')
        // are permanently removed to eliminate room spoofing and unauthorized snooping.

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

/**
 * Safely closes the Socket.IO instance and resets reference (idempotent, used in tests/teardown).
 */
const closeSocket = async () => {
    if (io) {
        const currentIo = io;
        io = null;
        try {
            await new Promise((resolve) => currentIo.close(resolve));
        } catch (err) {
            console.warn(`[Socket.IO] Warning during server close: ${err.message}`);
        }
    }
};

module.exports = { initSocket, getIO, closeSocket, emitOrderUpdate, emitNewOrder, emitNotification, emitAdminNotification, emitUserMessage };
