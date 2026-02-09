const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    // If SMTP_HOST is defined in .env, use it (allows testing Gmail in dev)
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback to Ethereal for development if no SMTP config
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'your-ethereal-user@ethereal.email',
            pass: 'your-ethereal-password'
        }
    });
};

const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const message = {
            from: `${process.env.FROM_NAME || 'HandyLand'} <${process.env.FROM_EMAIL || 'noreply@handyland.com'}>`,
            to: options.email,
            subject: options.subject,
            html: options.html || options.message,
        };

        const info = await transporter.sendMail(message);

        console.log('Email sent:', info.messageId);

        // For development, log the preview URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

// Email Templates
const emailTemplates = {
    // Welcome Email
    welcome: (name) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to HandyLand! 🎉</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Thank you for registering with HandyLand. We're excited to have you on board!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse our marketplace for the best devices</li>
                        <li>Get instant device valuations</li>
                        <li>Book repair services</li>
                        <li>Track all your orders</li>
                    </ul>
                    <p>Start exploring now!</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Go to HandyLand</a>
                </div>
                <div class="footer">
                    <p>HandyLand - Your Trusted Device Partner</p>
                    <p>© 2024 HandyLand. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Email Verification
    verification: (name, token) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email ✉️</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Please verify your email address to complete your registration.</p>
                    <p>Click the button below to verify:</p>
                    <a href="${token}" class="button">Verify Email</a>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                </div>
                <div class="footer">
                    <p>If you didn't create an account, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Quote Email
    quote: (name, quoteRef, device, price, redirectUrl) => `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #06b6d4; margin: 0;">HandyLand Quote</h1>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1e293b;">Hello ${name},</h2>
                <p>Your valuation for <strong>${device}</strong> is ready!</p>
                
                <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
                    <p style="margin: 5px 0; color: #64748b;">Quote Reference:</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">${quoteRef}</p>
                    <div style="margin: 15px 0; height: 1px; background-color: #e2e8f0;"></div>
                    <p style="margin: 5px 0; color: #64748b;">Estimated Value:</p>
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #10b981;">€${price}</p>
                </div>
                
                <p>This quote is valid for <strong>48 hours</strong>.</p>
                <p>Ready to sell? Click below to finalize your order and get your free shipping label.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}${redirectUrl}" style="background-color: #0891b2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Finalize Sale</a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">If the button doesn't work, copy this link: ${process.env.FRONTEND_URL}${redirectUrl}</p>
            </div>
        </div>
    `,

    // Password Reset
    passwordReset: (name, token) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password 🔒</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>You requested to reset your password.</p>
                    <p>Click the button below to set a new password:</p>
                    <a href="${token}" class="button">Reset Password</a>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">This link will expire in 10 minutes.</p>
                </div>
                <div class="footer">
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Order Confirmation
    orderConfirmation: (name, order) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .order-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
                .button { display: inline-block; padding: 12px 30px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Confirmed! ✅</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Thank you for your order. We've received it and will process it shortly.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        
                        <h4>Items:</h4>
                        ${order.items.map(item => `
                            <div class="item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>€${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        
                        <div class="total">
                            Total: €${order.totalAmount.toFixed(2)}
                        </div>
                    </div>
                    
                    <p>You can track your order status in your dashboard.</p>
                    <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Order</a>
                </div>
                <div class="footer">
                    <p>Questions? Contact us at support@handyland.com</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Order Status Update
    orderStatusUpdate: (name, order, newStatus) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: #3498db; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .status { background: #3498db; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Update 📦</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Your order status has been updated.</p>
                    
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>New Status:</strong> <span class="status">${newStatus.toUpperCase()}</span></p>
                    
                    ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
                    
                    <p>Track your order in real-time from your dashboard.</p>
                    <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Track Order</a>
                </div>
                <div class="footer">
                    <p>HandyLand - Fast & Reliable Delivery</p>
                </div>
            </div>
        </body>
        </html>
    `,
    // Repair Status Update
    repairStatusUpdate: (name, ticket, newStatus) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                .header { background: #8e44ad; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { padding: 20px; color: #333; }
                .status { background: #8e44ad; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #8e44ad; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Repair Update 🔧</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name}!</h2>
                    <p>Your repair ticket status has been updated.</p>
                    
                    <p><strong>Device:</strong> ${ticket.device}</p>
                    <p><strong>Issue:</strong> ${ticket.issue}</p>
                    <p><strong>New Status:</strong> <span class="status">${newStatus.toUpperCase()}</span></p>
                    
                    <p>We are working hard to get your device back to you in perfect condition.</p>
                    <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Ticket</a>
                </div>
                <div class="footer">
                    <p>HandyLand - Expert Repair Services</p>
                </div>
            </div>
        </body>
        </html>
    `,
};

module.exports = {
    sendEmail,
    emailTemplates,
};
