/**
 * backend/scripts/seed_missing_emails.js
 * Seeds all required email templates into Supabase.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEMPLATES = [
    {
        name: 'verify_email',
        description: 'Sent when a new user registers to verify their email address.',
        subject: 'Verify your HandyLand account',
        body_html: '<h1>Welcome to HandyLand!</h1><p>Please click the link below to verify your email:</p><p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>',
        variables: ['{{userName}}', '{{verificationUrl}}']
    },
    {
        name: 'reset_password',
        description: 'Sent when a user requests a password reset.',
        subject: 'Reset your HandyLand password',
        body_html: '<h1>Password Reset Request</h1><p>Click the link below to reset your password:</p><p><a href="{{resetUrl}}">{{resetUrl}}</a></p>',
        variables: ['{{userName}}', '{{resetUrl}}']
    },
    {
        name: 'order_confirmation',
        description: 'Sent immediately after a successful order.',
        subject: 'Order Confirmation #{{orderNumber}}',
        body_html: '<h1>Thank you for your order!</h1><p>Hi {{customerName}}, we have received your order #{{orderNumber}}.</p><p>Total Amount: {{totalAmount}}€</p>',
        variables: ['{{customerName}}', '{{orderNumber}}', '{{totalAmount}}']
    },
    {
        name: 'sell_device_confirmation',
        description: 'Sent when a user submits a device for sale.',
        subject: 'Device Sale Confirmation - {{quoteRef}}',
        body_html: '<h1>We received your sale request!</h1><p>Device: {{device}}</p><p>Estimated Quote: {{price}}€</p><p>Reference: {{quoteRef}}</p>',
        variables: ['{{customerName}}', '{{device}}', '{{price}}', '{{quoteRef}}']
    },
    {
        name: 'abandoned_cart',
        description: 'Sent to users who left items in their cart.',
        subject: 'You left something in your cart!',
        body_html: '<h1>Don\'t forget your items!</h1><p>You have items waiting in your cart. Come back and complete your purchase.</p><p><a href="{{cartUrl}}">Return to Cart</a></p>',
        variables: ['{{userName}}', '{{cartUrl}}']
    },
    {
        name: 'order_status_update',
        description: 'Sent when an order status changes (Shipped, Delivered, etc.)',
        subject: 'Order #{{orderNumber}} Update: {{status}}',
        body_html: '<h1>Your order status has been updated</h1><p>New Status: {{status}}</p><p>Tracking: {{trackingNumber}}</p><p>{{adminNote}}</p>',
        variables: ['{{customerName}}', '{{orderNumber}}', '{{status}}', '{{trackingNumber}}', '{{adminNote}}']
    },
    {
        name: 'repair_status_update',
        description: 'Sent when a repair ticket status is updated.',
        subject: 'Repair Status Update: {{status}}',
        body_html: '<h1>Update on your repair</h1><p>Device: {{device}}</p><p>Status: {{status}}</p><p>{{adminNote}}</p>',
        variables: ['{{customerName}}', '{{device}}', '{{status}}', '{{adminNote}}']
    },
    {
        name: 'valuation_quote',
        description: 'Sent when a valuation quote is ready.',
        subject: 'Your Valuation Quote is Ready: {{price}}€',
        body_html: '<h1>We have an offer for your {{device}}!</h1><p>Offer: {{price}}€</p><p><a href="{{quoteUrl}}">View Offer Details</a></p>',
        variables: ['{{customerName}}', '{{device}}', '{{price}}', '{{quoteUrl}}']
    },
    {
        name: 'valuation_device_received',
        description: 'Sent when the user\'s sold device arrives at the warehouse.',
        subject: 'Device Received: {{device}}',
        body_html: '<h1>We have received your device!</h1><p>Our technicians are now inspecting your {{device}}.</p>',
        variables: ['{{customerName}}', '{{device}}']
    },
    {
        name: 'valuation_payment_sent',
        description: 'Sent when payment for a sold device has been processed.',
        subject: 'Payment Sent: {{amount}}€',
        body_html: '<h1>Payment Dispatched!</h1><p>We have sent {{amount}}€ to your bank account ending in {{ibanSnippet}}.</p>',
        variables: ['{{customerName}}', '{{amount}}', '{{bankName}}', '{{ibanSnippet}}']
    },
    {
        name: 'refund_status_update',
        description: 'Sent when a refund request is updated.',
        subject: 'Refund Update for Order #{{orderNumber}}',
        body_html: '<h1>Update on your refund request</h1><p>Status: {{status}}</p><p>{{adminComments}}</p>',
        variables: ['{{customerName}}', '{{orderNumber}}', '{{status}}', '{{adminComments}}']
    }
];

async function seed() {
    console.log('Seeding Email Templates...');
    
    for (const template of TEMPLATES) {
        const { error } = await supabase
            .from('email_templates')
            .upsert({
                name: template.name,
                subject: template.subject,
                body_html: template.body_html,
                body_text: template.body_html.replace(/<[^>]*>?/gm, ''),
                variables: template.variables,
                is_active: true
            }, { onConflict: 'name' });

        if (error) {
            console.error(`Error seeding ${template.name}:`, error.message);
        } else {
            console.log(`Successfully seeded ${template.name}`);
        }
    }
    console.log('Done!');
}

seed();
