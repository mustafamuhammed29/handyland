const Settings = require('../models/Settings');
const { clearCache } = require('../middleware/cache');
const User = require('../models/User');
const Review = require('../models/Review');
const RepairTicket = require('../models/RepairTicket');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const fs = require('fs');
const path = require('path');

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

        const settingsObj = settings.toObject();

        // Secure Payment Config (Mask Secret Key and Webhook Secret)
        if (settingsObj.payment) {
            if (settingsObj.payment.stripe) {
                settingsObj.payment.stripe.secretKey = undefined; // Do not expose secret key
                settingsObj.payment.stripe.webhookSecret = undefined; // Do not expose webhook secret
            }
            if (settingsObj.payment.paypal) {
                settingsObj.payment.paypal.clientSecret = undefined; // Do not expose PayPal secret
            }
        }

        // Fetch Coupon Details for Promo Popup
        if (settingsObj.promoPopup && settingsObj.promoPopup.enabled && settingsObj.promoPopup.couponCode) {
            const coupon = await Coupon.findOne({ code: settingsObj.promoPopup.couponCode.toUpperCase(), isActive: true });
            if (coupon) {
                settingsObj.promoPopup.couponDetails = {
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue || coupon.amount,
                    validUntil: coupon.validUntil,
                    usageLimit: coupon.usageLimit,
                    usedCount: coupon.usedCount,
                };
            }
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
            'siteName', 'contactEmail', 'footerText', 'navbar', 'language',
            'hero', 'stats', 'valuation', 'content',
            'repairArchive', 'sections', 'contactSection', 'footerSection',
            'freeShippingThreshold', 'payment', 'announcementBanner', 'promoPopup', 'socialAuth',
            'invoice', 'seo', 'taxRate', 'vipTiers', 'ecoImpact', 'quickReplies', 'maintenanceMode', 'features', 'accountSuspension', 'productFaqs'
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

        clearCache('/api/settings');

        // Sync MAINTENANCE_MODE file for server.js middleware
        if (req.body.maintenanceMode !== undefined) {
            const MAINTENANCE_FLAG = path.join(__dirname, '../MAINTENANCE_MODE');
            if (req.body.maintenanceMode.enabled) {
                try {
                    fs.writeFileSync(MAINTENANCE_FLAG, JSON.stringify({
                        title: req.body.maintenanceMode.title,
                        message: req.body.maintenanceMode.message,
                        estimatedTime: req.body.maintenanceMode.estimatedTime,
                        statusText1: req.body.maintenanceMode.statusText1,
                        statusText2: req.body.maintenanceMode.statusText2
                    }));
                } catch(e) { console.error('Failed to create MAINTENANCE_MODE file', e); }
            } else {
                if (fs.existsSync(MAINTENANCE_FLAG)) {
                    try {
                        fs.unlinkSync(MAINTENANCE_FLAG);
                    } catch(e) { console.error('Failed to remove MAINTENANCE_MODE file', e); }
                }
            }
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
