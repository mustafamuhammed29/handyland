const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
});

RefreshTokenSchema.statics.verifyExpiration = (token) => {
    return token.expiryDate.getTime() < new Date().getTime();
};

// FIXED: Add indexes for performance and auto-cleanup (IMP 1)
RefreshTokenSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // TTL: auto-delete expired tokens
RefreshTokenSchema.index({ user: 1, expiryDate: 1 }); // Compound index for user token lookups
RefreshTokenSchema.index({ token: 1 }); // Fast token lookup

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = RefreshToken;
