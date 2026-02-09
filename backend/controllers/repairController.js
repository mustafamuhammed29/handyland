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
exports.estimateRepairCost = (req, res) => {
    const { device, issue } = req.body;

    // Mock logic for estimation
    let baseCost = 50;
    if (device.toLowerCase().includes('iphone')) baseCost += 30;
    if (device.toLowerCase().includes('macbook')) baseCost += 100;
    if (issue.toLowerCase().includes('screen')) baseCost += 80;
    if (issue.toLowerCase().includes('battery')) baseCost += 40;
    if (issue.toLowerCase().includes('water')) baseCost += 100;

    res.json({
        device,
        issue,
        estimatedCost: baseCost,
        currency: 'USD',
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

exports.updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await RepairDevice.findOneAndUpdate(
            { id: id },
            req.body,
            { new: true }
        );
        if (device) res.json(device);
        else res.status(404).json({ message: "Device not found" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        await RepairDevice.findOneAndDelete({ id: id });
        res.json({ message: "Device deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
