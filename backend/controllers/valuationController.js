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
    const screenKey = details.screenCondition || 'gut';
    const screenMods = device.screenModifiers || {};
    const screenMult = screenMods[screenKey] ?? 0.75;
    price = price * screenMult;

    // 3. Body Condition Multiplier
    const bodyKey = details.bodyCondition || 'gut';
    const bodyMods = device.bodyModifiers || {};
    const bodyMult = bodyMods[bodyKey] ?? 0.85;
    price = price * bodyMult;

    // 4. Functionality Multiplier
    const isFunctional = details.isFunctional !== false;
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

        // Generate a temporary reference so the frontend can display it immediately
        const tempRef = `HV-TEMP-${Date.now()}`;

        res.json({
            success: true,
            estimatedValue: price,
            currency: 'EUR',
            quoteReference: tempRef
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

                await sendEmail({
                    email: process.env.SMTP_EMAIL,
                    subject: `New Quote Generated: ${quote.quoteReference}`,
                    html: `<p>New quote for ${model}: €${price}. Customer: ${name} (${emailTo})</p>`
                });

            } catch (emailErr) {
                console.error("Failed to send quote email:", emailErr);
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

        quote.contact = { name: fullName, email, phone: '' };
        quote.paymentDetails = { iban, bankName };
        quote.shippingAddress = { address, city, postalCode };
        quote.status = 'pending_shipment';

        await quote.save();

        try {
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

// @desc    Get all quotes (Admin)
// @route   GET /api/valuation/admin/quotes
// @access  Private/Admin
exports.getAdminQuotes = async (req, res) => {
    try {
        const quotes = await SavedValuation.find({ isQuote: true })
            .sort({ createdAt: -1 })
            .populate('user', 'firstName lastName email')
            .lean();

        // Stats
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayCount = quotes.filter(q => new Date(q.createdAt) >= startOfDay).length;
        const totalPaidValue = quotes
            .filter(q => q.status === 'paid')
            .reduce((sum, q) => sum + (q.estimatedValue || 0), 0);
        const pendingCount = quotes.filter(q => q.status === 'pending_shipment').length;

        res.json({
            success: true,
            stats: {
                todayCount,
                totalPaidValue,
                pendingCount,
                totalCount: quotes.length
            },
            quotes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update quote status (Admin)
// @route   PUT /api/valuation/admin/quotes/:id/status
// @access  Private/Admin
exports.updateQuoteStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending_shipment', 'received', 'paid'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const quote = await SavedValuation.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }

        const oldStatus = quote.status;
        quote.status = status;
        await quote.save();

        // Send email notification on status change
        const emailTo = quote.contact?.email || null;
        const customerName = quote.contact?.name || 'Customer';

        const statusMessages = {
            received: {
                subject: `Wir haben dein Gerät erhalten – ${quote.quoteReference}`,
                html: `
                    <h2>Dein Gerät ist bei uns angekommen!</h2>
                    <p>Liebe/r ${customerName},</p>
                    <p>Wir haben dein <strong>${quote.device}</strong> (Ref: ${quote.quoteReference}) erhalten und prüfen es gerade.</p>
                    <p>Nach erfolgreicher Prüfung wird die Zahlung von <strong>€${quote.estimatedValue}</strong> an dein Konto überwiesen.</p>
                    <p>Dies dauert in der Regel <strong>1–2 Werktage</strong>.</p>
                    <br><p>Vielen Dank für dein Vertrauen in HandyLand!</p>
                `
            },
            paid: {
                subject: `Zahlung veranlasst – ${quote.quoteReference}`,
                html: `
                    <h2>Deine Zahlung wurde veranlasst! 🎉</h2>
                    <p>Liebe/r ${customerName},</p>
                    <p>Wir haben <strong>€${quote.estimatedValue}</strong> für dein <strong>${quote.device}</strong> (Ref: ${quote.quoteReference}) an dein Konto überwiesen.</p>
                    <p>Der Betrag sollte innerhalb von <strong>1–3 Werktagen</strong> auf deinem Konto erscheinen.</p>
                    <br><p>Vielen Dank – wir freuen uns, dich wieder bei HandyLand begrüßen zu dürfen!</p>
                `
            }
        };

        if (emailTo && statusMessages[status]) {
            try {
                await sendEmail({
                    email: emailTo,
                    ...statusMessages[status]
                });
            } catch (emailErr) {
                console.error('Failed to send status email:', emailErr);
            }
        }

        res.json({ success: true, quote, oldStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
