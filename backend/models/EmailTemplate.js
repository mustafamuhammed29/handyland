const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['verify_email', 'reset_password', 'order_confirmation', 'sell_device_confirmation']
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
        },
        {
            name: 'sell_device_confirmation',
            subject: 'Shipping Label for Sell Order {{quoteRef}}',
            description: 'Sent to customers when they confirm a device sale.',
            variables: ['{{customerName}}', '{{device}}', '{{price}}', '{{quoteRef}}', '{{bankName}}', '{{ibanSnippet}}'],
            html: `<h1>Sales Confirmation</h1><p>Dear {{customerName}},</p><p>Thank you for selling your <strong>{{device}}</strong> to HandyLand for <strong>€{{price}}</strong>.</p><p>Please print the attached shipping label and send your device within 2 business days.</p><div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9;"><strong>Next Steps:</strong><ol><li>Reset your device to factory settings and remove iCloud/Google Lock.</li><li>Pack the device securely.</li><li>Attach the label below to the box.</li><li>Drop it off at the nearest post office.</li></ol></div><p>We will inspect the device upon arrival and process your payment to <strong>{{bankName}} (Ending in {{ibanSnippet}})</strong>.</p>`
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
