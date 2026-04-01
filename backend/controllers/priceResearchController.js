/**
 * priceResearchController.js
 *
 * Admin endpoints for eBay price research on used devices.
 * Allows admin to research current German used market prices and
 * apply suggested buyback prices directly to DeviceBlueprints.
 */

const { fetchEbayPrices, researchDevicePrices } = require('../services/ebayPriceService');
const DeviceBlueprint = require('../models/DeviceBlueprint');

// Simple in-memory cache (15 min per device) to avoid hammering eBay API
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) {return null;}
    if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
    return entry.data;
}
function setCache(key, data) {
    cache.set(key, { data, ts: Date.now() });
}

/**
 * @desc    Research eBay.de used market price for a single device/storage combo
 * @route   GET /api/price-research/ebay?model=iPhone 15 Pro&storage=128GB
 * @access  Admin
 */
exports.researchSingle = async (req, res) => {
    try {
        const { model, storage } = req.query;
        if (!model) {
            return res.status(400).json({ success: false, message: 'model query param required' });
        }

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            return res.status(503).json({
                success: false,
                message: 'eBay API not configured. Add EBAY_APP_ID to .env',
                howTo: 'Register free at https://developer.ebay.com → My Keys → App ID (Production)'
            });
        }

        const cacheKey = `${model}::${storage || ''}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json({ success: true, cached: true, data: cached });
        }

        const data = await fetchEbayPrices(model, storage, appId);
        setCache(cacheKey, data);

        res.json({ success: true, cached: false, data });
    } catch (err) {
        console.error('[PriceResearch] Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Research eBay prices for ALL storage variants of a DeviceBlueprint
 * @route   POST /api/price-research/ebay/device/:blueprintId
 * @access  Admin
 */
exports.researchDevice = async (req, res) => {
    try {
        const blueprint = await DeviceBlueprint.findById(req.params.blueprintId);
        if (!blueprint) {
            return res.status(404).json({ success: false, message: 'Blueprint not found' });
        }

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            return res.status(503).json({
                success: false,
                message: 'eBay API not configured. Add EBAY_APP_ID to .env',
                howTo: 'Register free at https://developer.ebay.com → My Keys → App ID (Production)'
            });
        }

        const storages = blueprint.validStorages || ['128GB'];
        const data = await researchDevicePrices(blueprint.model, storages, appId);

        res.json({ success: true, data, blueprint: { id: blueprint._id, model: blueprint.model } });
    } catch (err) {
        console.error('[PriceResearch] Device research error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Apply a suggested price to a DeviceBlueprint (one-click update)
 * @route   POST /api/price-research/apply/:blueprintId
 * @body    { storage: '128GB', newBasePrice: 420, storagePrices: { '256GB': 40 } }
 * @access  Admin
 */
exports.applyPrice = async (req, res) => {
    try {
        const { newBasePrice, storagePrices, marketAvg, ebaySource } = req.body;
        const blueprint = await DeviceBlueprint.findById(req.params.blueprintId);

        if (!blueprint) {
            return res.status(404).json({ success: false, message: 'Blueprint not found' });
        }

        const oldPrice = blueprint.basePrice;

        if (newBasePrice) {blueprint.basePrice = Number(newBasePrice);}
        if (storagePrices) {blueprint.storagePrices = storagePrices;}

        // Store research metadata for audit trail
        blueprint.priceResearch = {
            lastUpdated: new Date(),
            source: ebaySource || 'eBay.de Completed Listings',
            marketAvg: marketAvg || null,
            previousBasePrice: oldPrice,
        };

        await blueprint.save();

        res.json({
            success: true,
            message: `Price updated: ${oldPrice}€ → ${newBasePrice}€`,
            blueprint: {
                id: blueprint._id,
                model: blueprint.model,
                oldPrice,
                newPrice: blueprint.basePrice,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Get all blueprints with their last price research data
 * @route   GET /api/price-research/status
 * @access  Admin
 */
exports.getResearchStatus = async (req, res) => {
    try {
        const blueprints = await DeviceBlueprint.find({}, 'brand model basePrice priceResearch validStorages').sort({ brand: 1, model: 1 }).lean();

        const withStatus = blueprints.map(bp => ({
            _id: bp._id,
            brand: bp.brand,
            model: bp.model,
            basePrice: bp.basePrice,
            validStorages: bp.validStorages,
            lastResearched: bp.priceResearch?.lastUpdated || null,
            marketAvg: bp.priceResearch?.marketAvg || null,
            previousPrice: bp.priceResearch?.previousBasePrice || null,
            needsUpdate: !bp.priceResearch?.lastUpdated ||
                (Date.now() - new Date(bp.priceResearch.lastUpdated).getTime()) > 30 * 24 * 60 * 60 * 1000 // 30 days
        }));

        const stats = {
            total: withStatus.length,
            researched: withStatus.filter(b => b.lastResearched).length,
            needsUpdate: withStatus.filter(b => b.needsUpdate).length,
        };

        res.json({ success: true, blueprints: withStatus, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
