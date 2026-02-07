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
