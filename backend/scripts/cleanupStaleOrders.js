/**
 * backend/scripts/cleanupStaleOrders.js
 *
 * Cleanup stale pending orders that were never paid.
 * Restores stock and cancels orders older than STALE_ORDER_MINUTES.
 *
 * Usage:
 *   node scripts/cleanupStaleOrders.js
 *   STALE_ORDER_MINUTES=60 node scripts/cleanupStaleOrders.js
 *
 * Schedule via cron every 30 min (see crontab -e).
 * Or call startPeriodicCleanup() from server.js for in-process scheduling.
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { supabaseAdmin } = require('../config/supabase');

const STALE_MINUTES = parseInt(process.env.STALE_ORDER_MINUTES) || 30;

/**
 * Find and cancel all pending orders older than STALE_MINUTES that haven't been paid.
 * Restores stock, coupon usage, and loyalty points for each cancelled order.
 */
async function cleanupStaleOrders() {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

    console.log(`🧹 Looking for stale pending orders older than ${STALE_MINUTES} minutes (before ${cutoff})...`);

    // Find stale pending orders that are not paid
    const { data: staleOrders, error } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, user_id, coupon_code, discount_amount, points_earned')
        .eq('status', 'pending')
        .neq('payment_status', 'paid')
        .lt('created_at', cutoff);

    if (error) {
        console.error('❌ Error querying stale orders:', error.message);
        return { cleaned: 0, error: error.message };
    }

    if (!staleOrders || staleOrders.length === 0) {
        console.log('✅ No stale orders found.');
        return { cleaned: 0 };
    }

    console.log(`⚠️ Found ${staleOrders.length} stale order(s). Processing...`);
    let cleaned = 0;

    for (const order of staleOrders) {
        try {
            // 1. Restore stock for each order item
            const { data: items } = await supabaseAdmin
                .from('order_items')
                .select('product_id, accessory_id, product_type, quantity')
                .eq('order_id', order.id);

            for (const item of items || []) {
                const table = item.product_type === 'Product' ? 'products' : 'accessories';
                const id = item.product_type === 'Product' ? item.product_id : item.accessory_id;
                if (id) {
                    const { data: p } = await supabaseAdmin
                        .from(table)
                        .select('stock')
                        .eq('id', id)
                        .single();
                    if (p) {
                        await supabaseAdmin
                            .from(table)
                            .update({ stock: p.stock + item.quantity })
                            .eq('id', id);
                    }
                }
            }

            // 2. Restore coupon usage
            if (order.coupon_code && order.discount_amount > 0) {
                await supabaseAdmin.rpc('decrement_coupon_usage', { coupon_code: order.coupon_code });
            }

            // 3. Reverse loyalty points
            if (order.user_id && order.points_earned > 0) {
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('loyalty_points')
                    .eq('id', order.user_id)
                    .single();
                if (user) {
                    await supabaseAdmin.from('users').update({
                        loyalty_points: Math.max(0, (user.loyalty_points || 0) - order.points_earned)
                    }).eq('id', order.user_id);
                }
            }

            // 4. Mark order as cancelled
            await supabaseAdmin
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

            await supabaseAdmin.from('order_status_history').insert({
                order_id: order.id,
                status: 'cancelled',
                note: `Auto-cancelled: payment not received within ${STALE_MINUTES} minutes`
            });

            cleaned++;
            console.log(`  ✅ Cancelled stale order #${order.order_number} (${order.id})`);
        } catch (err) {
            console.error(`  ❌ Failed to clean order #${order.order_number}:`, err.message);
        }
    }

    console.log(`🧹 Cleanup complete: ${cleaned}/${staleOrders.length} orders cancelled.`);
    return { cleaned, total: staleOrders.length };
}

/**
 * Start periodic cleanup (for use as in-process scheduler from server.js).
 * Runs every INTERVAL_MINUTES (default: 30 min).
 */
function startPeriodicCleanup(intervalMinutes = 30) {
    console.log(`🔄 Stale order cleanup scheduled every ${intervalMinutes} minutes`);
    // Run once at startup after a short delay
    setTimeout(() => cleanupStaleOrders().catch(console.error), 10_000);
    // Then repeat on interval
    setInterval(() => cleanupStaleOrders().catch(console.error), intervalMinutes * 60 * 1000);
}

// Run directly if called as a script
if (require.main === module) {
    cleanupStaleOrders()
        .then(result => {
            console.log('Result:', result);
            process.exit(0);
        })
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { cleanupStaleOrders, startPeriodicCleanup };
