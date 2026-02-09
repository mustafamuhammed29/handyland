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

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = RefreshToken;
