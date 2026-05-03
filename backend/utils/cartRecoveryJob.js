const cron = require('node-cron');
const Cart = require('../models/Cart');
const { sendEmail } = require('./emailService');
const logger = require('./logger');

const startCartRecoveryJob = () => {
    // Run daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        logger.info('[CRON] Starting Abandoned Cart Recovery Job...');
        try {
            const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            // Find carts:
            // 1. Updated between 24–48 hours ago (truly abandoned window)
            // 2. Not empty
            // 3. Haven't already received a recovery email (lastReminderSentAt is null)
            //    OR the last reminder was sent > 7 days ago (avoid spam)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const abandonedCarts = await Cart.find({
                'items.0': { $exists: true },
                updatedAt: { $lt: oneDayAgo, $gte: twoDaysAgo },
                $or: [
                    { lastReminderSentAt: null },
                    { lastReminderSentAt: { $lt: sevenDaysAgo } }
                ]
            }).populate('user', 'name email notificationPrefs');

            let emailsSent = 0;

            const EmailTemplate = require('../models/EmailTemplate');
            const template = await EmailTemplate.findOne({ name: 'abandoned_cart', isActive: true });

            if (!template) {
                logger.info('[CRON] Abandoned cart template is disabled or not found — skipping.');
                return;
            }

            for (const cart of abandonedCarts) {
                if (!cart.user?.email) {continue;}

                // Respect user email preferences
                const prefs = cart.user.notificationPrefs;
                if (prefs && prefs.promotions === false) {continue;}

                try {
                    const cartUrl  = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`;
                    const userName = cart.user.name?.split(' ')[0] || 'there';

                    const html = template.html
                        .replace(/{{userName}}/g, userName)
                        .replace(/{{cartUrl}}/g, cartUrl);

                    const subject = template.subject
                        .replace(/{{userName}}/g, userName);

                    await sendEmail({ email: cart.user.email, subject, html });

                    // Mark that we sent a reminder — prevents duplicate emails
                    await Cart.findByIdAndUpdate(cart._id, { lastReminderSentAt: new Date() });

                    emailsSent++;
                } catch (err) {
                    logger.error(`[CRON] Failed to send cart recovery email to ${cart.user.email}: ${err.message}`);
                }
            }

            logger.info(`[CRON] Abandoned Cart Job done. Sent ${emailsSent} recovery emails.`);
        } catch (error) {
            logger.error(`[CRON] Abandoned Cart Job failed: ${error.message}`);
        }
    });

    logger.info('CRON: Cart Recovery job scheduled (Runs daily at 10:00 AM)');
};

module.exports = startCartRecoveryJob;
