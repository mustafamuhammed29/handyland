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
            productIds.length ? Product.find({ _id: { $in: productIds } }).select('name price images category') : [],
            accessoryIds.length ? Accessory.find({ _id: { $in: accessoryIds } }).select('name price images category') : []
        ]);

        // Build lookup maps for O(1) access
        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        const accessoryMap = new Map(accessories.map(a => [a._id.toString(), a]));

        const populatedItems = [];
        for (const item of cart.items) {
            const idStr = item.product?.toString();
            const details = item.productType === 'Product' ? productMap.get(idStr) : accessoryMap.get(idStr);

            if (details) {
                populatedItems.push({
                    id: details._id,
                    title: details.name,
                    price: details.price,
                    image: details.images && details.images.length > 0 ? details.images[0] : '',
                    category: item.productType === 'Product' ? 'device' : 'accessory',
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

        // Merge logic
        // 1. Create a map of existing server items
        const serverMap = new Map();
        cart.items.forEach(item => {
            if (item.product) {
                serverMap.set(item.product.toString(), item);
            }
        });

        // 2. Process local items
        if (localItems && Array.isArray(localItems)) {
            for (const local of localItems) {
                // Validate ObjectId to prevent CastError/Crash
                if (!mongoose.isValidObjectId(local.id)) {
                    console.warn(`Skipping invalid cart item ID during sync: ${local.id}`);
                    continue;
                }

                const productCategory = local.category ? local.category.toLowerCase() : '';
                const productType = (productCategory === 'device' || productCategory === 'phone') ? 'Product' : (productCategory === 'accessory' ? 'Accessory' : 'Product');
                const productId = local.id;

                if (serverMap.has(productId)) {
                    // Update quantity atomically
                    const existing = serverMap.get(productId);
                    const newQuantity = local.quantity || existing.quantity;
                    await Cart.findOneAndUpdate(
                        { user: req.user.id, "items.product": productId },
                        { $set: { "items.$.quantity": newQuantity } }
                    );
                } else {
                    // Add new item atomically
                    await Cart.findOneAndUpdate(
                        { user: req.user.id },
                        { $push: { items: { product: productId, productType, quantity: local.quantity || 1 } } }
                    );
                }
            }
        }

        // FIXED: Batch populate instead of N+1 queries (FIX 8)
        cart = await Cart.findOne({ user: req.user.id });
        if (!cart || cart.items.length === 0) return res.json([]);

        const productIds = cart.items.filter(i => i.productType === 'Product').map(i => i.product);
        const accessoryIds = cart.items.filter(i => i.productType === 'Accessory').map(i => i.product);

        const [products, accessories] = await Promise.all([
            productIds.length ? Product.find({ _id: { $in: productIds } }).select('name price images category') : [],
            accessoryIds.length ? Accessory.find({ _id: { $in: accessoryIds } }).select('name price images category') : []
        ]);

        const productMap = new Map(products.map(p => [p._id.toString(), p]));
        const accessoryMap = new Map(accessories.map(a => [a._id.toString(), a]));

        const populatedItems = [];
        for (const item of cart.items) {
            const idStr = item.product?.toString();
            const details = item.productType === 'Product' ? productMap.get(idStr) : accessoryMap.get(idStr);
            if (details) {
                populatedItems.push({
                    id: details._id,
                    title: details.name,
                    price: details.price,
                    image: details.images && details.images.length > 0 ? details.images[0] : '',
                    category: item.productType === 'Product' ? 'device' : 'accessory',
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
        const { id, productType, quantity } = req.body; // id is productId

        if (quantity <= 0) {
            // Remove item atomically
            await Cart.findOneAndUpdate(
                { user: req.user.id },
                { $pull: { items: { product: id } } }
            );
        } else {
            // Check if item exists first
            const existing = await Cart.findOne({ user: req.user.id, "items.product": id });

            if (existing) {
                // Update quantity atomically
                await Cart.findOneAndUpdate(
                    { user: req.user.id, "items.product": id },
                    { $set: { "items.$.quantity": quantity } }
                );
            } else {
                // Determine model reference
                const catLower = productType ? productType.toLowerCase() : '';
                const typeToSave = (catLower === 'device' || catLower === 'phone') ? 'Product' : (catLower === 'accessory' ? 'Accessory' : 'Product');

                // FIXED: Validate stock before adding new item (FIX 9)
                let stockDoc;
                if (typeToSave === 'Product') {
                    stockDoc = await Product.findById(id).select('stock name');
                } else {
                    stockDoc = await Accessory.findById(id).select('stock name');
                }
                if (!stockDoc) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }
                if (stockDoc.stock < quantity) {
                    return res.status(400).json({ success: false, message: `Only ${stockDoc.stock} units available for ${stockDoc.name}` });
                }

                // Add new item atomically
                await Cart.findOneAndUpdate(
                    { user: req.user.id },
                    { $push: { items: { product: id, productType: typeToSave, quantity } } },
                    { upsert: true, setDefaultsOnInsert: true }
                );
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
                pIds.length ? Product.find({ _id: { $in: pIds } }).select('name price images') : [],
                aIds.length ? Accessory.find({ _id: { $in: aIds } }).select('name price images') : []
            ]);

            const pMap = new Map(prods.map(p => [p._id.toString(), p]));
            const aMap = new Map(accs.map(a => [a._id.toString(), a]));

            const populatedItems = cart.items.map(item => {
                const idStr = item.product?.toString();
                const details = item.productType === 'Product' ? pMap.get(idStr) : aMap.get(idStr);
                return {
                    _id: item._id,
                    product: details
                        ? { _id: details._id, name: details.name, price: details.price, image: details.images && details.images.length > 0 ? details.images[0] : '' }
                        : { name: 'Unknown/Deleted Product', _id: item.product },
                    quantity: item.quantity,
                    productType: item.productType
                };
            });

            return { _id: cart._id, user: cart.user, items: populatedItems, updatedAt: cart.updatedAt, createdAt: cart.createdAt };
        }));

        res.json(populatedCarts);
    } catch (err) {
        console.error("GetAllCarts Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
