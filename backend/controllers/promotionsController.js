const Promotion = require('../models/Promotion');

exports.getPromotions = async (req, res) => {
    try {
        // If admin, they might want all. Otherwise active only. For now just return active.
        const promotions = await Promotion.find({ isActive: true });
        res.json({ success: true, count: promotions.length, promotions, data: promotions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.createPromotion = async (req, res) => {
    try {
        const promotion = await Promotion.create(req.body);
        res.status(201).json({ success: true, data: promotion, promotion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        res.json({ success: true, data: promotion, promotion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promotion not found' });
        }
        await promotion.deleteOne();
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
