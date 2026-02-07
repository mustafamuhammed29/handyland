const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

// Get all pages (lightweight list)
router.get('/', async (req, res) => {
    try {
        const pages = await Page.find().select('slug title lastUpdated');
        res.json(pages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single page by slug
router.get('/:slug', async (req, res) => {
    try {
        let page = await Page.findOne({ slug: req.params.slug });
        if (!page) {
            // Auto-create if not exists (lazy init)
            const titles = {
                'agb': 'Allgemeine Geschäftsbedingungen',
                'datenschutz': 'Datenschutzerklärung',
                'impressum': 'Impressum',
                'kundenservice': 'Kundenservice',
                'ueber-uns': 'Über Uns'
            };

            if (titles[req.params.slug]) {
                page = new Page({
                    slug: req.params.slug,
                    title: titles[req.params.slug],
                    content: ''
                });
                await page.save();
            } else {
                return res.status(404).json({ message: 'Page not found' });
            }
        }
        res.json(page);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update page content
router.put('/:slug', async (req, res) => {
    try {
        const { content } = req.body;
        const page = await Page.findOneAndUpdate(
            { slug: req.params.slug },
            { content, lastUpdated: Date.now() },
            { new: true, upsert: true } // Upsert ensures existence
        );
        res.json(page);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
