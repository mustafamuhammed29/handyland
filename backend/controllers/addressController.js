/**
 * backend/controllers/addressController.js
 * Address management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/addresses
exports.getAddresses = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('user_id', req.user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route GET /api/addresses/:id
exports.getAddress = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('addresses')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Address not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/addresses
exports.createAddress = async (req, res, next) => {
    try {
        const { name, fullName, email, phone, street, city, state, zipCode, country, isDefault } = req.body;
        const actualFullName = fullName || name;

        if (isDefault) {
            // Remove existing default
            await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
        }

        const { data, error } = await supabaseAdmin
            .from('addresses')
            .insert({
                user_id: req.user.id,
                full_name: actualFullName,
                email, phone, street, city, state, zip_code: zipCode, country: country || 'Germany',
                is_default: isDefault || false
            })
            .select().single();

        if (error) {
            console.error('❌ Supabase Add Address Error:', error.message, error.details);
            throw error;
        }
        return res.status(201).json({ success: true, data });
    } catch (error) { 
        console.error('❌ createAddress catch Error:', error);
        next(error); 
    }
};

// @route PUT /api/addresses/:id
exports.updateAddress = async (req, res, next) => {
    try {
        const { name, fullName, email, phone, street, city, state, zipCode, country, isDefault } = req.body;
        const actualFullName = fullName || name;

        if (isDefault) {
            await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
        }

        const updateData = {};
        if (actualFullName) updateData.full_name = actualFullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (street) updateData.street = street;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (zipCode) updateData.zip_code = zipCode;
        if (country) updateData.country = country;
        if (isDefault !== undefined) updateData.is_default = isDefault;

        const { data, error } = await supabaseAdmin
            .from('addresses')
            .update(updateData)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select().single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Address not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/addresses/:id
exports.deleteAddress = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('addresses').delete().eq('id', req.params.id).eq('user_id', req.user.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (error) { next(error); }
};
