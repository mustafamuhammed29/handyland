const EmailTemplate = require('../models/EmailTemplate');

// @desc    Get all email templates
// @route   GET /api/email-templates
// @access  Private/Admin
exports.getEmailTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching email templates',
            error: error.message
        });
    }
};

// @desc    Get single email template
// @route   GET /api/email-templates/:id
// @access  Private/Admin
exports.getEmailTemplate = async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }
        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching email template',
            error: error.message
        });
    }
};

// @desc    Update an email template
// @route   PUT /api/email-templates/:id
// @access  Private/Admin
exports.updateEmailTemplate = async (req, res) => {
    try {
        const { subject, html, isActive } = req.body;

        const template = await EmailTemplate.findByIdAndUpdate(
            req.params.id,
            { subject, html, isActive },
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email template updated successfully',
            data: template
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating email template',
            error: error.message
        });
    }
};
