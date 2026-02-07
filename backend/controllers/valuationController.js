const SavedValuation = require('../models/SavedValuation');
const DeviceBlueprint = require('../models/DeviceBlueprint');
const crypto = require('crypto');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const User = require('../models/User');

// Helper: Calculate Price (Moved from Frontend)
const calculatePriceInternal = async (details) => {
    let price = 0;
    const device = await DeviceBlueprint.findOne({ modelName: details.model });

    if (!device) {
        // Fallback or error if device not found. For now returning a safe default or error.
        // In a real scenario, you might want to throw an error.
        return { price: 0, device: null, error: 'Device not found' };
    }

    price = device.basePrice || 500;

    // 2. Storage Logic
    // Check if blueprint has specific storage price override
    if (device.priceConfig && device.priceConfig.storagePrices && device.priceConfig.storagePrices[details.storage]) {
        price += device.priceConfig.storagePrices[details.storage];
    } else {
        // Multiplier fallback
        let storageMult = 1.0;
        if (details.storage.includes('256')) storageMult = 1.1;
        if (details.storage.includes('512')) storageMult = 1.25;
        if (details.storage.includes('1TB')) storageMult = 1.4;
        price = price * storageMult;
    }

    // 3. Condition Logic
    const defaultModifiers = {
        'new': 1.0,
        'like_new': 0.9,
        'good': 0.75,
        'fair': 0.6,
        'broken': 0.3
    };

    let conditionMult = defaultModifiers[details.condition] || 0.75;
    if (device.priceConfig && device.priceConfig.conditionModifiers && device.priceConfig.conditionModifiers[details.condition]) {
        conditionMult = device.priceConfig.conditionModifiers[details.condition];
    }

    price = price * conditionMult;

    // 4. Battery Logic (Simple Backend Version)
    // If "new" battery (or > 90%), no penalty. If old/bad, penalty.
    // We can accept 'battery' as 'new'/'old' OR numeric 'batteryHealth'
    if (details.batteryHealth) {
        const health = parseInt(details.batteryHealth);
        if (health < 85) {
            price -= 50; // Base penalty
            price -= (85 - health) * 5; // Extra penalty
        }
    } else if (details.battery === 'old' || details.battery === 'service') {
        price = price * 0.8; // Flat 20% penalty for bad battery if no specific health given
    }

    // 5. Accessories
    if (details.accessories) {
        price += 25;
    }

    // Min Value Check
    const scrapValue = device.basePrice * 0.15;
    if (price < scrapValue) price = scrapValue;

    // Rounding
    price = Math.round(price / 5) * 5;

    return { price, device };
};

// @desc    Calculate Valuation (Public/Stateless)
// @route   POST /api/valuation/calculate
// @access  Public
exports.calculateValuation = async (req, res) => {
    try {
        const { model, storage, condition, battery, batteryHealth, accessories } = req.body;

        const { price, error } = await calculatePriceInternal({
            model, storage, condition, battery, batteryHealth, accessories
        });

        if (error) {
            return res.status(404).json({ success: false, message: error });
        }

        res.json({
            success: true,
            estimatedValue: price,
            currency: 'EUR'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Quote & Save (Authenticated)
// @route   POST /api/valuation/quote
// @access  Private
exports.createQuote = async (req, res) => {
    try {
        const { model, storage, condition, battery, batteryHealth, accessories } = req.body;

        // Recalculate price to ensure security
        const { price, device } = await calculatePriceInternal({
            model, storage, condition, battery, batteryHealth, accessories
        });

        // Generate Quote Ref (e.g., HV-1707340800-A3F2)
        const timestamp = Math.floor(Date.now() / 1000);
        const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        const quoteReference = `HV-${timestamp}-${randomPart}`;

        const quote = await SavedValuation.create({
            user: req.user.id,
            device: model,
            specs: `${storage} - ${condition}`,
            condition: condition,
            estimatedValue: price,
            quoteReference,
            isQuote: true,
            expiryDate: Date.now() + 48 * 60 * 60 * 1000 // 48 hours
        });

        // Send Email
        const user = await User.findById(req.user.id);
        if (user) {
            try {
                const emailHtml = emailTemplates.quote(
                    user.firstName || 'User',
                    quote.quoteReference,
                    model,
                    price,
                    `/sell/${quote.quoteReference}`
                );

                await sendEmail({
                    email: user.email,
                    subject: `Your HandyLand Quote: ${quote.quoteReference} - €${price}`,
                    html: emailHtml
                });
            } catch (emailErr) {
                console.error("Failed to send quote email:", emailErr);
                // Don't fail the request, just log it
            }
        }

        res.status(201).json({
            success: true,
            quoteReference: quote.quoteReference,
            estimatedValue: price,
            expiryDate: quote.expiryDate,
            redirectUrl: `/sell/${quote.quoteReference}`
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Save a valuation
// @route   POST /api/valuations/saved
// @access  Private
exports.saveValuation = async (req, res) => {
    try {
        const { device, specs, condition, estimatedValue } = req.body;

        const valuation = await SavedValuation.create({
            user: req.user.id,
            device,
            specs,
            condition,
            estimatedValue
        });

        res.status(201).json({
            success: true,
            valuation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving valuation',
            error: error.message
        });
    }
};

// @desc    Get my saved valuations
// @route   GET /api/valuations/saved
// @access  Private
exports.getMyValuations = async (req, res) => {
    try {
        const valuations = await SavedValuation.find({
            user: req.user.id,
            status: 'active',
            expiryDate: { $gt: Date.now() }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: valuations.length,
            valuations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching valuations',
            error: error.message
        });
    }
};

// @desc    Delete saved valuation
// @route   DELETE /api/valuations/saved/:id
// @access  Private
exports.deleteValuation = async (req, res) => {
    try {
        const valuation = await SavedValuation.findById(req.params.id);

        if (!valuation) {
            return res.status(404).json({
                success: false,
                message: 'Valuation not found'
            });
        }

        if (valuation.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await valuation.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Valuation removed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting valuation',
            error: error.message
        });
    }
};
