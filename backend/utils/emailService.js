const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if we have credentials (optional for now)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const message = {
                from: `${process.env.FROM_NAME || 'HandyLand'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
                to: options.email,
                subject: options.subject,
                text: options.message, // Plain text body
                html: options.html // HTML body
            };

            const info = await transporter.sendMail(message);
            console.log('📧 Email sent successfully: %s', info.messageId);
        } catch (error) {
            console.error('❌ Error sending email via SMTP:', error.message);
            console.log('⚠️ Overriding to mock email since real email failed.');
            console.log('----------------------------------------------------');
            console.log('📧 Mock Email Service (SMTP failed)');
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body: ${options.html || options.message}`);
            console.log('----------------------------------------------------');

            // Only throw here if you strictly want the API to fail. For development/robustness, we log and swallow the error.
            // throw new Error('Email service failed: ' + error.message); 
        }
    } else {
        console.log('----------------------------------------------------');
        console.log('📧 Mock Email Service (No SMTP Configured in .env)');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.html || options.message}`);
        console.log('----------------------------------------------------');
    }
};

const sendOrderConfirmation = async (order) => {
    // Try to get email from user object if populated, otherwise use what's in shippingAddress or metadata
    let email = order.shippingAddress?.email;
    if (!email && order.user && order.user.email) email = order.user.email;

    // Fallback if still not found
    if (!email) {
        console.error("Could not find email for order confirmation", order._id);
        return;
    }

    const variablesContext = {
        orderNumber: order.orderNumber || order._id,
        totalAmount: order.totalAmount
    };

    const sent = await sendTemplateEmail(email, 'order_confirmation', variablesContext);

    if (!sent) {
        // Fallback hardcoded logic if the template was deleted from DB
        const html = `
            <h1>Thank you for your order!</h1>
            <p>Your Order ID is <strong>${variablesContext.orderNumber}</strong></p>
            <p>Total: <strong>${variablesContext.totalAmount}€</strong></p>
            <p>We will notify you when your order ships.</p>
        `;
        await sendEmail({
            email,
            subject: 'Order Confirmation - HandyLand',
            message: html.replace(/<[^>]*>?/gm, ''),
            html
        });
    }
};

const EmailTemplate = require('../models/EmailTemplate');

const sendTemplateEmail = async (email, templateName, variablesContext = {}) => {
    try {
        const template = await EmailTemplate.findOne({ name: templateName, isActive: true });
        if (!template) {
            console.warn(`⚠️ Email template '${templateName}' not found or inactive. Falling back to default.`);
            return false;
        }

        let html = template.html;
        let subject = template.subject;

        // Replace all {{variableName}} in HTML and Subject
        for (const [key, value] of Object.entries(variablesContext)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value);
            subject = subject.replace(regex, value);
        }

        await sendEmail({
            email,
            subject,
            html,
            message: html.replace(/<[^>]*>?/gm, '') // Strip HTML tags for plain text fallback
        });
        return true;
    } catch (error) {
        console.error(`❌ Error sending template email '${templateName}':`, error);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendOrderConfirmation,
    sendTemplateEmail
};
