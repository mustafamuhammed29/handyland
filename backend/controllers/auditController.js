const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const total = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
