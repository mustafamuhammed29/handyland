const twoFactorController = require('../controllers/twoFactorController');
const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const httpMocks = require('node-mocks-http');

jest.mock('../models/User');
jest.mock('speakeasy');
jest.mock('qrcode');

describe('Two-Factor Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest({
            user: { _id: 'testUserId', email: 'test@example.com' }
        });
        res = httpMocks.createResponse();
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('setup2FA', () => {
        it('should generate a secret and a qr code', async () => {
            speakeasy.generateSecret.mockReturnValue({ base32: 'MOCK_SECRET', otpauth_url: 'MOCK_OTP_URL' });
            QRCode.toDataURL.mockResolvedValue('MOCK_QR_CODE_DATA_URL');
            User.findByIdAndUpdate.mockResolvedValue(true);

            await twoFactorController.setup2FA(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            expect(data.qrCode).toBe('MOCK_QR_CODE_DATA_URL');
            expect(data.secret).toBe('MOCK_SECRET');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('testUserId', { twoFactorSecret: 'MOCK_SECRET', twoFactorEnabled: false });
        });
    });

    describe('verify2FA', () => {
        it('should verify token and enable 2fa', async () => {
            req.body = { token: '123456' };
            const mockUser = { twoFactorSecret: 'MOCK_SECRET' };
            
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            speakeasy.totp.verify.mockReturnValue(true);
            User.findByIdAndUpdate.mockResolvedValue(true);

            await twoFactorController.verify2FA(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            expect(data.message).toBe('2FA enabled successfully');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('testUserId', { twoFactorEnabled: true });
        });

        it('should fail with invalid token', async () => {
            req.body = { token: 'wrong' };
            const mockUser = { twoFactorSecret: 'MOCK_SECRET' };
            
            User.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            speakeasy.totp.verify.mockReturnValue(false);

            await twoFactorController.verify2FA(req, res);

            expect(res.statusCode).toBe(400);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(false);
            expect(data.message).toBe('Invalid 2FA token');
        });
    });

    describe('disable2FA', () => {
        it('should disable 2fa successfully', async () => {
            User.findByIdAndUpdate.mockResolvedValue(true);

            await twoFactorController.disable2FA(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.success).toBe(true);
            expect(data.message).toBe('2FA disabled');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('testUserId', { twoFactorEnabled: false, twoFactorSecret: undefined });
        });
    });
});
