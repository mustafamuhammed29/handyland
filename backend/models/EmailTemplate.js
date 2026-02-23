const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        enum: ['verify_email', 'reset_password', 'order_confirmation']
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    html: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    variables: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Auto-seed the default templates if they don't exist
emailTemplateSchema.statics.seedDefaults = async function () {
    const templates = [
        {
            name: 'verify_email',
            subject: 'Verify Your Email - HandyLand',
            description: 'Sent to new users to verify their email address.',
            variables: ['{{userName}}', '{{verificationUrl}}'],
            html: `<h1>Welcome to HandyLand!</h1><p>Hi {{userName}},</p><p>Please verify your email by clicking <a href="{{verificationUrl}}">here</a>.</p>`
        },
        {
            name: 'reset_password',
            subject: 'Password Reset Request - HandyLand',
            description: 'Sent when a user requests a password reset.',
            variables: ['{{userName}}', '{{resetUrl}}'],
            html: `<h1>Password Reset Request</h1><p>Hi {{userName}},</p><p>You requested a password reset. Please click <a href="{{resetUrl}}">here</a> to reset it. This link expires in 1 hour.</p>`
        },
        {
            name: 'order_confirmation',
            subject: 'Order Confirmation - HandyLand',
            description: 'Sent after a user successfully places an order.',
            variables: ['{{orderNumber}}', '{{totalAmount}}'],
            html: `<h1>Thank you for your order!</h1><p>Your Order ID is <strong>{{orderNumber}}</strong></p><p>Total: <strong>{{totalAmount}}€</strong></p><p>We will notify you when your order ships.</p>`
        }
    ];

    for (const tpl of templates) {
        const exists = await this.findOne({ name: tpl.name });
        if (!exists) {
            await this.create(tpl);
            console.log(`Seeded email template: ${tpl.name}`);
        }
    }
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
