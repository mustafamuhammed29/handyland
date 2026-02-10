const Settings = {
    freeShippingThreshold: 100, // Default value, could be moved to DB later
    // Add other global settings here
};

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = (req, res) => {
    res.status(200).json({
        success: true,
        data: Settings
    });
};
