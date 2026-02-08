const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const RepairDevice = require('../models/RepairDevice');
const RepairCase = require('../models/RepairCase');

exports.getDashboardStats = async (req, res) => {
    try {
        // Run count queries in parallel for performance
        const [
            productCount,
            accessoryCount,
            repairDeviceCount,
            repairCaseCount,
            recentProducts
        ] = await Promise.all([
            Product.countDocuments(),
            Accessory.countDocuments(),
            RepairDevice.countDocuments(),
            RepairCase.countDocuments(),
            Product.find().sort({ createdAt: -1 }).limit(5) // Get 5 most recent products
        ]);

        res.json({
            counts: {
                products: productCount,
                accessories: accessoryCount,
                repairServices: repairDeviceCount,
                portfolioCases: repairCaseCount
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
        // Mock data for graphs (In a real app, aggregation pipelines on Orders/Repairs)
        const balanceTrend = [
            { month: 'Jan', balance: 120 },
            { month: 'Feb', balance: 135 },
            { month: 'Mar', balance: 110 },
            { month: 'Apr', balance: 160 },
            { month: 'May', balance: 195 },
            { month: 'Jun', balance: 250 },
        ];

        const spendingDistribution = [
            { name: 'Purchases', value: 450 },
            { name: 'Repairs', value: 300 },
            { name: 'Accessories', value: 150 },
        ];

        const monthlyOrders = [
            { month: 'Jan', orders: 2 },
            { month: 'Feb', orders: 1 },
            { month: 'Mar', orders: 3 },
            { month: 'Apr', orders: 2 },
            { month: 'May', orders: 4 },
            { month: 'Jun', orders: 2 },
        ];

        res.json({
            success: true,
            balanceTrend,
            spendingDistribution,
            monthlyOrders
        });

    } catch (error) {
        console.error("Error fetching user stats", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
