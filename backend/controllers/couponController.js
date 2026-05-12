/**
 * backend/controllers/couponController.js
 * Coupon management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/coupons
exports.getCoupons = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const { isActive } = req.query;
        let query = supabaseAdmin.from('coupons').select('*');

        if (!isAdmin) {
            query = query.eq('is_active', true).gte('valid_until', new Date().toISOString());
        } else if (isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;

        // Map to camelCase for frontend
        const mappedData = (data || []).map(c => ({
            _id: c.id,
            code: c.code,
            discountType: c.discount_type,
            discountValue: c.discount_value,
            minOrderValue: c.min_order_value,
            maxDiscount: c.max_discount,
            validUntil: c.valid_until,
            usageLimit: c.usage_limit,
            usedCount: c.used_count,
            isActive: c.is_active,
            createdAt: c.created_at
        }));

        return res.status(200).json({ success: true, count: mappedData.length, data: mappedData });
    } catch (error) { next(error); }
};

// @route POST /api/coupons (Admin)
exports.createCoupon = async (req, res, next) => {
    try {
        const { code, discountType, discountValue, minOrderValue, maxDiscount, validUntil, usageLimit, isActive } = req.body;
        if (!code || !discountValue || !validUntil) return res.status(400).json({ success: false, message: 'Missing required fields' });

        const { data, error } = await supabaseAdmin
            .from('coupons')
            .insert({
                code: code.toUpperCase(),
                discount_type: discountType || 'percentage',
                discount_value: discountValue,
                min_order_value: minOrderValue || 0,
                max_discount: maxDiscount || null,
                valid_until: validUntil,
                usage_limit: usageLimit || null,
                is_active: isActive !== false
            })
            .select().single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            throw error;
        }
        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/coupons/:id (Admin)
exports.updateCoupon = async (req, res, next) => {
    try {
        const fields = ['code','discount_type','discount_value','min_order_value','max_discount','valid_until','usage_limit','is_active'];
        const updateData = {};
        fields.forEach(f => {
            const camelCase = f.replace(/_([a-z])/g, g => g[1].toUpperCase());
            if (req.body[camelCase] !== undefined) updateData[f] = req.body[camelCase];
        });
        if (updateData.code) updateData.code = updateData.code.toUpperCase();

        const { data, error } = await supabaseAdmin.from('coupons').update(updateData).eq('id', req.params.id).select().single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            throw error;
        }
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/coupons/:id (Admin)
exports.deleteCoupon = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('coupons').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Coupon deleted' });
    } catch (error) { next(error); }
};

// @route POST /api/coupons/validate
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, cartTotal } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

        const { data: coupon, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        if (!coupon.is_active || new Date(coupon.valid_until) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired or is inactive' });
        }
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }
        if (cartTotal && cartTotal < coupon.min_order_value) {
            return res.status(400).json({ success: false, message: `Minimum order value of €${coupon.min_order_value} required` });
        }

        // Calculate discount (optional)
        let discountAmount = 0;
        if (cartTotal) {
            if (coupon.discount_type === 'percentage') {
                discountAmount = (cartTotal * coupon.discount_value) / 100;
                if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
            } else {
                discountAmount = coupon.discount_value;
            }
            discountAmount = Math.min(discountAmount, cartTotal);
        }

        return res.status(200).json({ 
            success: true, 
            data: coupon, 
            calculatedDiscount: discountAmount,
            couponCode: coupon.code,
            discount: discountAmount
        });
    } catch (error) { next(error); }
};

// @route PATCH /api/coupons/:id/toggle (Admin)
exports.toggleCoupon = async (req, res, next) => {
    try {
        const { data: coupon, error: fetchError } = await supabaseAdmin.from('coupons').select('is_active').eq('id', req.params.id).single();
        if (fetchError || !coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        const { error: updateError } = await supabaseAdmin
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', req.params.id);

        if (updateError) throw updateError;
        return res.status(200).json({ success: true, message: `Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
};

// @route GET /api/coupons/latest-promo
exports.getLatestPromo = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('is_active', true)
            .gte('valid_until', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'No active promo found' });

        return res.status(200).json({
            success: true,
            data: {
                _id: data.id,
                code: data.code,
                discountType: data.discount_type,
                discountValue: data.discount_value,
                minOrderValue: data.min_order_value,
                maxDiscount: data.max_discount,
                validUntil: data.valid_until
            }
        });
    } catch (error) { next(error); }
};
