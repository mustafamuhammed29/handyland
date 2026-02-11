const Settings = require('../models/Settings');

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

        res.status(200).json(settings);
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
            'repairArchive', 'sections', 'contactSection', 'footerSection'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (!settings) {
            settings = await Settings.create(updateData);
        } else {
            settings = await Settings.findOneAndUpdate({}, { $set: updateData }, { new: true, runValidators: true });
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
