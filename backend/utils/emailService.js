const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // For now, we'll just log the email contents because we don't have SMTP credentials configured.
    // In a real production app, you would configure a transporter here.

    // Check if we have credentials (optional for now)
    if (process.env.SMTP_HOST && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const message = {
            from: `${process.env.FROM_NAME || 'HandyLand'} <${process.env.SMTP_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message, // Plain text body
            html: options.html // HTML body
        };

        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } else {
        console.log('----------------------------------------------------');
        console.log('📧 Mock Email Service (No SMTP Configured)');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('----------------------------------------------------');
    }
};

const sendOrderConfirmation = async (order) => {
    const message = `
        Thank you for your order!
        Order ID: ${order.orderNumber || order._id}
        Total: ${order.totalAmount}€
        
        We will process it shortly.
    `;

    const html = `
        <h1>Thank you for your order!</h1>
        <p>Your Order ID is <strong>${order.orderNumber || order._id}</strong></p>
        <p>Total: <strong>${order.totalAmount}€</strong></p>
        <p>We will notify you when your order ships.</p>
    `;

    // Try to get email from user object if populated, otherwise use what's in shippingAddress or metadata
    let email = order.shippingAddress?.email;
    if (!email && order.user && order.user.email) email = order.user.email;

    // Fallback if still not found (e.g. from session metadata passed down)
    if (!email) {
        console.error("Could not find email for order confirmation", order._id);
        return;
    }

    await sendEmail({
        email: email,
        subject: 'Order Confirmation - HandyLand',
        message,
        html
    });
};

module.exports = {
    sendEmail,
    sendOrderConfirmation
};
