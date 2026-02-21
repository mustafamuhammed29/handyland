const SavedValuation = require('../models/SavedValuation');
const DeviceBlueprint = require('../models/DeviceBlueprint');
const crypto = require('crypto');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const User = require('../models/User');

// Helper: Calculate Price (BackMarket Style)
// Price = (basePrice + storageAddon) * screenMult * bodyMult * functionalityMult
const calculatePriceInternal = async (details) => {
    const device = await DeviceBlueprint.findOne({
        model: { $regex: new RegExp(`^${details.model}$`, 'i') }
    });

    if (!device) {
        console.warn(`Valuation: Device not found for model "${details.model}"`);
        return { price: 50, device: null, error: null };
    }

    let price = device.basePrice || 200;

    // 1. Storage Add-on
    const storagePrices = device.storagePrices;
    const storageAddon = storagePrices
        ? (storagePrices instanceof Map ? storagePrices.get(details.storage) : storagePrices[details.storage])
        : undefined;
    if (storageAddon !== undefined && storageAddon !== null) {
        price += storageAddon;
    }

    // 2. Screen Condition Multiplier
    const screenKey = details.screenCondition || 'gut'; // default: gut
    const screenMods = device.screenModifiers || {};
    const screenMult = screenMods[screenKey] ?? 0.75;
    price = price * screenMult;

    // 3. Body Condition Multiplier
    const bodyKey = details.bodyCondition || 'gut'; // default: gut
    const bodyMods = device.bodyModifiers || {};
    const bodyMult = bodyMods[bodyKey] ?? 0.85;
    price = price * bodyMult;

    // 4. Functionality Multiplier
    const isFunctional = details.isFunctional !== false; // default: true
    if (isFunctional) {
        price = price * (device.functionalMultiplier ?? 1.0);
    } else {
        price = price * (device.nonFunctionalMultiplier ?? 0.4);
    }

    // Floor: minimum 15% of base price
    const floor = device.basePrice * 0.15;
    if (price < floor) price = floor;

    // Round to nearest 5
    price = Math.round(price / 5) * 5;

    return { price, device };
};



// @desc    Calculate Valuation (Public/Stateless)
// @route   POST /api/valuation/calculate
// @access  Public
exports.calculateValuation = async (req, res) => {
    try {
        const { model, storage, screenCondition, bodyCondition, isFunctional } = req.body;

        const { price, error } = await calculatePriceInternal({
            model, storage, screenCondition, bodyCondition, isFunctional
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

// --- BLUEPRINT CRUD (ADMIN) ---

// @desc    Get all blueprints
// @route   GET /api/valuation/blueprints
// @access  Private/Admin
exports.getBlueprints = async (req, res) => {
    try {
        const blueprints = await DeviceBlueprint.find().sort({ brand: 1, model: 1 });
        const mappedBlueprints = blueprints.map(bp => ({
            _id: bp._id,
            brand: bp.brand,
            modelName: bp.model,
            imageUrl: bp.image,
            basePrice: bp.basePrice,
            validStorages: bp.validStorages,
            storagePrices: bp.storagePrices ? Object.fromEntries(bp.storagePrices) : {},
            screenModifiers: bp.screenModifiers,
            bodyModifiers: bp.bodyModifiers,
            functionalMultiplier: bp.functionalMultiplier,
            nonFunctionalMultiplier: bp.nonFunctionalMultiplier
        }));
        res.json(mappedBlueprints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create blueprint
// @route   POST /api/valuation/blueprints
// @access  Private/Admin
exports.createBlueprint = async (req, res) => {
    try {
        const {
            brand, modelName, basePrice, imageUrl, validStorages,
            storagePrices, screenModifiers, bodyModifiers,
            functionalMultiplier, nonFunctionalMultiplier
        } = req.body;
        const blueprint = await DeviceBlueprint.create({
            brand,
            model: modelName,
            basePrice,
            image: imageUrl,
            validStorages,
            storagePrices,
            screenModifiers,
            bodyModifiers,
            functionalMultiplier,
            nonFunctionalMultiplier
        });
        res.status(201).json(blueprint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update blueprint
// @route   PUT /api/valuation/blueprints/:id
// @access  Private/Admin
exports.updateBlueprint = async (req, res) => {
    try {
        const {
            brand, modelName, basePrice, imageUrl, validStorages,
            storagePrices, screenModifiers, bodyModifiers,
            functionalMultiplier, nonFunctionalMultiplier
        } = req.body;
        const updateData = {
            brand,
            model: modelName,
            basePrice,
            image: imageUrl,
            validStorages,
            storagePrices,
            screenModifiers,
            bodyModifiers,
            functionalMultiplier,
            nonFunctionalMultiplier
        };

        const blueprint = await DeviceBlueprint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!blueprint) return res.status(404).json({ message: 'Blueprint not found' });
        res.json(blueprint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete blueprint
// @route   DELETE /api/valuation/blueprints/:id
// @access  Private/Admin
exports.deleteBlueprint = async (req, res) => {
    try {
        // Query by MongoDB `_id`
        const result = await DeviceBlueprint.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Blueprint not found' });
        res.json({ message: 'Blueprint deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Quote & Save (Authenticated)
// @route   POST /api/valuation/quote
// @access  Private
exports.createQuote = async (req, res) => {
    try {
        const { model, storage, screenCondition, bodyCondition, isFunctional, contact } = req.body;

        const { price, device } = await calculatePriceInternal({
            model, storage, screenCondition, bodyCondition, isFunctional
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        const quoteReference = `HV-${timestamp}-${randomPart}`;

        const valuationData = {
            device: model,
            specs: `${storage} - Screen: ${screenCondition} / Body: ${bodyCondition}`,
            condition: screenCondition,
            estimatedValue: price,
            quoteReference,
            isQuote: true,
            expiryDate: Date.now() + 48 * 60 * 60 * 1000
        };

        if (req.user) {
            valuationData.user = req.user.id;
        } else if (contact) {
            valuationData.contact = contact;
        }

        const quote = await SavedValuation.create(valuationData);

        // Send Email
        const emailTo = req.user ? req.user.email : (contact ? contact.email : null);
        const name = req.user ? req.user.firstName : (contact ? contact.name : 'Valued Customer');

        if (emailTo) {
            try {
                const emailHtml = emailTemplates.quote(
                    name,
                    quote.quoteReference,
                    model,
                    price,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/sell/${quote.quoteReference}`
                );

                await sendEmail({
                    email: emailTo,
                    subject: `Your HandyLand Quote: ${quote.quoteReference} - €${price}`,
                    html: emailHtml
                });

                // Notify Admin (Optional, good for leads)
                await sendEmail({
                    email: process.env.SMTP_EMAIL, // Send to self/admin
                    subject: `New Quote Generated: ${quote.quoteReference}`,
                    html: `<p>New quote for ${model}: €${price}. Customer: ${name} (${emailTo})</p>`
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
        console.error("Create Quote Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Save a valuation
// @route   POST /api/valuations/saved
// @access  Private
exports.saveValuation = async (req, res) => {
    try {
        const { device, specs, condition, estimatedValue, contact } = req.body;

        const valuationData = {
            device,
            specs,
            condition,
            estimatedValue
        };

        if (req.user) {
            valuationData.user = req.user.id;
        } else if (contact) {
            valuationData.contact = contact;
        } else {
            return res.status(400).json({ success: false, message: 'User or Contact info required' });
        }

        const valuation = await SavedValuation.create(valuationData);

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

// @desc    Get Quote by Reference (Public)
// @route   GET /api/valuation/quote/:reference
// @access  Public
exports.getQuoteByReference = async (req, res) => {
    try {
        const quote = await SavedValuation.findOne({
            quoteReference: req.params.reference,
            isQuote: true
        });

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        if (new Date() > new Date(quote.expiryDate)) {
            return res.status(400).json({ success: false, message: 'Quote has expired' });
        }

        res.json({
            success: true,
            quote: {
                reference: quote.quoteReference,
                model: quote.device,
                price: quote.estimatedValue,
                specs: quote.specs,
                condition: quote.condition,
                status: quote.status
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Confirm Quote & Add Details
// @route   PUT /api/valuation/quote/:reference/confirm
// @access  Public
exports.confirmQuote = async (req, res) => {
    try {
        const { fullName, email, address, city, postalCode, iban, bankName } = req.body;

        const quote = await SavedValuation.findOne({
            quoteReference: req.params.reference,
            isQuote: true
        });

        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        // Update Quote with details
        quote.contact = { name: fullName, email, phone: '' }; // Add phone if collected
        quote.paymentDetails = { iban, bankName };
        quote.shippingAddress = { address, city, postalCode };
        quote.status = 'pending_shipment';

        await quote.save();

        // Send Shipping Label Email
        try {
            // Mock Shipping Label URL (In real app, generate FedEx/DHL label here)
            const shippingLabelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/labels/shipping-${quote.quoteReference}.pdf`;

            await sendEmail({
                email: email,
                subject: `Shipping Label for Sell Order ${quote.quoteReference}`,
                html: `
                    <h1>Sales Confirmation</h1>
                    <p>Dear ${fullName},</p>
                    <p>Thank you for selling your <strong>${quote.device}</strong> to HandyLand for <strong>€${quote.estimatedValue}</strong>.</p>
                    <p>Please print the attached shipping label and send your device within 2 business days.</p>
                    <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9;">
                        <strong>Next Steps:</strong>
                        <ol>
                            <li>Reset your device to factory settings and remove iCloud/Google Lock.</li>
                            <li>Pack the device securely.</li>
                            <li>Attach the label below to the box.</li>
                            <li>Drop it off at the nearest post office.</li>
                        </ol>
                    </div>
                    <p>We will inspect the device upon arrival and process your payment to <strong>${bankName} (Ending in ${iban.slice(-4)})</strong>.</p>
                `
            });

            // Notify Admin
            await sendEmail({
                email: process.env.SMTP_EMAIL,
                subject: `New Device Sale Confirmed: ${quote.quoteReference}`,
                html: `<p>User ${fullName} confirmed sale of ${quote.device} for €${quote.estimatedValue}. Waiting for shipment.</p>`
            });

        } catch (emailErr) {
            console.error("Failed to send shipping email:", emailErr);
        }

        res.json({ success: true, message: 'Sale confirmed' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user's saved valuations
// @route   GET /api/valuation/my-valuations
// @access  Private
exports.getMyValuations = async (req, res) => {
    try {
        const valuations = await SavedValuation.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json(valuations);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Save a new valuation for the logged-in user
// @route   POST /api/valuation/saved
// @access  Private
exports.saveValuation = async (req, res) => {
    try {
        const { model, storage, screenCondition, bodyCondition, isFunctional } = req.body;

        // Re-calculate price securely on backend
        const { price } = await calculatePriceInternal({
            model, storage, screenCondition, bodyCondition, isFunctional
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        const quoteReference = `HV-${timestamp}-${randomPart}`;

        const saved = await SavedValuation.create({
            user: req.user._id,
            device: model,
            specs: `${storage} | Screen: ${screenCondition} | Body: ${bodyCondition}`,
            condition: screenCondition,
            estimatedValue: price,
            quoteReference,
            isQuote: true,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        });

        res.status(201).json({
            success: true,
            quoteReference: saved.quoteReference,
            estimatedValue: saved.estimatedValue
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a user's saved valuation
// @route   DELETE /api/valuation/saved/:id
// @access  Private
exports.deleteValuation = async (req, res) => {
    try {
        const result = await SavedValuation.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });
        if (!result) return res.status(404).json({ success: false, message: 'Valuation not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


