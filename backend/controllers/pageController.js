const Page = require('../models/Page');

// @desc    Get page by slug
// @route   GET /api/pages/:slug
// @access  Public
exports.getPageBySlug = async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug });
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pages (Admin)
// @route   GET /api/pages
// @access  Private/Admin
exports.getAllPages = async (req, res) => {
    try {
        const pages = await Page.find({});
        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create/Update page
// @route   POST /api/pages
// @access  Private/Admin
exports.createOrUpdatePage = async (req, res) => {
    try {
        const { slug, title, content } = req.body;

        let page = await Page.findOne({ slug });

        if (page) {
            page.title = title || page.title;
            page.content = content || page.content;
            page.lastUpdated = Date.now();
            await page.save();
        } else {
            page = await Page.create({ slug, title, content });
        }

        res.json(page);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private/Admin
exports.deletePage = async (req, res) => {
    try {
        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
