const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const RepairPart = require('../models/RepairPart');
const StockHistory = require('../models/StockHistory');

// Helper to update stock based on itemType
const updateItemStock = async (productName, sku, quantity, userId, userName, poNumber) => {
    // Try to find the item in any of the 3 collections by name or sku
    const query = { $or: [{ name: productName }, { barcode: sku }] };
    let item = await Product.findOne(query);
    let itemModel = 'Product';

    if (!item) {
        item = await Accessory.findOne(query);
        itemModel = 'Accessory';
    }

    if (!item) {
        item = await RepairPart.findOne(query);
        itemModel = 'RepairPart';
    }

    if (item) {
        const previousStock = item.stock;
        item.stock += quantity;
        await item.save();

        // Log to history
        await StockHistory.create({
            itemId: item._id,
            itemModel: itemModel,
            itemName: item.name,
            barcode: item.barcode,
            user: userId,
            userName: userName,
            previousStock,
            newStock: item.stock,
            changeAmount: quantity,
            reason: 'PO Received',
            notes: `Stock updated from Purchase Order: ${poNumber}`
        });

        return true;
    }
    return false;
};

// @desc    Get all POs
// @route   GET /api/purchase-orders
// @access  Private/Admin
exports.getPurchaseOrders = async (req, res) => {
    try {
        const pos = await PurchaseOrder.find()
            .populate('supplier', 'name email phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: pos.length, data: pos });
    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single PO
// @route   GET /api/purchase-orders/:id
// @access  Private/Admin
exports.getPurchaseOrder = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('supplier', 'name email address')
            .populate('createdBy', 'name email');

        if (!po) {
            return res.status(404).json({ success: false, message: 'PO not found' });
        }
        res.json({ success: true, data: po });
    } catch (error) {
        console.error('Error fetching PO:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create PO
// @route   POST /api/purchase-orders
// @access  Private/Admin
exports.createPurchaseOrder = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const po = await PurchaseOrder.create(req.body);

        res.status(201).json({ success: true, data: po });
    } catch (error) {
        console.error('Error creating PO:', error);
        res.status(400).json({ success: false, message: error.message || 'Bad Request' });
    }
};

// @desc    Update PO Status
// @route   PUT /api/purchase-orders/:id/status
// @access  Private/Admin
exports.updatePurchaseOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);

        if (!po) {
            return res.status(404).json({ success: false, message: 'PO not found' });
        }

        // Prevent receiving again if already received
        if (po.status === 'Received') {
            return res.status(400).json({ success: false, message: 'PO already received' });
        }

        po.status = status;

        // If status changes to Received, automatically update inventory
        if (status === 'Received') {
            po.actualDeliveryDate = Date.now();
            const missingItems = [];
            const userName = req.user ? `${req.user.name}` : 'Admin';

            for (const item of po.items) {
                const updated = await updateItemStock(item.productName, item.sku, item.quantity, req.user._id, userName, po.poNumber);
                if (!updated) {
                    missingItems.push(item.productName);
                }
            }

            if (missingItems.length > 0) {
                console.warn('Some items in PO were not found in inventory:', missingItems);
                // We still save the PO status, but might want to attach a warning note
                po.notes = `${po.notes ? po.notes + '\\n' : ''}Warning: Items not updated in DB: ${missingItems.join(', ')}`;
            }
        }

        await po.save();
        res.json({ success: true, data: po });
    } catch (error) {
        console.error('Error updating PO status:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
