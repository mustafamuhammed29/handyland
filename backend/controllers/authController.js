const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Generate Access Token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m' // Short lived
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Check password strength
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 12 characters long and include at least one letter, one number, and one special character.'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            address,
            verificationToken,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            isVerified: false
        });

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify Your Email - HandyLand',
                html: emailTemplates.verification(user.name, verificationUrl)
            });
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Don't fail registration if email fails
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email.',
            token, // Return access token
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified (unless disabled in dev)
        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first',
                isVerified: false
            });
        }

        const token = generateToken(user._id);

        // Send access token in HTTP-only cookie
        // Force secure: false for localhost/http development
        // Add detailed logging
        console.log('🍪 Setting cookies for user:', user.email);

        const isProduction = process.env.NODE_ENV === 'production';
        console.log('🌍 Environment isProduction:', isProduction);

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: isProduction, // strict check
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        // Generate Refresh Token (Opaque)
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiryDate: refreshTokenExpiry
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        console.log('✅ AuthController: Sending login response. Token exists:', !!token);
        if (token) console.log('✅ Token preview:', token.substring(0, 10) + '...');

        // Fetch addresses
        const addresses = await require('../models/Address').find({ user: user._id });

        res.status(200).json({
            success: true,
            token: token, // Explicit key-value
            refreshToken: refreshToken, // Explicit key-value
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                phone: user.phone,
                addresses: addresses, // Include full address list
                address: user.address // Keep singular for backward compatibility if any
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const addresses = await require('../models/Address').find({ user: req.user.id });

        const userObj = user.toObject();
        userObj.addresses = addresses;

        res.status(200).json({
            success: true,
            user: userObj
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address
        };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/changepassword
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid current password'
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message
        });
    }
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Admin login attempt for:', email);

        // Validation
        if (!email || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(400).json({ // Changed to 400 as requested or kept 401? User asked for 400 in "Invalid credentials" block below, keeping consistent
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            console.log('❌ Access denied - User is not admin. Role:', user.role);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                userRole: user.role
            });
        }

        // Check if account is active
        if (user.isActive === false) {
            console.log('❌ Account deactivated');
            return res.status(403).json({
                success: false,ctrl+const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendEmail, emailTemplates } = require('../utils/emailService');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET not defined');
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

const getDeviceInfo = (req) => ({
    userAgent: req.headers['user-agent'] || 'Unknown',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    lastSeen: new Date()
});

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = await User.create({
            name, email, password, phone, address,
            verificationToken,
            verificationTokenExpire: Date.now() + 24*60*60*1000,
            isVerified: false,
            deviceInfo: getDeviceInfo(req)
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify Email - HandyLand',
                html: emailTemplates.verification(user.name, verificationUrl)
            });
        } catch (e) { console.error('Email error:', e); }

        res.status(201).json({ success: true, message: 'Verify your email', token: generateToken(user._id) });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify email', isVerified: false });
        }

        user.deviceInfo = getDeviceInfo(req);
        await user.save();

        const token = generateToken(user._id);
        const refreshToken = crypto.randomBytes(40).toString('hex');
        await RefreshToken.create({ token: refreshToken, user: user._id, expiryDate: new Date(Date.now() + 7*24*60*60*1000) });

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', token, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 15*60*1000, path: '/' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 7*24*60*60*1000, path: '/' });

        res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, deviceInfo: user.deviceInfo } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ success: false, message: 'Wrong password' });
        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password updated' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token, verificationTokenExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Verified' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000;
        await user.save();
        const url = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendEmail({ email: user.email, subject: 'Reset Password', html: emailTemplates.passwordReset(user.name, url) });
        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Success' });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

exports.resendVerification = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || user.isVerified) return res.status(400).json({ success: false, message: 'Invalid request' });
        const token = crypto.randomBytes(32).toString('hex');
        user.verificationToken = token;
        user.verificationTokenExpire = Date.now() + 24*60*60*1000;
        await user.save();
        const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        await sendEmail({ email: user.email, subject: 'Verify Email', html: emailTemplates.verification(user.name, url) });
        res.status(200).json({ success: true, message: 'Sent' });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: 'No token' });
        const doc = await RefreshToken.findOne({ token });
        if (!doc || RefreshToken.verifyExpiration(doc)) return res.status(403).json({ message: 'Invalid/Expired' });
        const accessToken = generateToken(doc.user);
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 15*60*1000, path: '/' });
        res.json({ success: true, token: accessToken });
    } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.logout = async (req, res) => {
    try {
        if (req.cookies.refreshToken) await RefreshToken.deleteOne({ token: req.cookies.refreshToken });
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = exports;

                message: 'Account is deactivated'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log('❌ Invalid password');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        // Set cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/'
        };

        res.cookie('accessToken', token, cookieOptions);

        console.log('✓ Admin login successful for:', email);

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('❌ Admin Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Verify Email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        console.log("Verifying email with token:", token);

        // Find user with matching token and valid expiration
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            console.log("Verify failed: Invalid or expired token");
            // Check if token exists but expired
            const expiredUser = await User.findOne({ verificationToken: token });
            if (expiredUser) {
                console.log("Token found but expired. Expiry:", expiredUser.verificationTokenExpire, "Now:", Date.now());
            } else {
                console.log("Token not found at all.");
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        console.log("User found for verification:", user.email);

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        console.log("User verified successfully:", user.email);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email',
            error: error.message
        });
    }
};

// @desc    Forgot Password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - HandyLand',
                html: emailTemplates.passwordReset(user.name, resetUrl)
            });

            res.status(200).json({
                success: true,
                message: 'Password reset email sent! Please check your email.'
            });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a new password'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful! You can now login with your new password.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify Your Email - HandyLand',
                html: emailTemplates.verification(user.name, verificationUrl)
            });

            res.status(200).json({
                success: true,
                message: 'Verification email sent! Please check your email.'
            });
        } catch (emailError) {
            return res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = exports;

// @desc    Refresh Access Token
// @route   GET /api/auth/refresh
// @access  Public (with cookie)
exports.refreshToken = async (req, res) => {
    try {
        const requestToken = req.cookies.refreshToken;

        if (!requestToken) {
            return res.status(401).json({ message: 'No refresh token found' });
        }

        // Find token in DB
        const refreshTokenDoc = await RefreshToken.findOne({ token: requestToken });

        if (!refreshTokenDoc) {
            return res.status(403).json({ message: 'Refresh token is not in database!' });
        }

        // Verify expiration
        if (RefreshToken.verifyExpiration(refreshTokenDoc)) {
            await RefreshToken.findByIdAndRemove(refreshTokenDoc._id, { useFindAndModify: false });
            return res.status(403).json({
                message: 'Refresh token was expired. Please make a new signin request'
            });
        }

        const user = await User.findById(refreshTokenDoc.user);

        // Generate new access token
        const newAccessToken = generateToken(user._id);

        // Send access token in HTTP-only cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.json({ success: true, token: newAccessToken });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/auth/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving users',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        if (req.cookies.refreshToken) {
            await RefreshToken.deleteOne({ token: req.cookies.refreshToken });
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
