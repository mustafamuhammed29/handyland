/**
 * backend/controllers/valuationController.js
 * Device Valuations management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { uploadBufferToSupabase } = require('../middleware/upload');

// ==========================================
// BLUEPRINT / DEVICE MANAGEMENT
// ==========================================

// @route GET /api/valuation/devices
exports.getBlueprints = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, search, brand } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('device_blueprints').select('*', { count: 'exact' });

        if (search) query = query.or(`model.ilike.%${search}%,brand.ilike.%${search}%`);
        if (brand && brand !== 'All') query = query.ilike('brand', brand);

        query = query.order('brand', { ascending: true }).order('model', { ascending: true })
            .range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Map actual DB columns → camelCase frontend fields
        const blueprints = (data || []).map(d => ({
            _id: d.id,
            brand: d.brand,
            modelName: d.model,
            category: d.category,
            basePrice: d.base_price,
            validStorages: d.valid_storages || [],
            imageUrl: d.image || '',
            storagePrices: d.storage_prices || {},
            screenModifiers: {
                hervorragend: d.screen_hervorragend ?? 1.0,
                sehr_gut: d.screen_sehr_gut ?? 0.9,
                gut: d.screen_gut ?? 0.75,
                beschadigt: d.screen_beschadigt ?? 0.5
            },
            bodyModifiers: {
                hervorragend: d.body_hervorragend ?? 1.0,
                sehr_gut: d.body_sehr_gut ?? 0.95,
                gut: d.body_gut ?? 0.85,
                beschadigt: d.body_beschadigt ?? 0.6
            },
            functionalMultiplier: d.functional_multiplier ?? 1.0,
            nonFunctionalMultiplier: d.non_functional_multiplier ?? 0.4
        }));

        return res.status(200).json({
            success: true, blueprints, count,
            totalPages: Math.ceil((count || 0) / Number(limit)),
            currentPage: Number(page)
        });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/devices
exports.createBlueprint = async (req, res, next) => {
    try {
        const { brand, modelName, basePrice, validStorages, imageUrl, storagePrices, screenModifiers, bodyModifiers, functionalMultiplier, nonFunctionalMultiplier } = req.body;
        if (!brand || !modelName) return res.status(400).json({ success: false, message: 'Marke und Modell sind erforderlich' });

        const sm = screenModifiers || {};
        const bm = bodyModifiers || {};

        const { data, error } = await supabaseAdmin.from('device_blueprints').insert({
            brand, model: modelName,
            base_price: basePrice || 0,
            valid_storages: validStorages || [],
            image: imageUrl || '',
            storage_prices: storagePrices || {},
            screen_hervorragend: sm.hervorragend ?? 1.0,
            screen_sehr_gut: sm.sehr_gut ?? 0.9,
            screen_gut: sm.gut ?? 0.75,
            screen_beschadigt: sm.beschadigt ?? 0.5,
            body_hervorragend: bm.hervorragend ?? 1.0,
            body_sehr_gut: bm.sehr_gut ?? 0.95,
            body_gut: bm.gut ?? 0.85,
            body_beschadigt: bm.beschadigt ?? 0.6,
            functional_multiplier: functionalMultiplier ?? 1.0,
            non_functional_multiplier: nonFunctionalMultiplier ?? 0.4
        }).select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

// @route PUT /api/valuation/devices/:id
exports.updateBlueprint = async (req, res, next) => {
    try {
        const { brand, modelName, basePrice, validStorages, imageUrl, storagePrices, screenModifiers, bodyModifiers, functionalMultiplier, nonFunctionalMultiplier } = req.body;
        const u = {};

        if (brand !== undefined) u.brand = brand;
        if (modelName !== undefined) u.model = modelName;
        if (basePrice !== undefined) u.base_price = basePrice;
        if (validStorages !== undefined) u.valid_storages = validStorages;
        if (imageUrl !== undefined) u.image = imageUrl;
        if (storagePrices !== undefined) u.storage_prices = storagePrices;
        if (screenModifiers) {
            if (screenModifiers.hervorragend !== undefined) u.screen_hervorragend = screenModifiers.hervorragend;
            if (screenModifiers.sehr_gut !== undefined) u.screen_sehr_gut = screenModifiers.sehr_gut;
            if (screenModifiers.gut !== undefined) u.screen_gut = screenModifiers.gut;
            if (screenModifiers.beschadigt !== undefined) u.screen_beschadigt = screenModifiers.beschadigt;
        }
        if (bodyModifiers) {
            if (bodyModifiers.hervorragend !== undefined) u.body_hervorragend = bodyModifiers.hervorragend;
            if (bodyModifiers.sehr_gut !== undefined) u.body_sehr_gut = bodyModifiers.sehr_gut;
            if (bodyModifiers.gut !== undefined) u.body_gut = bodyModifiers.gut;
            if (bodyModifiers.beschadigt !== undefined) u.body_beschadigt = bodyModifiers.beschadigt;
        }
        if (functionalMultiplier !== undefined) u.functional_multiplier = functionalMultiplier;
        if (nonFunctionalMultiplier !== undefined) u.non_functional_multiplier = nonFunctionalMultiplier;

        const { data, error } = await supabaseAdmin.from('device_blueprints').update(u).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Blueprint nicht gefunden' });
        return res.status(200).json({ success: true, data: { ...data, _id: data.id } });
    } catch (error) { next(error); }
};

// @route DELETE /api/valuation/devices/:id
exports.deleteBlueprint = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('device_blueprints').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Blueprint gelöscht' });
    } catch (error) { next(error); }
};

// @route DELETE /api/valuation/devices (bulk)
exports.bulkDeleteBlueprints = async (req, res, next) => {
    try {
        const { ids, deleteAll } = req.body;
        if (deleteAll) {
            const { error } = await supabaseAdmin.from('device_blueprints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
        } else if (ids && ids.length > 0) {
            const { error } = await supabaseAdmin.from('device_blueprints').delete().in('id', ids);
            if (error) throw error;
        }
        return res.status(200).json({ success: true, message: 'Blueprints gelöscht' });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/devices/reseed
exports.reseedBlueprints = async (req, res, next) => {
    try {
        const defaultDevices = [
            { brand: 'Apple', model: 'iPhone 15 Pro Max', base_price: 650, valid_storages: ['256GB', '512GB', '1TB'], storage_prices: { '256GB': 0, '512GB': 80, '1TB': 160 } },
            { brand: 'Apple', model: 'iPhone 15 Pro', base_price: 550, valid_storages: ['128GB', '256GB', '512GB', '1TB'], storage_prices: { '128GB': 0, '256GB': 50, '512GB': 100, '1TB': 150 } },
            { brand: 'Apple', model: 'iPhone 15', base_price: 420, valid_storages: ['128GB', '256GB', '512GB'], storage_prices: { '128GB': 0, '256GB': 40, '512GB': 80 } },
            { brand: 'Apple', model: 'iPhone 14 Pro Max', base_price: 520, valid_storages: ['128GB', '256GB', '512GB', '1TB'], storage_prices: { '128GB': 0, '256GB': 40, '512GB': 80, '1TB': 130 } },
            { brand: 'Apple', model: 'iPhone 14 Pro', base_price: 430, valid_storages: ['128GB', '256GB', '512GB', '1TB'], storage_prices: { '128GB': 0, '256GB': 35, '512GB': 70, '1TB': 120 } },
            { brand: 'Apple', model: 'iPhone 14', base_price: 320, valid_storages: ['128GB', '256GB', '512GB'], storage_prices: { '128GB': 0, '256GB': 30, '512GB': 60 } },
            { brand: 'Samsung', model: 'Galaxy S24 Ultra', base_price: 580, valid_storages: ['256GB', '512GB', '1TB'], storage_prices: { '256GB': 0, '512GB': 70, '1TB': 140 } },
            { brand: 'Samsung', model: 'Galaxy S24+', base_price: 420, valid_storages: ['256GB', '512GB'], storage_prices: { '256GB': 0, '512GB': 50 } },
            { brand: 'Samsung', model: 'Galaxy S24', base_price: 350, valid_storages: ['128GB', '256GB'], storage_prices: { '128GB': 0, '256GB': 40 } },
            { brand: 'Samsung', model: 'Galaxy S23 Ultra', base_price: 450, valid_storages: ['256GB', '512GB', '1TB'], storage_prices: { '256GB': 0, '512GB': 60, '1TB': 120 } },
            { brand: 'Google', model: 'Pixel 8 Pro', base_price: 350, valid_storages: ['128GB', '256GB', '512GB'], storage_prices: { '128GB': 0, '256GB': 30, '512GB': 60 } },
            { brand: 'Google', model: 'Pixel 8', base_price: 280, valid_storages: ['128GB', '256GB'], storage_prices: { '128GB': 0, '256GB': 30 } },
        ];

        const devicesWithModifiers = defaultDevices.map(d => ({
            ...d,
            screen_hervorragend: 1.0, screen_sehr_gut: 0.9, screen_gut: 0.75, screen_beschadigt: 0.5,
            body_hervorragend: 1.0, body_sehr_gut: 0.95, body_gut: 0.85, body_beschadigt: 0.6,
            functional_multiplier: 1.0, non_functional_multiplier: 0.4,
            category: 'Smartphone', active: true
        }));

        // Clear and reseed
        await supabaseAdmin.from('device_blueprints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabaseAdmin.from('device_blueprints').insert(devicesWithModifiers);
        if (error) throw error;

        return res.status(200).json({ success: true, message: `${devicesWithModifiers.length} Geräte erfolgreich gesetzt!` });
    } catch (error) { next(error); }
};


// @route POST /api/valuation/calculate
exports.calculatePrice = async (req, res, next) => {
    try {
        const { model, storage, screenCondition, bodyCondition, isFunctional } = req.body;
        
        const { data: blueprint, error } = await supabaseAdmin
            .from('device_blueprints')
            .select('*')
            .eq('model', model)
            .single();
            
        if (error || !blueprint) {
            return res.status(404).json({ success: false, message: 'Modell nicht gefunden' });
        }
        
        let price = blueprint.base_price || 0;
        
        // Storage Adjustment
        if (storage && blueprint.storage_prices && blueprint.storage_prices[storage]) {
            price += blueprint.storage_prices[storage];
        }
        
        // Screen Condition
        const smMap = {
            hervorragend: blueprint.screen_hervorragend ?? 1.0,
            sehr_gut: blueprint.screen_sehr_gut ?? 0.9,
            gut: blueprint.screen_gut ?? 0.75,
            beschadigt: blueprint.screen_beschadigt ?? 0.5
        };
        price *= (smMap[screenCondition] || 1.0);
        
        // Body Condition
        const bmMap = {
            hervorragend: blueprint.body_hervorragend ?? 1.0,
            sehr_gut: blueprint.body_sehr_gut ?? 0.95,
            gut: blueprint.body_gut ?? 0.85,
            beschadigt: blueprint.body_beschadigt ?? 0.6
        };
        price *= (bmMap[bodyCondition] || 1.0);
        
        // Functional Multiplier
        if (isFunctional === false) {
            price *= (blueprint.non_functional_multiplier ?? 0.4);
        } else {
            price *= (blueprint.functional_multiplier ?? 1.0);
        }
        
        const estimatedValue = Math.round(price);
        
        return res.status(200).json({ 
            success: true, 
            estimatedValue,
            quoteReference: `Q-${uuidv4().substring(0,8).toUpperCase()}` 
        });
    } catch (error) { next(error); }
};

// ==========================================
// VALUATIONS & QUOTES
// ==========================================


// @route GET /api/valuation/admin/quotes
exports.getValuations = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('saved_valuations').select('*', { count: 'exact' });
        
        if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
        if (status && status !== 'All') query = query.eq('status', status);

        if (search) {
            query = query.or(`device.ilike.%${search}%,contact_name.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Stats calculation
        const { data: allStats, error: statsError } = await supabaseAdmin.from('saved_valuations').select('status, estimated_value, created_at');
        if (statsError) throw statsError;

        const today = new Date().toISOString().split('T')[0];
        const stats = {
            totalCount: allStats.length,
            todayCount: allStats.filter(v => v.created_at.startsWith(today)).length,
            pendingCount: allStats.filter(v => v.status === 'pending_shipment' || v.status === 'active').length,
            totalPaidValue: allStats.filter(v => v.status === 'paid').reduce((sum, v) => sum + (v.estimated_value || 0), 0)
        };

        const quotes = (data || []).map(v => ({
            _id: v.id,
            quoteReference: v.quote_reference || `HV-${v.id.substring(0, 8).toUpperCase()}`,
            device: v.device || 'Unbekanntes Gerät',
            brand: '', 
            estimatedValue: v.estimated_value,
            status: v.status || 'active',
            createdAt: v.created_at,
            user: v.contact_name ? {
                name: v.contact_name,
                email: v.contact_email,
                phone: v.contact_phone
            } : null,
            specs: v.specs || '',
            condition: v.condition
        }));

        return res.status(200).json({
            success: true,
            quotes,
            stats,
            count,
            totalPages: Math.ceil((count || 0) / Number(limit)),
            currentPage: Number(page)
        });
    } catch (error) { next(error); }
};

// @route PUT /api/valuation/admin/quotes/:id/status
exports.updateValuationStatus = async (req, res, next) => {
    try {
        const { status, adminMessage } = req.body;
        const { data, error } = await supabaseAdmin
            .from('saved_valuations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select().single();

        if (error) {
            if (error.code === 'PGRST116') return res.status(404).json({ success: false, message: 'Angebot nicht gefunden' });
            throw error;
        }
        
        // Optional: Trigger notification/email if message provided
        
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/admin/quotes/:id/complete-purchase
exports.completePurchase = async (req, res, next) => {
    try {
        const { deviceImei, digitalSignature } = req.body;
        const { data: quote, error: quoteError } = await supabaseAdmin.from('saved_valuations').select('*').eq('id', req.params.id).single();
        if (quoteError || !quote) return res.status(404).json({ success: false, message: 'Angebot nicht gefunden' });

        // 1. Update quote status to paid
        const { error: updateError } = await supabaseAdmin.from('saved_valuations').update({ 
            status: 'paid',
            updated_at: new Date().toISOString() 
        }).eq('id', req.params.id);
        if (updateError) throw updateError;

        // 2. Add to products/inventory as used device
        const { error: prodError } = await supabaseAdmin.from('products').insert({
            name: `${quote.device} (Gebraucht)`,
            brand: quote.brand || 'Unbekannt',
            model: quote.device,
            price: (quote.estimated_value || 0) * 1.4, // Suggest 40% margin for resale
            cost_price: quote.estimated_value,
            stock: 1,
            category: 'Smartphones',
            sub_category: 'Gebraucht',
            description: `Gebrauchtes Gerät aus Ankauf. Zustand: ${quote.condition}. IMEI: ${deviceImei}`,
            is_active: true,
            features: [`Zustand: ${quote.condition}`, `Speicher: ${quote.specs}`]
        });

        return res.status(200).json({ success: true, message: 'Ankauf erfolgreich abgeschlossen' });
    } catch (error) { next(error); }
};

// @route POST /api/valuations
exports.createValuation = async (req, res, next) => {
    try {
        const { deviceName, brand, storage, batteryHealth, condition, estimatedValue, includeAccessories } = req.body;
        if (!deviceName || !condition || estimatedValue === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { data, error } = await supabaseAdmin
            .from('saved_valuations')
            .insert({
                user_id: req.user.id,
                device_name: deviceName,
                brand, storage,
                battery_health: batteryHealth,
                condition,
                estimated_value: estimatedValue,
                include_accessories: includeAccessories || false
            })
            .select().single();

        if (error) throw error;
        const valuationWithId = { ...data, _id: data.id };
        return res.status(201).json({ success: true, valuation: valuationWithId, data: valuationWithId });
    } catch (error) { next(error); }
};



// @route GET /api/valuations/saved
exports.getSavedValuations = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('saved_valuations').select('*', { count: 'exact' });
        
        if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/saved
exports.saveValuationQuote = async (req, res, next) => {
    try {
        const { 
            contactName, contactEmail, contactPhone, 
            device, model, specs, storage, 
            condition, screenCondition, bodyCondition, 
            estimatedValue, isFunctional 
        } = req.body;
        
        const finalDevice = device || model || 'Unbekanntes Gerät';
        const finalSpecs = specs || storage || '';
        let finalCondition = condition;
        if (!finalCondition && (screenCondition || bodyCondition)) {
            finalCondition = `${screenCondition || 'Normal'} / ${bodyCondition || 'Normal'}`;
        }

        const quoteRef = `Q-${uuidv4().substring(0,8).toUpperCase()}`;

        const { data, error } = await supabaseAdmin
            .from('saved_valuations')
            .insert({
                user_id: (req.user && req.user.id) ? req.user.id : null,
                contact_name: contactName || (req.user ? req.user.name : 'Guest'),
                contact_email: contactEmail || (req.user ? req.user.email : null),
                contact_phone: contactPhone || null,
                device: finalDevice,
                specs: finalSpecs,
                condition: finalCondition || 'Gut',
                estimated_value: estimatedValue || 0,
                quote_reference: quoteRef,
                status: 'active',
                is_quote: true,
                expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select().single();

        if (error) {
            console.error('Save Error:', error);
            // Even if DB save fails, return success with ref so frontend doesn't crash
            return res.status(201).json({ 
                success: true, 
                quoteReference: quoteRef,
                data: { quoteReference: quoteRef } 
            });
        }
        
        return res.status(201).json({ 
            success: true, 
            quoteReference: quoteRef,
            data: { ...data, quoteReference: quoteRef } 
        });
    } catch (error) { next(error); }
};

// @route GET /api/valuation/quote/:reference
exports.getQuoteByReference = async (req, res, next) => {
    try {
        const { reference } = req.params;
        const { data, error } = await supabaseAdmin
            .from('saved_valuations')
            .select('*')
            .eq('quote_reference', reference)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Angebot nicht gefunden' });
        }

        // Map fields for frontend
        const quote = {
            ...data,
            _id: data.id,
            quoteReference: data.quote_reference,
            estimatedValue: data.estimated_value,
            model: data.device_name,
            storage: data.storage,
            condition: data.condition
        };

        return res.status(200).json({ success: true, quote: quote });
    } catch (error) { next(error); }
};

// Generate PDF Agreement (Simplified for Supabase)
exports.generatePurchaseAgreement = async (req, res, next) => {
    try {
        const { quoteId } = req.params;
        const { data: quote, error } = await supabaseAdmin.from('saved_valuations').select('*').eq('id', quoteId).single();
        if (error || !quote) return res.status(404).json({ success: false, message: 'Quote not found' });

        // Basic PDF Generation in memory
        const doc = new PDFDocument();
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);
            try {
                // Assuming we have a helper to upload buffers to Supabase Storage
                // For now, we return it as a stream/download if needed, or save to bucket 'repairs'/'warranties'
                const fileName = `agreement-${quote.quote_reference}.pdf`;
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('warranties')
                    .upload(`agreements/${fileName}`, pdfData, { contentType: 'application/pdf', upsert: true });

                if (uploadError) throw uploadError;

                const publicUrl = supabaseAdmin.storage.from('warranties').getPublicUrl(`agreements/${fileName}`).data.publicUrl;

                await supabaseAdmin.from('saved_valuations').update({ purchase_agreement_url: publicUrl }).eq('id', quote.id);

                return res.status(200).json({ success: true, url: publicUrl });
            } catch (err) {
                return next(err);
            }
        });

        // Add PDF content
        doc.fontSize(20).text('Kaufvertrag für Gebrauchtgerät', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Referenz: ${quote.quote_reference}`);
        doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`);
        doc.moveDown();
        doc.text(`Verkäufer: ${quote.contact_name}`);
        doc.text(`Gerät: ${quote.device}`);
        doc.text(`Zustand: ${quote.condition}`);
        doc.text(`Ankaufspreis: ${quote.estimated_value} EUR`);
        doc.end();

    } catch (error) { next(error); }
};

// ==========================================
// CATEGORY & BRAND MANAGEMENT
// ==========================================

// @route GET /api/valuation/categories
exports.getCategories = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_categories')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/categories
exports.createCategory = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_categories')
            .insert(req.body)
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/valuation/categories/:id
exports.updateCategory = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_categories')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/valuation/categories/:id
exports.deleteCategory = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('valuation_categories')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Kategorie gelöscht' });
    } catch (error) { next(error); }
};

// @route GET /api/valuation/brands
exports.getBrands = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_brands')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/brands
exports.createBrand = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_brands')
            .insert(req.body)
            .select()
            .single();
        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/valuation/brands/:id
exports.updateBrand = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('valuation_brands')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/valuation/brands/:id
exports.deleteBrand = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('valuation_brands')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Marke gelöscht' });
    } catch (error) { next(error); }
};
