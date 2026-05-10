/**
 * backend/controllers/priceResearchController.js
 * Admin endpoints for eBay price research using Supabase
 */
'use strict';

const { fetchEbayPrices, researchDevicePrices, fetchEbayDeepSpecs } = require('../services/ebayPriceService');
const { supabaseAdmin } = require('../config/supabase');

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
    return entry.data;
}
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

exports.researchSingle = async (req, res) => {
    try {
        const { model, storage } = req.query;
        if (!model) return res.status(400).json({ success: false, message: 'model query param required' });

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            return res.status(503).json({ success: false, message: 'eBay API not configured' });
        }

        const cacheKey = `${model}::${storage || ''}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json({ success: true, cached: true, data: cached });

        const data = await fetchEbayPrices(model, storage, appId);
        setCache(cacheKey, data);
        res.json({ success: true, cached: false, data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.researchEbaySpecs = async (req, res) => {
    try {
        const { model } = req.query;
        if (!model) return res.status(400).json({ success: false, message: 'model query param required' });

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            return res.status(503).json({ success: false, message: 'eBay API not configured' });
        }

        const data = await fetchEbayDeepSpecs(model, appId);
        res.json(data);
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.researchDevice = async (req, res) => {
    try {
        const { data: blueprint, error } = await supabaseAdmin.from('device_blueprints').select('*').eq('id', req.params.blueprintId).single();
        if (error || !blueprint) return res.status(404).json({ success: false, message: 'Blueprint not found' });

        const appId = process.env.EBAY_APP_ID;
        if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
            return res.status(503).json({ success: false, message: 'eBay API not configured' });
        }

        const storages = blueprint.valid_storages || ['128GB'];
        const data = await researchDevicePrices(blueprint.model, storages, appId);

        res.json({ success: true, data, blueprint: { id: blueprint.id, model: blueprint.model } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.applyPrice = async (req, res) => {
    try {
        const { newBasePrice, storagePrices, marketAvg, ebaySource } = req.body;
        const { data: blueprint, error: findError } = await supabaseAdmin.from('device_blueprints').select('*').eq('id', req.params.blueprintId).single();
        if (findError || !blueprint) return res.status(404).json({ success: false, message: 'Blueprint not found' });

        const oldPrice = blueprint.base_price;
        const updateData = {};
        if (newBasePrice) updateData.base_price = Number(newBasePrice);
        if (storagePrices) updateData.storage_prices = storagePrices;

        updateData.price_research_last_updated = new Date().toISOString();
        updateData.price_research_source = ebaySource || 'eBay.de Completed Listings';
        updateData.price_research_market_avg = marketAvg || null;
        updateData.price_research_previous_base = oldPrice;

        const { error: updateError } = await supabaseAdmin.from('device_blueprints').update(updateData).eq('id', blueprint.id);
        if (updateError) throw updateError;

        res.json({
            success: true,
            message: `Price updated: ${oldPrice}€ → ${newBasePrice}€`,
            blueprint: { id: blueprint.id, model: blueprint.model, oldPrice, newPrice: newBasePrice }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getResearchStatus = async (req, res) => {
    try {
        const { data: blueprints, error } = await supabaseAdmin.from('device_blueprints')
            .select('id, brand, model, base_price, valid_storages, price_research_last_updated, price_research_market_avg, price_research_previous_base')
            .order('brand', { ascending: true })
            .order('model', { ascending: true });

        if (error) throw error;

        const withStatus = blueprints.map(bp => ({
            id: bp.id,
            brand: bp.brand,
            model: bp.model,
            basePrice: bp.base_price,
            validStorages: bp.valid_storages,
            lastResearched: bp.price_research_last_updated || null,
            marketAvg: bp.price_research_market_avg || null,
            previousPrice: bp.price_research_previous_base || null,
            needsUpdate: !bp.price_research_last_updated ||
                (Date.now() - new Date(bp.price_research_last_updated).getTime()) > 30 * 24 * 60 * 60 * 1000
        }));

        const stats = {
            total: withStatus.length,
            researched: withStatus.filter(b => b.lastResearched).length,
            needsUpdate: withStatus.filter(b => b.needsUpdate).length,
        };

        res.json({ success: true, blueprints: withStatus, stats });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
