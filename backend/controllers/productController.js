const Product = require('../models/Product');
const Review = require('../models/Review');
const Question = require('../models/Question'); // Added
const { v4: uuidv4 } = require('uuid');

exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Build Filter Query
        const query = {};

        // Search
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { model: { $regex: req.query.search, $options: 'i' } },
                { brand: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filters
        if (req.query.brand && req.query.brand !== 'All') {
            query.brand = { $regex: req.query.brand, $options: 'i' };
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.storage) {
            query.storage = req.query.storage;
        }
        if (req.query.ram) {
            query['specs.ram'] = req.query.ram;
        }

        // Price Range
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        // Build Sort Options
        let sort = {};
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price_asc': sort = { price: 1 }; break;
                case 'price_desc': sort = { price: -1 }; break;
                case 'newest': sort = { createdAt: -1 }; break;
                case 'oldest': sort = { createdAt: 1 }; break;
                case 'name_asc': sort = { name: 1 }; break;
                default: sort = { createdAt: -1 };
            }
        } else {
            sort = { createdAt: -1 };
        }

        const products = await Product.find(query).sort(sort).skip(skip).limit(limit);
        const total = await Product.countDocuments(query);

        res.json({
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, price, category } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required" });
        }

        const newProduct = new Product({
            ...req.body,
            id: uuidv4()
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const result = await Product.findOneAndDelete({ id: req.params.id });
        if (result) {
            res.json({ message: "Product deleted" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};





// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const related = await Product.find({
            $or: [
                { category: product.category },
                { brand: product.brand }
            ],
            id: { $ne: product.id }
        }).limit(4);

        res.json(related);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findOne({ id: req.params.id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const alreadyReviewed = await Review.findOne({
            user: req.user.id,
            product: product._id
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Product already reviewed' });
        }

        const review = await Review.create({
            user: req.user.id,
            product: product._id,
            rating: Number(rating),
            comment
        });

        // Update Product stats
        const reviews = await Review.find({ product: product._id });
        product.numReviews = reviews.length;
        product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await product.save(); // Note: Product schema doesn't have rating/numReviews yet, might need update

        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const reviews = await Review.find({ product: product._id }).populate('user', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product questions
// @route   GET /api/products/:id/questions
// @access  Public
exports.getProductQuestions = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const questions = await Question.find({ product: product._id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ask a question
// @route   POST /api/products/:id/questions
// @access  Private
exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        const product = await Product.findOne({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const newQuestion = await Question.create({
            user: req.user._id,
            product: product._id,
            question
        });

        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Answer a question (Admin)
// @route   PUT /api/products/questions/:id/answer
// @access  Private/Admin
exports.answerQuestion = async (req, res) => {
    try {
        const { answer } = req.body;
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        question.answer = answer;
        question.isAnswered = true;
        question.answeredBy = req.user._id;
        await question.save();

        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
