const RepairCase = require('../models/RepairCase');

exports.getAllCases = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const search = req.query.search || '';
        const startIndex = (page - 1) * limit;

        const query = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const [count, cases] = await Promise.all([
            RepairCase.countDocuments(query),
            RepairCase.find(query)
                .sort({ createdAt: -1 })
                .skip(startIndex)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            cases,
            count,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
