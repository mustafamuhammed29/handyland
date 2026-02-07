const RepairCase = require('../models/RepairCase');

exports.getAllCases = async (req, res) => {
    try {
        const cases = await RepairCase.find().sort({ createdAt: -1 });
        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCase = async (req, res) => {
    try {
        const newCase = new RepairCase(req.body);
        await newCase.save();
        res.status(201).json(newCase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCase = async (req, res) => {
    try {
        await RepairCase.findByIdAndDelete(req.params.id);
        res.json({ message: 'Case deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCase = async (req, res) => {
    try {
        const updatedCase = await RepairCase.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
