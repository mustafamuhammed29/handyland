const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.json([]);
        }

        // Populate items
        // Since we have dynamic refs (Product vs Accessory), standard populate is tricky if we store them in one array with mixed types.
        // Mongoose refPath handles this if setup correctly.
        // Let's try to populate based on refPath.

        // However, refPath in array subdocument might be tricky.
        // Alternative: Fetch items manually or use a library.
        // Or simpler: Just return the IDs and let frontend fetch details? No, backend should populate.

        // Mongoose 'populate' with 'refPath' works fine usually.
        // But let's be explicit and robust.

        // Actually, to make it easier for frontend which expects { id, title, price, image, category ... }
        // We might want to format the response.

        // Let's try standard population first.
        // Note: The schema defines `product` with `refPath: 'items.productType'`. 
        // Need to make sure `items` matches the schema structure.

        // Wait, 'refPath' looks at the document property. Inside an array, strict relative paths can be complex.
        // Let's assume standard populate works for now, or we do manual fetch.

        // Manual fetch is safer for mixed types if standard populate fails.
        const populatedItems = [];

        for (const item of cart.items) {
            let details;
            if (item.productType === 'Product') {
                details = await Product.findById(item.product).select('name price images category');
            } else {
                details = await Accessory.findById(item.product).select('name price images category');
            }

            if (details) {
                populatedItems.push({
                    id: details._id,
                    title: details.name,
                    price: details.price,
                    image: details.images && details.images.length > 0 ? details.images[0] : '',
                    category: item.productType === 'Product' ? 'device' : 'accessory',
                    quantity: item.quantity,
                    productType: item.productType // For frontend context
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

                const productType = local.category === 'device' ? 'Product' : 'Accessory';
                const productId = local.id;

                if (serverMap.has(productId)) {
                    // Update quantity (User preference: maybe max of both? or local overrides? usually local is fresher if just logged in)
                    const existing = serverMap.get(productId);
                    existing.quantity = local.quantity || existing.quantity;
                } else {
                    // Add new item
                    cart.items.push({
                        product: productId,
                        productType,
                        quantity: local.quantity || 1
                    });
                }
            }
        }

        await cart.save();

        const populatedItems = [];
        for (const item of cart.items) {
            let details;
            // Additional check if product exists (it might be deleted but still in cart)
            if (!item.product) continue;

            try {
                if (item.productType === 'Product') {
                    details = await Product.findById(item.product).select('name price images category');
                } else {
                    details = await Accessory.findById(item.product).select('name price images category');
                }

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
            } catch (innerErr) {
                console.error(`Error populating item ${item.product}:`, innerErr);
                // Continue to next item instead of failing whole request
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

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        if (quantity <= 0) {
            // Remove item
            cart.items = cart.items.filter(item => item.product.toString() !== id);
        } else {
            // Update or Add
            const existingIndex = cart.items.findIndex(item => item.product.toString() === id);

            if (existingIndex > -1) {
                cart.items[existingIndex].quantity = quantity;
            } else {
                cart.items.push({
                    product: id,
                    productType: productType === 'device' ? 'Product' : 'Accessory',
                    quantity
                });
            }
        }

        await cart.save();
        res.json({ success: true, cart: cart.items }); // Simple ack
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
        const carts = await Cart.find().populate('user', 'name email').sort({ updatedAt: -1 });

        // Manually populate items to handle dynamic refs (Product vs Accessory) matching getCart logic
        const populatedCarts = await Promise.all(carts.map(async (cart) => {
            const populatedItems = [];
            for (const item of cart.items) {
                // Skip if no product ID
                if (!item.product) continue;

                let details;
                try {
                    if (item.productType === 'Product') {
                        details = await Product.findById(item.product).select('name price images category');
                    } else if (item.productType === 'Accessory') {
                        details = await Accessory.findById(item.product).select('name price images category');
                    }

                    if (details) {
                        populatedItems.push({
                            _id: item._id, // Keep item ID
                            product: { // Nest details to match common structure or flatten? 
                                // Admin likely expects "product" object. 
                                // Let's look at how getCart returns it: it returns a flat list of items.
                                // But getAllCarts returns a list of Carts.
                                // So cart.items should be replaced or mapped.
                                _id: details._id,
                                name: details.name,
                                price: details.price,
                                image: details.images && details.images.length > 0 ? details.images[0] : '',
                                category: item.productType === 'Product' ? 'device' : 'accessory'
                            },
                            quantity: item.quantity,
                            productType: item.productType
                        });
                    } else {
                        // Product might be deleted. Keep item info or mark as unavailable?
                        // For Admin, it's useful to see "Unknown Item" or just skip.
                        // Let's keep ID for reference.
                        populatedItems.push({
                            _id: item._id,
                            product: { name: 'Unknown/Deleted Product', _id: item.product },
                            quantity: item.quantity,
                            productType: item.productType
                        });
                    }
                } catch (err) {
                    console.error(`Error populating cart item ${item.product}:`, err);
                }
            }

            // Return cart object with populated items
            return {
                _id: cart._id,
                user: cart.user,
                items: populatedItems,
                updatedAt: cart.updatedAt,
                createdAt: cart.createdAt
            };
        }));

        res.json(populatedCarts);
    } catch (err) {
        console.error("GetAllCarts Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
