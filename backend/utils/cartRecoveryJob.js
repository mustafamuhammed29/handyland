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
                        // Check if sendEmail exists, handling missing params
                        if (typeof sendEmail === 'function') {
                            const EmailTemplate = require('../models/EmailTemplate');
                            const template = await EmailTemplate.findOne({ name: 'abandoned_cart', isActive: true });
                            
                            if (template) {
                                const cartUrl = `${process.env.FRONTEND_URL}/cart`;
                                const userName = cart.user.name.split(' ')[0];
                                
                                let html = template.html
                                    .replace(/{{userName}}/g, userName)
                                    .replace(/{{cartUrl}}/g, cartUrl);
                                
                                let subject = template.subject
                                    .replace(/{{userName}}/g, userName);

                                await sendEmail({
                                    email: cart.user.email,
                                    subject: subject,
                                    html: html
                                });
                                emailsSent++;
                            } else {
                                console.log('[CRON] Abandoned cart template is disabled or not found.');
                            }
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
