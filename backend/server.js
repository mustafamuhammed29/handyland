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

dotenv.config();
const validateEnv = require('./config/validateEnv');
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/handyland', {})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

const compression = require('compression');

// Security Middleware
app.use(helmet()); // Secure HTTP headers
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
    max: 1000, // Increased for dev
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
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const repairRoutes = require('./routes/repairRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Stricter rate limit for auth endpoints (relaxed for development)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Strict limit for login/register
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
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
app.use('/api/cart', require('./routes/cartRoutes')); // Added

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
    res.json({
        status: 'ok',
        message: 'Backend is operational',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📊 Admin Panel: http://localhost:3001`);
    logger.info(`🌐 Frontend: http://localhost:3000`);
    logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
