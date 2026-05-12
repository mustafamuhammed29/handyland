/**
 * backend/controllers/statsController.js
 * Dashboard statistics using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/stats/dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        // 1. Orders this month
        const { count: currentOrdersCount } = await supabaseAdmin.from('orders')
            .select('id', { count: 'exact' })
            .gte('created_at', startOfMonth);

        // 2. Revenue this month
        const { data: revenueData } = await supabaseAdmin.from('orders')
            .select('total_amount')
            .gte('created_at', startOfMonth)
            .in('status', ['processing', 'shipped', 'delivered']);
            
        const monthlyRevenue = revenueData ? revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0) : 0;

        // 3. Total Users
        const { count: usersCount } = await supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'user');

        // 4. Pending Repair Tickets
        const { count: pendingTickets } = await supabaseAdmin.from('repair_tickets').select('id', { count: 'exact' }).eq('status', 'pending');

        return res.status(200).json({
            success: true,
            data: {
                monthlyOrders: currentOrdersCount || 0,
                monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
                totalUsers: usersCount || 0,
                pendingTickets: pendingTickets || 0
            }
        });
    } catch (error) { next(error); }
};

// @route GET /api/stats/revenue-chart
exports.getRevenueChartData = async (req, res, next) => {
    try {
        // Last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const { data: orders } = await supabaseAdmin.from('orders')
            .select('total_amount, created_at')
            .gte('created_at', sixMonthsAgo.toISOString())
            .in('status', ['processing', 'shipped', 'delivered']);

        const monthlyData = {};
        if (orders) {
            orders.forEach(order => {
                const date = new Date(order.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                if (!monthlyData[month]) monthlyData[month] = 0;
                monthlyData[month] += Number(order.total_amount);
            });
        }

        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);

        return res.status(200).json({ success: true, labels, data });
    } catch (error) { next(error); }
};

// @route GET /api/stats/user
exports.getUserStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Total orders
        const { count: totalOrders } = await supabaseAdmin.from('orders')
            .select('id', { count: 'exact' }).eq('user_id', userId);

        // Total spent
        const { data: spentData } = await supabaseAdmin.from('orders')
            .select('total_amount')
            .eq('user_id', userId)
            .in('status', ['processing', 'shipped', 'delivered']);
        const totalSpent = spentData ? spentData.reduce((sum, o) => sum + Number(o.total_amount), 0) : 0;

        // Active repairs
        const { count: activeRepairs } = await supabaseAdmin.from('repair_tickets')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .in('status', ['pending', 'in_progress', 'waiting_parts']);

        // Wishlist count
        const { count: wishlistCount } = await supabaseAdmin.from('wishlists')
            .select('id', { count: 'exact' }).eq('user_id', userId);

        return res.status(200).json({
            success: true,
            data: {
                totalOrders: totalOrders || 0,
                totalSpent: Number((totalSpent || 0).toFixed(2)),
                activeRepairs: activeRepairs || 0,
                wishlistCount: wishlistCount || 0
            }
        });
    } catch (error) { next(error); }
};
