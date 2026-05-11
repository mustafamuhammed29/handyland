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


// ==========================================
// VALUATIONS & QUOTES
// ==========================================


// @route GET /api/valuation/admin/quotes
exports.getValuations = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('valuations').select('*, users(name, email, phone)', { count: 'exact' });
        
        if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
        if (status && status !== 'All') query = query.eq('status', status);

        if (search) {
            query = query.or(`device_name.ilike.%${search}%,brand.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Stats calculation
        const { data: allStats, error: statsError } = await supabaseAdmin.from('valuations').select('status, estimated_value, created_at');
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
            quoteReference: `HV-${v.id.substring(0, 8).toUpperCase()}`,
            device: v.device_name || 'Unbekanntes Gerät',
            brand: v.brand,
            estimatedValue: v.estimated_value,
            status: v.status || 'active',
            createdAt: v.created_at,
            user: v.users ? {
                name: v.users.name,
                email: v.users.email,
                phone: v.users.phone
            } : null,
            specs: `${v.storage || ''} ${v.battery_health ? `(${v.battery_health}%)` : ''}`.trim(),
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
            .from('valuations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select().single();

        if (error) throw error;
        
        // Optional: Trigger notification/email if message provided
        
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/valuation/admin/quotes/:id/complete-purchase
exports.completePurchase = async (req, res, next) => {
    try {
        const { deviceImei, digitalSignature } = req.body;
        const { data: quote, error: quoteError } = await supabaseAdmin.from('valuations').select('*').eq('id', req.params.id).single();
        if (quoteError || !quote) return res.status(404).json({ success: false, message: 'Angebot nicht gefunden' });

        // 1. Update quote status to paid
        const { error: updateError } = await supabaseAdmin.from('valuations').update({ 
            status: 'paid',
            updated_at: new Date().toISOString() 
        }).eq('id', req.params.id);
        if (updateError) throw updateError;

        // 2. Add to products/inventory as used device
        const { error: prodError } = await supabaseAdmin.from('products').insert({
            name: `${quote.device_name} (Gebraucht)`,
            brand: quote.brand,
            model: quote.device_name,
            price: (quote.estimated_value || 0) * 1.4, // Suggest 40% margin for resale
            cost_price: quote.estimated_value,
            stock: 1,
            category: 'Smartphones',
            sub_category: 'Gebraucht',
            description: `Gebrauchtes Gerät aus Ankauf. Zustand: ${quote.condition}. IMEI: ${deviceImei}`,
            is_active: true,
            features: [`Zustand: ${quote.condition}`, `Speicher: ${quote.storage}`]
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
            .from('valuations')
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

// @route PUT /api/valuations/:id/status (Admin)
exports.updateValuationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabaseAdmin.from('valuations').update({ status }).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Valuation not found' });
        return res.status(200).json({ success: true, data });
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

// @route POST /api/valuations/saved
exports.saveValuationQuote = async (req, res, next) => {
    try {
        const { contactName, contactEmail, contactPhone, device, specs, condition, estimatedValue } = req.body;
        
        const { data, error } = await supabaseAdmin
            .from('saved_valuations')
            .insert({
                user_id: req.user ? req.user.id : null,
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                device, specs, condition,
                estimated_value: estimatedValue,
                quote_reference: `Q-${uuidv4().substring(0,8).toUpperCase()}`,
                is_quote: true
            })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
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
