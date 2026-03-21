const RepairDevice = require('../models/RepairDevice');

exports.getRepairCatalog = async (req, res) => {
    try {
        const devices = await RepairDevice.find();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDeviceServices = async (req, res) => {
    try {
        const { id } = req.params;
        const { services } = req.body;

        const device = await RepairDevice.findOneAndUpdate(
            { id: id },
            { services: services },
            { new: true }
        );

        if (device) {
            res.json(device);
        } else {
            res.status(404).json({ message: "Device not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... existing methods
// FIXED: Added input validation (FIX 1)
exports.estimateRepairCost = (req, res) => {
    const { device, issue } = req.body;

    if (!device || !issue || typeof device !== 'string' || typeof issue !== 'string') {
        return res.status(400).json({ success: false, message: 'Device and issue are required and must be strings.' });
    }
    if (device.length > 100 || issue.length > 200) {
        return res.status(400).json({ success: false, message: 'Input too long.' });
    }

    // Mock logic for estimation
    let baseCost = 50;
    if (device.toLowerCase().includes('iphone')) {baseCost += 30;}
    if (device.toLowerCase().includes('macbook')) {baseCost += 100;}
    if (issue.toLowerCase().includes('screen')) {baseCost += 80;}
    if (issue.toLowerCase().includes('battery')) {baseCost += 40;}
    if (issue.toLowerCase().includes('water')) {baseCost += 100;}

    res.json({
        device,
        issue,
        estimatedCost: baseCost,
        currency: 'EUR',
        note: 'This is a preliminary estimate. Final cost may vary after diagnostic.'
    });
};

exports.createDevice = async (req, res) => {
    try {
        const { model, brand, image, services, isVisible } = req.body;
        // Generate ID if not provided, or ensure unique
        const newDevice = new RepairDevice({
            ...req.body,
            id: require('uuid').v4(),
            services: services || []
        });
        await newDevice.save();
        res.status(201).json(newDevice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// FIXED: Whitelist allowed fields (FIX 2)
exports.updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = ['model', 'brand', 'image', 'services', 'isVisible', 'description'];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {updateData[field] = req.body[field];}
        });

        const device = await RepairDevice.findOneAndUpdate(
            { id: id },
            updateData,
            { new: true, runValidators: true }
        );
        if (device) {res.json(device);}
        else {res.status(404).json({ message: "Device not found" });}
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// FIXED: Return 404 when device not found (FIX 3)
exports.deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await RepairDevice.findOneAndDelete({ id: id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }
        res.json({ success: true, message: 'Device deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
