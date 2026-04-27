const productService = require('../services/productService');
const Question = require('../models/Question'); // Still needed for Question queries in controller for now
const Review = require('../models/Review'); // Still needed for Review queries in controller for now

/**
 * Controller for handling product-related API requests.
 * Delegates business logic to ProductService.
 */

exports.getAllProducts = async (req, res) => {
    try {
        const result = await productService.getProducts({
            page: parseInt(req.query.page),
            limit: parseInt(req.query.limit),
            search: req.query.search,
            brand: req.query.brand,
            condition: req.query.condition,
            storage: req.query.storage,
            ram: req.query.ram,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            sort: req.query.sort,
            includeOutOfStock: req.query.includeOutOfStock === 'true'
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
    }
};

exports.getProductStats = async (req, res) => {
    try {
        const stats = await productService.getProductStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, price, category } = req.body;
        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required" });
        }
        const newProduct = await productService.createProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error creating product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);
        if (result) {
            res.json({ message: "Product deleted" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getRelatedProducts = async (req, res) => {
    try {
        const related = await productService.getRelatedProducts(req.params.id);
        res.json(related);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.createProductReview = async (req, res) => {
    try {
        const review = await productService.addReview(req.params.id, req.user.id, req.body);
        res.status(201).json({ message: 'Review added', review });
    } catch (error) {
        const status = error.message === 'Product not found' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {return res.status(404).json({ message: 'Product not found' });}
        const reviews = await Review.find({ product: product._id }).populate('user', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getProductQuestions = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {return res.status(404).json({ message: 'Product not found' });}
        const questions = await Question.find({ product: product._id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        const product = await productService.getProductById(req.params.id);
        if (!product) {return res.status(404).json({ message: 'Product not found' });}
        const newQuestion = await Question.create({
            user: req.user._id,
            product: product._id,
            question
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.answerQuestion = async (req, res) => {
    try {
        const { answer } = req.body;
        const question = await Question.findById(req.params.id);
        if (!question) {return res.status(404).json({ message: 'Question not found' });}
        question.answer = answer;
        question.isAnswered = true;
        question.answeredBy = req.user._id;
        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.validateStock = async (req, res) => {
    try {
        const { items } = req.body;
        const validation = await productService.validateStock(items);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors,
                message: validation.errors.map(e => e.message).join(', ')
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
