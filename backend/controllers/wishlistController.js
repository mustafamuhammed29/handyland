const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            return res.status(200).json({ success: true, products: [] });
        }
        res.status(200).json({ success: true, products: wishlist.products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching wishlist', error: error.message });
    }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res) => {
    try {
        const { productId, productType = 'Product' } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Look up product to get snapshot data
        let productDoc;
        if (productType === 'Accessory') {
            productDoc = await Accessory.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(productId) ? productId : undefined }, { id: productId }] });
        } else {
            productDoc = await Product.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(productId) ? productId : undefined }, { id: productId }] });
        }

        if (!productDoc) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user.id,
                products: [{
                    product: productDoc._id,
                    productType,
                    customId: productDoc.id, // Save actual UI string "id"
                    name: productDoc.name,
                    price: productDoc.price,
                    image: productDoc.image || (productDoc.images && productDoc.images[0])
                }]
            });
        } else {
            // Check if already in wishlist by either native or custom ID
            const exists = wishlist.products.some(p =>
                p.product.toString() === productDoc._id.toString() || p.customId === productDoc.id
            );
            if (exists) {
                return res.status(400).json({ success: false, message: 'Already in wishlist' });
            }

            wishlist.products.push({
                product: productDoc._id,
                productType,
                customId: productDoc.id, // Save actual UI string "id"
                name: productDoc.name,
                price: productDoc.price,
                image: productDoc.image || (productDoc.images && productDoc.images[0])
            });
            await wishlist.save();
        }

        res.status(200).json({ success: true, message: 'Added to wishlist', products: wishlist.products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding to wishlist', error: error.message });
    }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:itemId
// @access  Private
exports.removeFromWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        wishlist.products = wishlist.products.filter(
            p =>
                p._id.toString() !== req.params.itemId &&
                p.product?.toString() !== req.params.itemId &&
                p.customId !== req.params.itemId
        );
        await wishlist.save();

        res.status(200).json({ success: true, message: 'Removed from wishlist', products: wishlist.products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing from wishlist', error: error.message });
    }
};

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
exports.clearWishlist = async (req, res) => {
    try {
        await Wishlist.findOneAndUpdate({ user: req.user.id }, { products: [] });
        res.status(200).json({ success: true, message: 'Wishlist cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error clearing wishlist', error: error.message });
    }
};
