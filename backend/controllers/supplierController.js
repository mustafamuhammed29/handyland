/**
 * backend/controllers/supplierController.js
 * Suppliers management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search, isActive } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('suppliers').select('*', { count: 'exact' });

        if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
        if (search) query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);

        query = query.order('name', { ascending: true }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true, count,
            pagination: { page: Number(page), limit: Number(limit), total: count, pages: Math.ceil(count / Number(limit)) },
            data
        });
    } catch (error) { next(error); }
};

// @route GET /api/suppliers/:id
exports.getSupplier = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('suppliers').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Supplier not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
    try {
        const { name, contactPerson, email, phone, street, city, state, zipCode, country, rating, notes, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required' });

        const { data, error } = await supabaseAdmin
            .from('suppliers')
            .insert({
                name, contact_person: contactPerson, email, phone, street, city, state, zip_code: zipCode, country,
                rating: rating || 5, notes, is_active: isActive !== false
            })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
    try {
        const { name, contactPerson, email, phone, street, city, state, zipCode, country, rating, reliabilityScore, notes, isActive } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (contactPerson !== undefined) updateData.contact_person = contactPerson;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (street !== undefined) updateData.street = street;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (zipCode !== undefined) updateData.zip_code = zipCode;
        if (country !== undefined) updateData.country = country;
        if (rating !== undefined) updateData.rating = rating;
        if (reliabilityScore !== undefined) updateData.reliability_score = reliabilityScore;
        if (notes !== undefined) updateData.notes = notes;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabaseAdmin.from('suppliers').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Supplier not found' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('suppliers').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Supplier deleted' });
    } catch (error) { next(error); }
};
