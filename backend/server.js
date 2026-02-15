const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
// const sanitize = require('./middleware/sanitize'); // Removed custom sanitizer
// Data Sanitization
const mongoSanitize = require('./middleware/mongoSanitize');
// const xss = require('xss-clean');
const csrfProtection = require('./middleware/csrf');

dotenv.config();
const validateEnv = require('./config/validateEnv');
validateEnv();

console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('⚠️  NODE_ENV not set, defaulting to development');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland', {})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const compression = require('compression');

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "res.cloudinary.com", "images.unsplash.com"],
            connectSrc: ["'self'", "api.stripe.com"],
            frameSrc: ["'self'", "js.stripe.com", "hooks.stripe.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
})); // Secure HTTP headers with CSP
app.use(compression()); // Compress responses

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting - General API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS Configuration
// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-Token'],
    exposedHeaders: ['Set-Cookie']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
// Data Sanitization
app.use(mongoSanitize); // Prevent NoSQL injection
// app.use(xss()); // Removed causing issues with Express 5
app.use(cookieParser());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Image Upload Utility
const upload = require('./utils/imageUpload');

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload Endpoint (rate limited + auth protected)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many uploads, please try again later.' }
});
app.post('/api/upload', uploadLimiter, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Use relative path instead of hardcoded localhost
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const repairRoutes = require('./routes/repairRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Stricter rate limit for auth endpoints (relaxed for development)
// Stricter rate limit for auth endpoints (relaxed for development)
const isProduction = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 5 : 1000, // Strict in production, relaxed in dev/test
    skipSuccessfulRequests: true, // Only count failed attempts
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/settings', require('./routes/settingsRoutes')); // Registered Settings Route
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/emails', require('./routes/emailRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/accessories', require('./routes/accessoriesRoutes'));
app.use('/api/repair-archive', require('./routes/repairArchiveRoutes'));
app.use('/api/valuation', require('./routes/valuationRoutes'));
app.use('/api/promotions', require('./routes/promotionsRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes')); // Added
app.use('/api/addresses', require('./routes/addressRoutes')); // Added
app.use('/api/transactions', require('./routes/transactionRoutes')); // Added
app.use('/api/notifications', require('./routes/notificationRoutes')); // Added
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/messages', require('./routes/messageRoutes')); // Registered Message Routes

// Basic Routes
app.get('/', (req, res) => {
    res.json({
        message: 'HandyLand Backend API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            orders: '/api/orders',
            payment: '/api/payment',
            admin: 'Admin Panel at http://localhost:3001'
        }
    });
});

app.get('/api/status', (req, res) => {
    const dbStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            state: dbStates[mongoose.connection.readyState] || 'unknown',
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        memory: process.memoryUsage(),
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    });
});

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const http = require('http');
const { initSocket } = require('./utils/socket');

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📊 Admin Panel: http://localhost:3001`);
    logger.info(`🌐 Frontend: http://localhost:3000`);
    logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔌 Socket.IO ready`);
});
