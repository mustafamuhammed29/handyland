const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendEmail, sendTemplateEmail } = require('../utils/emailService');

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

        // Check if email already registered
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Check if phone already registered
        if (phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({
                    success: false,
                    message: 'This phone number is already registered'
                });
            }
        }

        // Check password strength - match frontend and route validation
        // (8 to 20 chars, one letter, one number, one special character)
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*#?&]/.test(password);

        if (password.length < 8 || password.length > 20 || !hasLetter || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: 'Password must be between 8 and 20 characters long and include at least one letter, one number, and one special character.'
            });
        }

        // Generate verification token (unhashed version for email)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Hash it before saving to DB
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            address,
            verificationToken: hashedVerificationToken,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            isVerified: false
        });

        // Send verification email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        if (process.env.NODE_ENV !== 'production') { console.log('📧 Attempting to send verification email to:', user.email); } // FIXED: [Removed debug console.log in production]
        if (process.env.NODE_ENV !== 'production') { console.log('🔗 Verification URL:', verificationUrl); } // FIXED: [Removed debug console.log in production]

        try {
            const sent = await sendTemplateEmail(user.email, 'verify_email', {
                userName: user.name,
                verificationUrl
            });
            if (!sent) {
                if (process.env.NODE_ENV !== 'production') { console.log('⚠️  No verify_email template in DB, sending fallback HTML email...'); } // FIXED: [Removed debug console.log in production]
                // Fallback: send a basic HTML email
                await sendEmail({
                    email: user.email,
                    subject: 'Verify Your Email - HandyLand',
                    html: `<h2>Welcome to HandyLand, ${user.name}!</h2>
                           <p>Please verify your email by clicking the link below:</p>
                           <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
                           <p>This link expires in 24 hours.</p>`
                });
            } else {
                if (process.env.NODE_ENV !== 'production') { console.log('✅ Verification email sent successfully (via template).'); } // FIXED: [Removed debug console.log in production]
            }
        } catch (emailError) {
            console.error('❌ Error sending verification email:', emailError.message);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
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
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(423).json({
                success: false,
                message: `Account locked due to too many failed attempts. Please try again in ${timeRemaining} minutes.`
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
            }
            // Use updateOne to avoid full validation lifecycle for simple counter logic
            await User.updateOne(
                { _id: user._id },
                { $set: { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil } }
            );

            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            await User.updateOne(
                { _id: user._id },
                { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
            );
        }

        // Require email verification by default; set REQUIRE_EMAIL_VERIFICATION=false to skip
        const skipVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'false';
        if (!skipVerification && !user.isVerified) {
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
        if (process.env.NODE_ENV !== 'production') { console.log('🍪 Setting cookies for user:', user.email); } // FIXED: [Removed debug console.log in production]

        const isProduction = process.env.NODE_ENV === 'production';
        if (process.env.NODE_ENV !== 'production') { console.log('🌍 Environment isProduction:', isProduction); } // FIXED: [Removed debug console.log in production]

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

        if (process.env.NODE_ENV !== 'production') { console.log('✅ AuthController: Sending login response. Token exists:', !!token); } // FIXED: [Removed debug console.log in production]
        if (token) if (process.env.NODE_ENV !== 'production') { console.log('✅ Token preview:', token.substring(0, 10) + '...'); } // FIXED: [Removed debug console.log in production]

        // Fetch addresses
        const addresses = await require('../models/Address').find({ user: user._id });

        res.status(200).json({
            success: true,
            token: token, // Explicit key-value
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

        // FIXED: Check phone uniqueness before updating (FIX 4)
        if (req.body.phone) {
            const phoneExists = await User.findOne({ phone: req.body.phone, _id: { $ne: req.user.id } });
            if (phoneExists) {
                return res.status(400).json({ success: false, message: 'This phone number is already in use by another account.' });
            }
        }

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

        // FIXED: Validate password strength before saving (FIX 2)
        const hasLetter = /[A-Za-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[@$!%*#?&]/.test(newPassword);
        if (newPassword.length < 8 || newPassword.length > 20 || !hasLetter || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: 'New password must be 8-20 characters with at least one letter, number, and special character.'
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

        if (process.env.NODE_ENV !== 'production') { console.log('🔐 Admin login attempt for:', email); } // FIXED: [Removed debug console.log in production]

        // Validation
        if (!email || !password) {
            if (process.env.NODE_ENV !== 'production') { console.log('❌ Missing credentials'); } // FIXED: [Removed debug console.log in production]
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            if (process.env.NODE_ENV !== 'production') { console.log('❌ User not found:', email); } // FIXED: [Removed debug console.log in production]
            return res.status(400).json({ // Changed to 400 as requested or kept 401? User asked for 400 in "Invalid credentials" block below, keeping consistent
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            if (process.env.NODE_ENV !== 'production') { console.log('❌ Access denied - User is not admin. Role:', user.role); } // FIXED: [Removed debug console.log in production]
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                userRole: user.role
            });
        }

        // Check if account is active
        if (user.isActive === false) {
            if (process.env.NODE_ENV !== 'production') { console.log('❌ Account deactivated'); } // FIXED: [Removed debug console.log in production]
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            if (process.env.NODE_ENV !== 'production') { console.log('❌ Invalid password'); } // FIXED: [Removed debug console.log in production]
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
        console.error('Admin Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin login',
            error: error.message
        });
    }
};

// @desc    Verify Email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (process.env.NODE_ENV !== 'production') { console.log("Verifying email with token:", token); } // FIXED: [Removed debug console.log in production]

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching token and valid expiration
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            if (process.env.NODE_ENV !== 'production') { console.log("Verify failed: Invalid or expired token"); } // FIXED: [Removed debug console.log in production]
            // Check if token exists but expired
            const expiredUser = await User.findOne({ verificationToken: hashedToken });
            if (expiredUser) {
                if (process.env.NODE_ENV !== 'production') { console.log("Token found but expired. Expiry:", expiredUser.verificationTokenExpire, "Now:", Date.now()); } // FIXED: [Removed debug console.log in production]
            } else {
                if (process.env.NODE_ENV !== 'production') { console.log("Token not found at all."); } // FIXED: [Removed debug console.log in production]
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        if (process.env.NODE_ENV !== 'production') { console.log("User found for verification:", user.email); } // FIXED: [Removed debug console.log in production]

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        if (process.env.NODE_ENV !== 'production') { console.log("User verified successfully:", user.email); } // FIXED: [Removed debug console.log in production]

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
            // Prevent user enumeration by returning a generic success message
            // Optionally wait to mimic bcrypt timing if this was login, but here it's fine
            return res.status(200).json({
                success: true,
                message: 'Password reset email sent! Please check your email.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await sendTemplateEmail(user.email, 'reset_password', {
                userName: user.name,
                resetUrl: resetUrl
            });

            res.status(200).json({
                success: true,
                message: 'Password reset email sent! Please check your email.'
            });
        } catch (emailError) {
            console.error('Detailed Email Error:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.',
                error: emailError.message
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

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // FIXED: Validate password strength before saving (FIX 3)
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*#?&]/.test(password);
        if (password.length < 8 || password.length > 20 || !hasLetter || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: 'Password must be 8-20 characters with at least one letter, number, and special character.'
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
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        user.verificationToken = hashedVerificationToken;
        user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        try {
            await sendTemplateEmail(user.email, 'verify_email', {
                userName: user.name,
                verificationUrl: verificationUrl
            });

            res.status(200).json({
                success: true,
                message: 'Verification email sent! Please check your email.'
            });
        } catch (emailError) {
            console.error('Detailed Verification Email Error:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.',
                error: emailError.message
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

// FIXED: Removed duplicate module.exports here (FIX 1) — kept only the final one at end of file

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
            await RefreshToken.findByIdAndDelete(refreshTokenDoc._id); // FIXED: [Deprecated findByIdAndRemove replaced with findByIdAndDelete]
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
            secure: process.env.NODE_ENV === 'production', // FIXED: [Do not hardcode secure: false in production]
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
        // FIXED: Add pagination to prevent loading all users at once (FIX 5)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const total = await User.countDocuments();
        const users = await User.find().skip(skip).limit(limit).sort({ createdAt: -1 });
        res.status(200).json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
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

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

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

// FIXED: [Moved module.exports to the end]
module.exports = exports;
