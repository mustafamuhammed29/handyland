const express = require('express');
const router = express.Router();
const DeviceBlueprint = require('../models/DeviceBlueprint');

// GET all devices (optionally filter by brand)
router.get('/devices', async (req, res) => {
    try {
        const { brand } = req.query;
        const query = brand ? { brand } : {};
        const devices = await DeviceBlueprint.find(query).sort({ releaseYear: -1, modelName: 1 });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one device
router.get('/devices/:id', async (req, res) => {
    try {
        const device = await DeviceBlueprint.findById(req.params.id);
        if (!device) return res.status(404).json({ message: 'Device not found' });
        res.json(device);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE device
router.post('/devices', async (req, res) => {
    const device = new DeviceBlueprint({
        brand: req.body.brand,
        modelName: req.body.modelName,
        basePrice: req.body.basePrice,
        validStorages: req.body.validStorages,
        imageUrl: req.body.imageUrl,
        marketingName: req.body.marketingName,
        description: req.body.description,
        releaseYear: req.body.releaseYear
    });

    try {
        const newDevice = await device.save();
        res.status(201).json(newDevice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE device
router.put('/devices/:id', async (req, res) => {
    try {
        const updatedDevice = await DeviceBlueprint.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedDevice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE device
router.delete('/devices/:id', async (req, res) => {
    try {
        await DeviceBlueprint.findByIdAndDelete(req.params.id);
        res.json({ message: 'Device deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ==========================================
// SAVED VALUATIONS ROUTES
// ==========================================
const valuationController = require('../controllers/valuationController');
const { protect } = require('../middleware/auth');

// Public Calculation Endpoint
router.post('/calculate', valuationController.calculateValuation);

// Authorized Quote Management
router.post('/quote', protect, valuationController.createQuote);
router.post('/saved', protect, valuationController.saveValuation); // Classic Save (keep for backward compatibility or replace)
router.get('/saved', protect, valuationController.getMyValuations);
router.delete('/saved/:id', protect, valuationController.deleteValuation);

module.exports = router;
