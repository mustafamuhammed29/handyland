const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Get all email templates
// @route   GET /api/emails/templates
// @access  Private/Admin
exports.getTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'welcome',
                name: 'Welcome Email',
                description: 'Sent when a new user registers',
                subject: 'Welcome to HandyLand!'
            },
            {
                id: 'verification',
                name: 'Email Verification',
                description: 'Account activation email',
                subject: 'Verify Your Email'
            },
            {
                id: 'passwordReset',
                name: 'Password Reset',
                description: 'Forgot password email',
                subject: 'Reset Your Password'
            },
            {
                id: 'orderConfirmation',
                name: 'Order Confirmation',
                description: 'Sent when order is placed',
                subject: 'Order Confirmation - HandyLand'
            },
            {
                id: 'orderStatusUpdate',
                name: 'Order Status Update',
                description: 'Sent when order status changes',
                subject: 'Order Update'
            }
        ];

        res.status(200).json({
            success: true,
            count: templates.length,
            templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching templates',
            error: error.message
        });
    }
};

// @desc    Send test email
// @route   POST /api/emails/test
// @access  Private/Admin
exports.sendTestEmail = async (req, res) => {
    try {
        const { templateId, email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        let html;
        let subject;

        switch (templateId) {
            case 'welcome':
                html = emailTemplates.welcome('Test User');
                subject = 'Welcome to HandyLand! (TEST)';
                break;
            case 'verification':
                html = emailTemplates.verification('Test User', 'test-token-123');
                subject = 'Verify Your Email (TEST)';
                break;
            case 'passwordReset':
                html = emailTemplates.passwordReset('Test User', 'test-token-123');
                subject = 'Reset Your Password (TEST)';
                break;
            case 'orderConfirmation':
                const sampleOrder = {
                    orderNumber: 'HL-20240206-1234',
                    createdAt: new Date(),
                    status: 'pending',
                    items: [
                        { name: 'iPhone 13', quantity: 1, price: 699 }
                    ],
                    totalAmount: 699
                };
                html = emailTemplates.orderConfirmation('Test User', sampleOrder);
                subject = 'Order Confirmation - HandyLand (TEST)';
                break;
            case 'orderStatusUpdate':
                const sampleOrder2 = {
                    orderNumber: 'HL-20240206-1234',
                    trackingNumber: 'TRACK123456'
                };
                html = emailTemplates.orderStatusUpdate('Test User', sampleOrder2, 'shipped');
                subject = 'Order Update (TEST)';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid template ID'
                });
        }

        await sendEmail({
            email,
            subject,
            html
        });

        res.status(200).json({
            success: true,
            message: `Test email sent to ${email}`
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
};

// @desc    Get email sending logs (placeholder)
// @route   GET /api/emails/logs
// @access  Private/Admin
exports.getEmailLogs = async (req, res) => {
    try {
        // This is a placeholder. In production, you'd want to:
        // 1. Store email logs in database
        // 2. Use a service like SendGrid to track emails
        // 3. Implement proper logging system

        const logs = [
            {
                id: 1,
                to: 'user@example.com',
                subject: 'Order Confirmation',
                template: 'orderConfirmation',
                status: 'sent',
                sentAt: new Date(),
            },
            {
                id: 2,
                to: 'admin@handyland.com',
                subject: 'Password Reset',
                template: 'passwordReset',
                status: 'sent',
                sentAt: new Date(Date.now() - 3600000),
            }
        ];

        res.status(200).json({
            success: true,
            message: 'Email logs (demo data)',
            count: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching email logs',
            error: error.message
        });
    }
};
