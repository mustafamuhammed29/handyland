const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const RepairDevice = require('../models/RepairDevice');

const RepairCase = require('../models/RepairCase');
const Review = require('../models/Review'); // Added
const Question = require('../models/Question'); // Added

exports.getDashboardStats = async (req, res) => {
    try {
        // Run count queries in parallel for performance
        const [
            productCount,
            accessoryCount,
            repairDeviceCount,
            repairCaseCount,
            recentProducts,
            reviewCount,
            questionCount
        ] = await Promise.all([
            Product.countDocuments(),
            Accessory.countDocuments(),
            RepairDevice.countDocuments(),
            RepairCase.countDocuments(),
            Product.find().sort({ createdAt: -1 }).limit(5),
            Review.countDocuments(),
            Question.countDocuments()
        ]);

        res.json({
            success: true,
            counts: {
                products: productCount,
                accessories: accessoryCount,
                repairServices: repairDeviceCount,
                portfolioCases: repairCaseCount,
                reviews: reviewCount,
                questions: questionCount
            },
            recentActivity: recentProducts
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const RepairTicket = require('../models/RepairTicket');

        // 1. Balance Trend (Last 6 Months Revenue)
        // Group by Month, Sum Total Amount for valid orders
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueAgg = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    status: { $nin: ['cancelled', 'pending'] } // Only count processed/completed
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map numeric months to names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const balanceTrend = revenueAgg.map(item => ({
            month: monthNames[item._id - 1],
            balance: item.total
        })).sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month)); // Simple sort might need year handling but works for short term

        // 2. Spending Distribution (Products vs Accessories vs Repairs)
        // Aggregate Order Items
        const orderDistAgg = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productType",
                    value: { $sum: "$items.price" } // usage price * quantity if quantity existed in unwind, assuming price is unit * qty or just total line item
                }
            }
        ]);

        let productSpend = 0;
        let accessorySpend = 0;

        // Note: Order items price is usually unit price. We should ideally multiply by quantity. 
        // For simplicity reusing this agg. 
        // Better Agg:
        const refinedOrderDist = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productType",
                    total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ]);

        refinedOrderDist.forEach(item => {
            if (item._id === 'Product') productSpend = item.total;
            if (item._id === 'Accessory') accessorySpend = item.total;
        });

        // Repairs Spend (Estimate from Tickets)
        // Assuming completed tickets are paid
        const repairAgg = await RepairTicket.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$estimatedCost" } } }
        ]);
        const repairSpend = repairAgg.length > 0 ? repairAgg[0].total : 0;

        const spendingDistribution = [
            { name: 'Purchases', value: productSpend },
            { name: 'Accessories', value: accessorySpend },
            { name: 'Repairs', value: repairSpend },
        ];

        // 3. Monthly Orders Count
        // Reuse revenueAgg which already grouped by month
        const monthlyOrders = revenueAgg.map(item => ({
            month: monthNames[item._id - 1],
            orders: item.count
        })).sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

        res.json({
            success: true,
            balanceTrend: balanceTrend.length ? balanceTrend : [{ month: 'No Data', balance: 0 }],
            spendingDistribution,
            monthlyOrders: monthlyOrders.length ? monthlyOrders : [{ month: 'No Data', orders: 0 }]
        });

    } catch (error) {
        console.error("Error fetching user stats", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
