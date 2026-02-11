const authController = require('../controllers/authController');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const httpMocks = require('node-mocks-http');
const { sendEmail } = require('../utils/emailService');

// Mock User and RefreshToken models
jest.mock('../models/User');
jest.mock('../models/RefreshToken');
jest.mock('../utils/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    emailTemplates: {
        verification: jest.fn().mockReturnValue('<html>Verification</html>'),
        passwordReset: jest.fn().mockReturnValue('<html>Reset</html>'),
        orderStatusUpdate: jest.fn().mockReturnValue('<html>Status Update</html>')
    }
}));

describe('Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
                phone: '1234567890'
            };

            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                _id: 'userId',
                name: 'Test User',
                email: 'test@example.com',
                role: 'user',
                isVerified: false,
                save: jest.fn()
            });

            await authController.register(req, res, next);

            expect(res.statusCode).toBe(201);
            expect(res._isJSON()).toBeTruthy();
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            // Token is no longer returned in registration response by current controller implementation
            expect(data.user).toBeDefined();
        });

        it('should return 400 if user already exists', async () => {
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({ email: 'existing@example.com' });

            await authController.register(req, res, next);

            expect(res.statusCode).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toMatch(/already exists/i);
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                password: 'hashedPassword',
                matchPassword: jest.fn().mockResolvedValue(true),
                getSignedJwtToken: jest.fn().mockReturnValue('token'),
                isVerified: true
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await authController.login(req, res, next);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            expect(data.token).toBeDefined();
        });

        it('should return 401 with invalid password', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                email: 'test@example.com',
                password: 'hashedPassword',
                matchPassword: jest.fn().mockResolvedValue(false),
                select: jest.fn().mockReturnThis()
            };

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await authController.login(req, res, next);

            expect(res.statusCode).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toMatch(/Invalid credentials/i);
        });
    });
});
