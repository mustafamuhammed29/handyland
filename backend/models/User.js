const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [12, 'Password must be at least 12 characters'],
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    phone: {
        type: String,
        trim: true
    },
    addresses: [{
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
        type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    // Wallet & Loyalty
    balance: {
        type: Number,
        default: 0.00
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    membershipLevel: {
        type: Number,
        default: 1 // 1=Regular, 2=Silver, 3=Gold, 4=Platinum
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Encryption for refreshToken
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Pre-save hook for hashing password and encrypting refresh token
UserSchema.pre('save', async function () {
    console.log('User pre-save hook triggered for:', this.email);
    try {
        // 1. Encrypt Refresh Token
        if (this.isModified('refreshToken') && this.refreshToken) {
            console.log('Encrypting refresh token...');
            const crypto = require('crypto');
            this.refreshToken = crypto.createHash('sha256').update(this.refreshToken).digest('hex');
        }

        // 2. Hash Password
        if (this.isModified('password')) {
            console.log('Hashing password...');
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        console.log('User pre-save hook completed successfully.');
    } catch (error) {
        console.error('Error in User pre-save hook:', error);
        throw error;
    }
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
UserSchema.methods.generateVerificationToken = function () {
    const crypto = require('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
    return token;
};

// Generate reset password token
UserSchema.methods.generateResetPasswordToken = function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Add Indexes
// UserSchema.index({ email: 1 }); // Already defined in schema
// UserSchema.index({ role: 1 }); // Already defined in schema

module.exports = mongoose.model('User', UserSchema);
