const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail, sendTemplateEmail } = require('../utils/emailService');
const { emitAdminNotification } = require('../utils/socket');

/**
 * Service for handling Authentication business logic.
 * Decoupled from Express req/res cycle.
 */
class AuthService {
    /**
     * Generate short-lived Access Token
     */
    generateAccessToken(userId) {
        if (!process.env.JWT_SECRET) {throw new Error('JWT_SECRET not defined');}
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    }

    /**
     * Generate long-lived opaque Refresh Token
     */
    async generateRefreshToken(userId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            token,
            user: userId,
            expiryDate
        });

        return { token, expiryDate };
    }

    /**
     * Validate password strength (aligned with frontend)
     */
    validatePassword(password) {
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*#?&]/.test(password);
        return password.length >= 8 && password.length <= 20 && hasLetter && hasNumber && hasSpecial;
    }

    /**
     * Register a new user and send verification email
     */
    async registerUser(userData) {
        const { name, email, password, phone, address } = userData;

        // Check uniqueness
        const emailExists = await User.findOne({ email });
        if (emailExists) {throw new Error('User already exists with this email');}

        if (phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {throw new Error('This phone number is already registered');}
        }

        if (!this.validatePassword(password)) {
            throw new Error('Password must be 8-20 characters with at least one letter, number, and special character.');
        }

        // Verification token logic
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        const user = await User.create({
            name, email, password, phone, address,
            verificationToken: hashedToken,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
            isVerified: false
        });

        // Async email sending (don't await to avoid blocking response)
        this.sendVerificationEmail(user, verificationToken).catch(err => console.error('Email error:', err));

        // 🔔 Notify ALL connected admins immediately
        emitAdminNotification('new_user', {
            title: 'Neuer Benutzer',
            body: `${user.name} hat sich gerade registriert.`,
            icon: '👤',
            link: '/users',
            userName: user.name,
            userEmail: user.email,
        });

        return user;
    }

    async sendVerificationEmail(user, token) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

        const sent = await sendTemplateEmail(user.email, 'verify_email', {
            userName: user.name,
            verificationUrl
        });

        if (!sent) {
            await sendEmail({
                email: user.email,
                subject: 'Verify Your Email - HandyLand',
                html: `<h2>Welcome, ${user.name}!</h2><p>Click below to verify:</p><a href="${verificationUrl}">Verify Email</a>`
            });
        }
    }

    /**
     * Login user and handle account locking
     */
    async loginUser(email, password) {
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
        if (!user) {throw new Error('Invalid credentials');}

        // Check Lock
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
            throw new Error(`Account locked. Try again in ${mins} minutes.`);
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000;
            }
            await User.updateOne({ _id: user._id }, { $set: { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil } });
            throw new Error('Invalid credentials');
        }

        // Reset Attempts
        if (user.loginAttempts > 0) {
            await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
        }

        // Check if account is blocked/deactivated by admin
        if (user.isActive === false) {
            const err = new Error('Your account has been suspended. Please contact support for assistance.');
            err.isBlocked = true;
            throw err;
        }

        if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && !user.isVerified) {
            const err = new Error('Please verify your email first');
            err.isVerified = false;
            throw err;
        }

        return user;
    }

    async verifyEmail(token) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {throw new Error('Invalid or expired verification token');}

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();
        return user;
    }
}

module.exports = new AuthService();
