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

// @route GET /api/valuations
exports.getValuations = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('valuations').select('*, users(name, email)', { count: 'exact' });
        
        if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
        if (status) query = query.eq('status', status);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const valuationsWithId = (data || []).map(v => ({ ...v, _id: v.id }));
        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            valuations: valuationsWithId,
            data: valuationsWithId
        });
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
