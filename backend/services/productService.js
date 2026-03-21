const Product = require('../models/Product');
const Review = require('../models/Review');
const Question = require('../models/Question');
const Accessory = require('../models/Accessory');
const { v4: uuidv4 } = require('uuid');

/**
 * Service for handling complex product business logic and database queries.
 * Decoupled from the Express request/response cycle.
 */
class ProductService {
    /**
     * Get paginated and filtered products
     */
    async getProducts(options = {}) {
        const {
            page = 1,
            limit = 12,
            search,
            brand,
            condition,
            storage,
            ram,
            minPrice,
            maxPrice,
            sort: sortType = 'newest',
            includeOutOfStock = false
        } = options;

        const skip = (page - 1) * limit;
        const query = {};

        if (!includeOutOfStock) {
            query.stock = { $gt: 0 };
        }

        // Escape regex utility
        const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (search) {
            const escapedSearch = escapeRegex(search);
            query.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { model: { $regex: escapedSearch, $options: 'i' } },
                { brand: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        if (brand && brand !== 'All') {
            query.brand = { $regex: new RegExp(`^${escapeRegex(brand)}$`, 'i') };
        }

        if (condition) {
            query.condition = { $regex: new RegExp(`^${escapeRegex(condition)}$`, 'i') };
        }

        if (storage) {
            query.storage = { $regex: new RegExp(escapeRegex(storage), 'i') };
        }

        if (ram) {
            query['specs.ram'] = ram;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) {query.price.$gte = Number(minPrice);}
            if (maxPrice) {query.price.$lte = Number(maxPrice);}
        }

        // Sort Options
        let sort = { createdAt: -1 };
        switch (sortType) {
            case 'price_asc': sort = { price: 1 }; break;
            case 'price_desc': sort = { price: -1 }; break;
            case 'newest': sort = { createdAt: -1 }; break;
            case 'oldest': sort = { createdAt: 1 }; break;
            case 'name_asc': sort = { name: 1 }; break;
        }

        const [products, total] = await Promise.all([
            Product.find(query).sort(sort).skip(skip).limit(limit),
            Product.countDocuments(query)
        ]);

        return {
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total
        };
    }

    async getProductById(id) {
        return await Product.findOne({ id });
    }

    async createProduct(productData) {
        const product = new Product({
            ...productData,
            id: uuidv4()
        });
        return await product.save();
    }

    async updateProduct(id, updateData) {
        const allowedFields = ['name', 'price', 'description', 'stock', 'images', 'image', 'brand', 'model', 'category', 'condition', 'storage', 'color', 'specs', 'isActive', 'isFeatured', 'tags'];
        const cleanData = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {cleanData[field] = updateData[field];}
        });

        return await Product.findOneAndUpdate(
            { id },
            cleanData,
            { new: true, runValidators: true }
        );
    }

    async deleteProduct(id) {
        return await Product.findOneAndDelete({ id });
    }

    async getRelatedProducts(productId) {
        const product = await Product.findOne({ id: productId });
        if (!product) {return [];}

        return await Product.find({
            $or: [
                { category: product.category },
                { brand: product.brand }
            ],
            id: { $ne: product.id }
        }).limit(4);
    }

    async validateStock(items) {
        const productIds = items.filter(i => i.category !== 'accessory').map(i => i.id);
        const accessoryIds = items.filter(i => i.category === 'accessory').map(i => i.id);

        const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

        const productQuery = productIds.length > 0 
            ? Product.find({ $or: [{ id: { $in: productIds } }, { _id: { $in: productIds.filter(isValidObjectId) } }] }) 
            : Promise.resolve([]);
            
        const accessoryQuery = accessoryIds.length > 0 
            ? Accessory.find({ $or: [{ id: { $in: accessoryIds } }, { _id: { $in: accessoryIds.filter(isValidObjectId) } }] }) 
            : Promise.resolve([]);

        const [products, accessories] = await Promise.all([productQuery, accessoryQuery]);

        const productMap = {};
        [...products, ...accessories].forEach(p => { 
            if (p.id) productMap[p.id] = p; 
            if (p._id) productMap[p._id.toString()] = p; 
        });

        const errors = [];
        for (const item of items) {
            const productDoc = productMap[item.id] || productMap[item.id?.toString()];
            if (!productDoc) {
                errors.push({ id: item.id, message: `Item not found: ${item.name || item.title || item.id}` });
            } else if (productDoc.stock < (item.quantity || 1)) {
                errors.push({ id: item.id, message: `Insufficient stock for ${productDoc.name || productDoc.title}. Available: ${productDoc.stock}` });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async addReview(productId, userId, reviewData) {
        const product = await Product.findOne({ id: productId });
        if (!product) {throw new Error('Product not found');}

        const alreadyReviewed = await Review.findOne({ user: userId, product: product._id });
        if (alreadyReviewed) {throw new Error('Product already reviewed');}

        const review = await Review.create({
            user: userId,
            product: product._id,
            rating: Number(reviewData.rating),
            comment: reviewData.comment
        });

        const reviews = await Review.find({ product: product._id });
        product.numReviews = reviews.length;
        product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        await product.save();

        return review;
    }
}

module.exports = new ProductService();
