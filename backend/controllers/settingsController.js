const Settings = require('../models/Settings');
const User = require('../models/User');
const Review = require('../models/Review');
const RepairTicket = require('../models/RepairTicket');
const Order = require('../models/Order');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            // Create default settings if not exists
            settings = await Settings.create({});
        }

        // Calculate dynamic stats parallely
        const [
            happyCustomers,
            devicesRepaired,
            avgRatingAgg,
            oldestOrder
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            RepairTicket.countDocuments(), // Count all tickets as "repaired" or in-process
            Review.aggregate([
                { $group: { _id: null, avg: { $avg: "$rating" } } }
            ]),
            Order.findOne().sort({ createdAt: 1 }).select('createdAt')
        ]);

        // Calculate Market Experience
        let marketExperience = settings.stats?.marketExperience || 0;
        if (!marketExperience && oldestOrder) {
            const startYear = oldestOrder.createdAt.getFullYear();
            const currentYear = new Date().getFullYear();
            marketExperience = currentYear - startYear;
            if (marketExperience < 1) marketExperience = 1; // Minimum 1 year if active
        }

        // Overlay dynamic stats
        const settingsObj = settings.toObject();

        settingsObj.stats = {
            ...settingsObj.stats,
            happyCustomers: happyCustomers || 0,
            devicesRepaired: devicesRepaired || 0,
            averageRating: avgRatingAgg.length > 0 ? parseFloat(avgRatingAgg[0].avg.toFixed(1)) : 5.0, // Default 5 if no reviews
            marketExperience: marketExperience
        };

        // Secure Payment Config (Mask Secret Key and Webhook Secret)
        if (settingsObj.payment && settingsObj.payment.stripe) {
            settingsObj.payment.stripe.secretKey = undefined; // Do not expose secret key
            settingsObj.payment.stripe.webhookSecret = undefined; // Do not expose webhook secret
        }

        res.status(200).json(settingsObj);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        const updateData = {};
        const allowedFields = [
            'siteName', 'contactEmail', 'footerText', 'navbar',
            'hero', 'stats', 'valuation', 'content',
            'repairArchive', 'sections', 'contactSection', 'footerSection', 'freeShippingThreshold', 'payment'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (!settings) {
            settings = await Settings.create(updateData);
        } else {
            // Use findOneAndUpdate to ensure atomic update
            settings = await Settings.findOneAndUpdate(
                {},
                { $set: updateData },
                { new: true, runValidators: true, upsert: true } // upsert creates if not found
            );
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
