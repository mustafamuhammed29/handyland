/**
 * backend/services/cronService.js
 * Background cron jobs for HandyLand (Cart Recovery, Session Cleanup)
 */
'use strict';

const cron = require('node-cron');
const { supabaseAdmin } = require('../config/supabase');
const { sendTemplateEmail, sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Cart Recovery Job
 * Runs every day at 10:00 AM to search for abandoned shopping carts
 * and automatically send reminder emails to users.
 */
const startCartRecoveryJob = () => {
    // '0 10 * * *' = Every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        logger.info('⏳ [Cron] Running Abandoned Cart Recovery Job...');
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            // Fetch carts updated between 24 and 48 hours ago
            const { data: carts, error } = await supabaseAdmin
                .from('carts')
                .select(`
                    id, user_id, updated_at,
                    users (name, email),
                    cart_items (id, quantity)
                `)
                .lt('updated_at', twentyFourHoursAgo)
                .gt('updated_at', fortyEightHoursAgo);

            if (error) throw error;

            if (!carts || carts.length === 0) {
                logger.info('ⓘ [Cron] No abandoned carts found updated between 24h and 48h ago.');
                return;
            }

            let remindersSent = 0;

            for (const cart of carts) {
                // Skip if no items or no user info
                if (!cart.cart_items || cart.cart_items.length === 0 || !cart.users || !cart.users.email) {
                    continue;
                }

                const user = cart.users;
                logger.info(`✉️ [Cron] Sending cart reminder to ${user.email}...`);

                try {
                    const sent = await sendTemplateEmail(user.email, 'cart_reminder', {
                        userName: user.name || user.email.split('@')[0],
                        itemCount: cart.cart_items.length,
                        cartUrl: `${process.env.FRONTEND_URL || 'https://front-end-rho-five-94.vercel.app'}/cart`
                    });

                    if (!sent) {
                        // Fallback manual email
                        await sendEmail({
                            email: user.email,
                            subject: 'HandyLand - Items in your cart are waiting!',
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2>Hi ${user.name || 'there'}!</h2>
                                    <p>You have left some premium items in your shopping cart at HandyLand.</p>
                                    <p>Don't miss out on completing your purchase!</p>
                                    <br />
                                    <a href="${process.env.FRONTEND_URL || 'https://front-end-rho-five-94.vercel.app'}/cart" style="background: #06b6d4; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Your Order</a>
                                    <br /><br />
                                    <p>Best regards,<br/>The HandyLand Team</p>
                                </div>
                            `,
                            message: `You have items in your cart at HandyLand.`
                        });
                    }

                    remindersSent++;
                } catch (emailErr) {
                    logger.error(`❌ [Cron] Failed to send reminder email to ${user.email}: ${emailErr.message}`);
                }
            }

            logger.info(`✅ [Cron] Cart recovery completed. Sent ${remindersSent} reminder(s).`);
        } catch (err) {
            logger.error(`❌ [Cron] Cart recovery error: ${err.message}`);
        }
    });
};

/**
 * Session & Stale Data Cleanup
 * Runs every Sunday at 3:00 AM to clean up empty carts or stale data.
 */
const startDataCleanupJob = () => {
    // '0 3 * * 0' = Every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        logger.info('🧹 [Cron] Running Weekly Stale Data Cleanup Job...');
        try {
            // Fetch all carts
            const { data: carts, error } = await supabaseAdmin
                .from('carts')
                .select('id, cart_items(id)');

            if (error) throw error;

            let emptyCartsDeleted = 0;

            for (const cart of carts) {
                // If cart has no items, delete it
                if (!cart.cart_items || cart.cart_items.length === 0) {
                    const { error: deleteError } = await supabaseAdmin
                        .from('carts')
                        .delete()
                        .eq('id', cart.id);

                    if (!deleteError) emptyCartsDeleted++;
                }
            }

            logger.info(`✅ [Cron] Cleanup completed. Removed ${emptyCartsDeleted} empty carts.`);
        } catch (err) {
            logger.error(`❌ [Cron] Stale data cleanup error: ${err.message}`);
        }
    });
};

/**
 * Bootstraps and registers all active background services.
 */
const initCronJobs = () => {
    logger.info('⏰ Initialize all HandyLand Background Cron Services...');
    startCartRecoveryJob();
    startDataCleanupJob();
};

module.exports = {
    initCronJobs
};
