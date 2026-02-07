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
        minlength: [6, 'Password must be at least 6 characters'],
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
    address: {
        street: String,
        city: String,
        zipCode: String,
        country: String
    },
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
    }
}, {
    timestamps: true
});

// Hash password before saving - Fixed for Mongoose 7+
UserSchema.pre('save', async function () {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
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

module.exports = mongoose.model('User', UserSchema);
