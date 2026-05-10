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
        const { fullName, email, phone, street, city, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            // Remove existing default
            await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
        }

        const { data, error } = await supabaseAdmin
            .from('addresses')
            .insert({
                user_id: req.user.id,
                full_name: fullName,
                email, phone, street, city, zip_code: zipCode, country: country || 'Germany',
                is_default: isDefault || false
            })
            .select().single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/addresses/:id
exports.updateAddress = async (req, res, next) => {
    try {
        const { fullName, email, phone, street, city, zipCode, country, isDefault } = req.body;

        if (isDefault) {
            await supabaseAdmin.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
        }

        const updateData = {};
        if (fullName) updateData.full_name = fullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (street) updateData.street = street;
        if (city) updateData.city = city;
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
