const LoanerPhone = require('../models/LoanerPhone');

// @desc    Get loaner stats
// @route   GET /api/loaners/stats
// @access  Private/Admin
exports.getLoanerStats = async (req, res) => {
    try {
        const stats = await LoanerPhone.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            Total: 0,
            Available: 0,
            Lent: 0,
            Maintenance: 0
        };

        stats.forEach(stat => {
            if (formattedStats[stat._id] !== undefined) {
                formattedStats[stat._id] = stat.count;
            }
            formattedStats.Total += stat.count;
        });

        res.json({ success: true, stats: formattedStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all loaner phones
// @route   GET /api/loaners
// @access  Private/Admin
exports.getLoaners = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';
        const startIndex = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { imei: { $regex: search, $options: 'i' } },
                { 'currentCustomer.name': { $regex: search, $options: 'i' } }
            ];
        }

        if (statusFilter && statusFilter !== 'All') {
            query.status = statusFilter;
        }

        const [count, loaners] = await Promise.all([
            LoanerPhone.countDocuments(query),
            LoanerPhone.find(query)
                .sort({ createdAt: -1 })
                .skip(startIndex)
                .limit(limit)
        ]);

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            loaners,
            count,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a new loaner phone
// @route   POST /api/loaners
// @access  Private/Admin
exports.addLoaner = async (req, res) => {
    try {
        const { brand, model, imei, status, notes } = req.body;

        const existing = await LoanerPhone.findOne({ imei });
        if (existing) {
            return res.status(400).json({ message: 'A loaner phone with this IMEI already exists.' });
        }

        const loaner = await LoanerPhone.create({
            brand,
            model,
            imei,
            status: status || 'Available',
            notes
        });

        res.status(201).json(loaner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a loaner phone
// @route   PUT /api/loaners/:id
// @access  Private/Admin
exports.updateLoaner = async (req, res) => {
    try {
        const { brand, model, imei, status, notes } = req.body;
        const loaner = await LoanerPhone.findByIdAndUpdate(
            req.params.id,
            { brand, model, imei, status, notes },
            { new: true, runValidators: true }
        );
        if (!loaner) {return res.status(404).json({ message: 'Loaner phone not found' });}
        res.json(loaner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a loaner phone
// @route   DELETE /api/loaners/:id
// @access  Private/Admin
exports.deleteLoaner = async (req, res) => {
    try {
        const result = await LoanerPhone.findByIdAndDelete(req.params.id);
        if (!result) {return res.status(404).json({ message: 'Loaner phone not found' });}
        res.json({ message: 'Loaner phone removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lend a phone to a customer
// @route   POST /api/loaners/:id/lend
// @access  Private/Admin
exports.lendPhone = async (req, res) => {
    try {
        const { customerName, customerPhone, customerEmail, dueDate, notes } = req.body;
        const loaner = await LoanerPhone.findById(req.params.id);

        if (!loaner) {return res.status(404).json({ message: 'Loaner phone not found' });}
        if (loaner.status === 'Lent') {return res.status(400).json({ message: 'Phone is already lent out.' });}

        loaner.status = 'Lent';
        loaner.currentCustomer = {
            name: customerName,
            phone: customerPhone,
            email: customerEmail
        };
        loaner.lentDate = new Date();
        loaner.dueDate = new Date(dueDate);

        if (notes) {loaner.notes = notes;}

        await loaner.save();
        res.json(loaner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Return a lent phone
// @route   POST /api/loaners/:id/return
// @access  Private/Admin
exports.returnPhone = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const loaner = await LoanerPhone.findById(req.params.id);

        if (!loaner) {return res.status(404).json({ message: 'Loaner phone not found' });}

        // Reset customer details
        loaner.status = status || 'Available';  // Can be moved to 'Maintenance' if returned damaged
        loaner.currentCustomer = { name: '', phone: '', email: '' };
        loaner.lentDate = null;
        loaner.dueDate = null;

        if (notes !== undefined) {loaner.notes = notes;}

        await loaner.save();
        res.json(loaner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
