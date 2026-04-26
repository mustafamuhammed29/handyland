const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart || cart.items.length === 0) {
            return res.json([]);
        }

        // Batch fetch: Separate product/accessory IDs to avoid N+1 queries
        const productIds = cart.items.filter(i => i.productType === 'Product').map(i => i.product);
        const accessoryIds = cart.items.filter(i => i.productType === 'Accessory').map(i => i.product);

        const [products, accessories] = await Promise.all([
            productIds.length ? Product.find({ _id: { $in: productIds } }).select('name model price images image category storage color') : [],
            accessoryIds.length ? Accessory.find({ _id: { $in: accessoryIds } }).select('name model price images image category color') : []
        ]);

        // Build lookup maps for O(1) access
        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        const accessoryMap = new Map(accessories.map(a => [a._id.toString(), a]));

        const populatedItems = [];
        for (const item of cart.items) {
            const idStr = item.product?.toString();
            const details = item.productType === 'Product' ? productMap.get(idStr) : accessoryMap.get(idStr);

            if (details) {
                const subtitle = details.storage && details.color
                    ? `${details.storage} • ${details.color}`
                    : (details.storage || details.color || '');

                populatedItems.push({
                    id: details._id,
                    title: details.name || details.model,
                    subtitle,
                    price: details.price,
                    image: details.images && details.images.length > 0 ? details.images[0] : (details.image || ''),
                    category: details.category || (item.productType === 'Product' ? 'device' : 'accessory'),
                    quantity: item.quantity,
                    productType: item.productType
                });
            }
        }

        res.json(populatedItems);
    } catch (err) {
        console.error('Cart GET Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Sync local cart with server cart (Merge)
// @route   POST /api/cart/sync
// @access  Private
exports.syncCart = async (req, res) => {
    try {
        const { localItems } = req.body;
        const mongoose = require('mongoose');

        // Use findOneAndUpdate with upsert to atomically create-or-get cart
        // This prevents duplicate key errors from concurrent requests (e.g. React StrictMode)
        let cart = await Cart.findOneAndUpdate(
            { user: req.user.id },
            { $setOnInsert: { user: req.user.id, items: [] } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // FIXED: Clean up any existing duplicates (from previous race conditions) before processing
        const uniqueProducts = new Set();
        const duplicateIds = [];
        cart.items.forEach(item => {
            if (item.product) {
                const pid = item.product.toString();
                if (uniqueProducts.has(pid)) {
                    duplicateIds.push(item._id);
                } else {
                    uniqueProducts.add(pid);
                }
            }
        });

        if (duplicateIds.length > 0) {
            await Cart.updateOne(
                { user: req.user.id },
                { $pull: { items: { _id: { $in: duplicateIds } } } }
            );
            cart = await Cart.findOne({ user: req.user.id }); // Refresh
        }

        // Merge logic
        // 1. Create a map of existing server items
        const serverMap = new Map();
        cart.items.forEach(item => {
            if (item.product) {
                serverMap.set(item.product.toString(), item);
            }
        });

        // 2. Process local items synchronously
        if (localItems && Array.isArray(localItems)) {
            for (const local of localItems) {
                const productCategory = local.category ? local.category.toLowerCase() : '';
                const productType = (productCategory === 'device' || productCategory === 'phone') ? 'Product' : (productCategory === 'accessory' ? 'Accessory' : 'Product');

                // Resolve real ObjectId from UUID or ObjectId
                let realId = local.id;
                if (!mongoose.isValidObjectId(local.id)) {
                    const Model = productType === 'Product' ? Product : Accessory;
                    const doc = await Model.findOne({ id: local.id }).select('_id');
                    if (doc) {
                        realId = doc._id.toString();
                    } else {
                        console.warn(`Skipping invalid cart item ID during sync (not found): ${local.id}`);
                        continue;
                    }
                }

                const productId = realId;

                if (serverMap.has(productId)) {
                    // Update quantity atomically
                    const existing = serverMap.get(productId);
                    const parsedQty = local.quantity || existing.quantity;
                    const newQuantity = Math.min(Number(parsedQty), 100);
                    await Cart.updateOne(
                        { user: req.user.id, "items.product": productId },
                        { $set: { "items.$.quantity": newQuantity } }
                    );
                } else {
                    const addQty = Math.min(Number(local.quantity || 1), 100);
                    // Atomic update to avoid race conditions pushing duplicates
                    const addResult = await Cart.updateOne(
                        { user: req.user.id, "items.product": { $ne: productId } },
                        { $push: { items: { product: productId, productType, quantity: addQty } } }
                    );

                    if (addResult.modifiedCount === 0) {
                        // Product was added by a parallel request race condition just now
                        await Cart.updateOne(
                            { user: req.user.id, "items.product": productId },
                            { $set: { "items.$.quantity": addQty } }
                        );
                    }

                    // Add it to map so if localItems has duplicates itself, it hits the update block
                    serverMap.set(productId, { quantity: addQty });
                }
            }
        }

        // FIXED: Batch populate instead of N+1 queries (FIX 8)
        cart = await Cart.findOne({ user: req.user.id });
        if (!cart || cart.items.length === 0) {return res.json([]);}

        const productIds = cart.items.filter(i => i.productType === 'Product').map(i => i.product);
        const accessoryIds = cart.items.filter(i => i.productType === 'Accessory').map(i => i.product);

        const [products, accessories] = await Promise.all([
            productIds.length ? Product.find({ _id: { $in: productIds } }).select('name model price images image category storage color') : [],
            accessoryIds.length ? Accessory.find({ _id: { $in: accessoryIds } }).select('name model price images image category color') : []
        ]);

        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        const accessoryMap = new Map(accessories.map(a => [a._id.toString(), a]));

        const populatedItems = [];
        for (const item of cart.items) {
            const idStr = item.product?.toString();
            const details = item.productType === 'Product' ? productMap.get(idStr) : accessoryMap.get(idStr);
            if (details) {
                const subtitle = details.storage && details.color
                    ? `${details.storage} • ${details.color}`
                    : (details.storage || details.color || '');

                populatedItems.push({
                    id: details._id,
                    title: details.name || details.model,
                    subtitle,
                    price: details.price,
                    image: details.images && details.images.length > 0 ? details.images[0] : (details.image || ''),
                    category: details.category || (item.productType === 'Product' ? 'device' : 'accessory'),
                    quantity: item.quantity,
                    productType: item.productType
                });
            }
        }

        res.json(populatedItems);

    } catch (err) {
        console.error("Sync Cart Error:", err);
        res.status(500).json({ message: 'Server Error during cart sync' });
    }
};

// @desc    Update cart item (add/remove/update qty)
// @route   PUT /api/cart
// @access  Private
exports.updateCart = async (req, res) => {
    try {
        const { id, productType, quantity } = req.body; // id could be ObjectId or UUID

        const mongoose = require('mongoose');
        const catLower = productType ? productType.toLowerCase() : '';
        const typeToSave = (catLower === 'device' || catLower === 'phone') ? 'Product' : (catLower === 'accessory' ? 'Accessory' : 'Product');
        const Model = typeToSave === 'Product' ? Product : Accessory;

        // Resolve real ObjectId
        let realId = id;
        if (!mongoose.isValidObjectId(id)) {
            const doc = await Model.findOne({ id }).select('_id');
            if (doc) {
                realId = doc._id.toString();
            } else {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
        }

        if (quantity <= 0) {
            // Remove item atomically
            await Cart.findOneAndUpdate(
                { user: req.user.id },
                { $pull: { items: { product: realId } } }
            );
        } else {
            // Check if item exists first
            const existing = await Cart.findOne({ user: req.user.id, "items.product": realId });

            if (existing) {
                // Update quantity atomically
                const cappedQty = Math.min(Number(quantity), 100);
                await Cart.findOneAndUpdate(
                    { user: req.user.id, "items.product": realId },
                    { $set: { "items.$.quantity": cappedQty } }
                );
            } else {
                // FIXED: Validate stock before adding new item (FIX 9)
                const cappedQty = Math.min(Number(quantity), 100);
                const stockDoc = await Model.findById(realId).select('stock name');
                if (!stockDoc) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }
                if (stockDoc.stock < cappedQty) {
                    return res.status(400).json({ success: false, message: `Only ${stockDoc.stock} units available for ${stockDoc.name}` });
                }

                // Add new item atomically using resilient atomic update pattern
                const addResult = await Cart.updateOne(
                    { user: req.user.id, "items.product": { $ne: realId } },
                    { $push: { items: { product: realId, productType: typeToSave, quantity: cappedQty } } }
                );

                if (addResult.modifiedCount === 0) {
                     // Parallel request already added it
                     await Cart.updateOne(
                         { user: req.user.id, "items.product": realId },
                         { $set: { "items.$.quantity": cappedQty } }
                     );
                }
            }
        }

        // Return the updated cart for frontend validation
        const updatedCart = await Cart.findOne({ user: req.user.id }) || { items: [] };
        res.json({ success: true, cart: updatedCart.items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user.id });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all active carts (Admin)
// @route   GET /api/cart/all
// @access  Private/Admin
exports.getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find({ "items.0": { $exists: true } }).populate('user', 'name email').sort({ updatedAt: -1 });

        // FIXED: Batch queries per cart instead of N+1 (FIX 10)
        const populatedCarts = await Promise.all(carts.map(async (cart) => {
            if (!cart.items || cart.items.length === 0) {
                return { _id: cart._id, user: cart.user, items: [], updatedAt: cart.updatedAt, createdAt: cart.createdAt };
            }

            const pIds = cart.items.filter(i => i.productType === 'Product' && i.product).map(i => i.product);
            const aIds = cart.items.filter(i => i.productType === 'Accessory' && i.product).map(i => i.product);

            const [prods, accs] = await Promise.all([
                pIds.length ? Product.find({ _id: { $in: pIds } }).select('name model price images image storage color') : [],
                aIds.length ? Accessory.find({ _id: { $in: aIds } }).select('name model price images image color') : []
            ]);

            const pMap = new Map(prods.map(p => [p._id.toString(), p]));
            const aMap = new Map(accs.map(a => [a._id.toString(), a]));

            const populatedItems = cart.items.map(item => {
                const idStr = item.product?.toString();
                const details = item.productType === 'Product' ? pMap.get(idStr) : aMap.get(idStr);
                return {
                    _id: item._id,
                    product: details
                        ? {
                            _id: details._id,
                            name: details.name || details.model,
                            subtitle: details.storage && details.color ? `${details.storage} • ${details.color}` : (details.storage || details.color || ''),
                            price: details.price,
                            image: details.images && details.images.length > 0 ? details.images[0] : (details.image || '')
                          }
                        : { name: 'Unknown/Deleted Product', _id: item.product },
                    quantity: item.quantity,
                    productType: item.productType
                };
            });

            return { _id: cart._id, user: cart.user, items: populatedItems, updatedAt: cart.updatedAt, createdAt: cart.createdAt, lastReminderSentAt: cart.lastReminderSentAt };
        }));

        res.json(populatedCarts);
    } catch (err) {
        console.error("GetAllCarts Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send manual abandoned cart reminder
// @route   POST /api/cart/admin/:id/remind
// @access  Private/Admin
exports.sendCartReminder = async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.id).populate('user', 'name email');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        if (!cart.user || !cart.user.email) {
            return res.status(400).json({ success: false, message: 'Cart does not have a valid user email' });
        }

        const { sendEmail } = require('../utils/emailService');
        const EmailTemplate = require('../models/EmailTemplate');

        const template = await EmailTemplate.findOne({ name: 'abandoned_cart', isActive: true });
        
        if (!template) {
            return res.status(400).json({ success: false, message: 'Abandoned cart email template is disabled or not found.' });
        }

        const cartUrl = `${process.env.FRONTEND_URL}/cart`;
        const userName = cart.user.name.split(' ')[0];
        
        let html = template.html
            .replace(/{{userName}}/g, userName)
            .replace(/{{cartUrl}}/g, cartUrl);
        
        let subject = template.subject
            .replace(/{{userName}}/g, userName);

        await sendEmail({
            email: cart.user.email,
            subject: subject,
            html: html
        });

        cart.lastReminderSentAt = new Date();
        await cart.save();

        res.json({ success: true, message: 'Reminder email sent successfully', lastReminderSentAt: cart.lastReminderSentAt });
    } catch (err) {
        console.error("sendCartReminder Error:", err);
        res.status(500).json({ message: 'Failed to send reminder', error: err.message });
    }
};

// @desc    Clear specific user cart by admin
// @route   DELETE /api/cart/admin/:id/clear
// @access  Private/Admin
exports.adminClearCart = async (req, res) => {
    try {
        const cart = await Cart.findByIdAndDelete(req.params.id);
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        res.json({ success: true, message: 'Cart cleared successfully' });
    } catch (err) {
        console.error("adminClearCart Error:", err);
        res.status(500).json({ message: 'Failed to clear cart', error: err.message });
    }
};
