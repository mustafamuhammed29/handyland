const cron = require('node-cron');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const startCartRecoveryJob = () => {
    // Run daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('[CRON] Starting Abandoned Cart Recovery Job...');
        try {
            // Find carts updated between 24 and 48 hours ago that are not empty
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const abandonedCarts = await Cart.find({
                'items.0': { $exists: true }, // Has at least one item
                updatedAt: { $lt: oneDayAgo, $gte: twoDaysAgo }
            }).populate('user', 'name email');

            let emailsSent = 0;

            for (const cart of abandonedCarts) {
                if (cart.user && cart.user.email) {
                    try {
                        const message = `
                            <h2>مرحباً ${cart.user.name.split(' ')[0]}،</h2>
                            <p>لاحظنا أنك تركت بعض العناصر الرائعة في سلة التسوق الخاصة بك في HandyLand!</p>
                            <p>لا تفوت الفرصة، أكمل عملية الشراء الآن قبل نفاذ الكمية.</p>
                            <a href="${process.env.FRONTEND_URL}/cart" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">إكمال الشراء</a>
                        `;

                        // Checking if sendEmail exists, handling missing params
                        if (typeof sendEmail === 'function') {
                           await sendEmail({
                               email: cart.user.email,
                               subject: 'سلة تسوقك بانتظارك! 🛒',
                               message: message, // Assuming sendEmail utility handles HTML or text
                               html: message
                           });
                           emailsSent++;
                        }
                    } catch (err) {
                        console.error(`Failed to send email to ${cart.user.email}:`, err);
                    }
                }
            }

            console.log(`[CRON] Abandoned Cart Job finished. Sent ${emailsSent} emails.`);
        } catch (error) {
            console.error('[CRON] Abandoned Cart Job failed:', error);
        }
    });
    console.log('CRON: Cart Recovery job scheduled (Runs daily at 10:00 AM)');
};

module.exports = startCartRecoveryJob;
