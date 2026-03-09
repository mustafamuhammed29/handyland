const RepairPart = require('../models/RepairPart');

// @desc    Update a repair part
// @route   PUT /api/repair-parts/:id
// @access  Private/Admin
exports.updateRepairPart = async (req, res) => {
    try {
        const part = await RepairPart.findById(req.params.id);

        if (!part) {
            return res.status(404).json({ success: false, message: 'Repair part not found' });
        }

        // Update fields if provided in request body
        const updatableFields = ['name', 'category', 'subCategory', 'brand', 'price', 'cost', 'stock', 'minStock', 'barcode', 'supplier', 'image', 'description', 'isActive'];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                part[field] = req.body[field];
            }
        });

        // Special handling for specs map
        if (req.body.specs) {
            part.specs = req.body.specs;
        }

        const updatedPart = await part.save();

        res.json({ success: true, data: updatedPart });
    } catch (error) {
        console.error('Error updating repair part:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all repair parts
// @route   GET /api/repair-parts
// @access  Private/Admin
exports.getRepairParts = async (req, res) => {
    try {
        const parts = await RepairPart.find({}).sort({ createdAt: -1 });
        res.json({ success: true, count: parts.length, data: parts });
    } catch (error) {
        console.error('Error fetching repair parts:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single repair part
// @route   GET /api/repair-parts/:id
// @access  Private/Admin
exports.getRepairPartById = async (req, res) => {
    try {
        const part = await RepairPart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Repair part not found' });
        }
        res.json({ success: true, data: part });
    } catch (error) {
        console.error('Error fetching repair part:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a repair part
// @route   POST /api/repair-parts
// @access  Private/Admin
exports.createRepairPart = async (req, res) => {
    try {
        const part = await RepairPart.create(req.body);
        res.status(201).json({ success: true, data: part });
    } catch (error) {
        console.error('Error creating repair part:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Barcode already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a repair part
// @route   DELETE /api/repair-parts/:id
// @access  Private/Admin
exports.deleteRepairPart = async (req, res) => {
    try {
        const part = await RepairPart.findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, message: 'Repair part not found' });
        }
        await part.deleteOne();
        res.json({ success: true, message: 'Repair part removed' });
    } catch (error) {
        console.error('Error deleting repair part:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
