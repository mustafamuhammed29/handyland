/**
 * backend/controllers/purchaseOrderController.js
 * Purchase Orders management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// Helper to generate PO number
const generatePONumber = () => `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

// @route GET /api/purchase-orders
exports.getPurchaseOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, supplierId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('purchase_orders').select('*, suppliers(name), users(name)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

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

// @route GET /api/purchase-orders/:id
exports.getPurchaseOrder = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('purchase_orders')
            .select('*, suppliers(*), users(name), purchase_order_items(*)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ success: false, message: 'Purchase order not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/purchase-orders
exports.createPurchaseOrder = async (req, res, next) => {
    try {
        const { supplierId, expectedDeliveryDate, notes, items } = req.body;
        if (!supplierId || !items || !items.length) return res.status(400).json({ success: false, message: 'Supplier and items are required' });

        let totalAmount = 0;
        items.forEach(item => { totalAmount += (item.quantity * item.unitPrice); });

        // 1. Create PO
        const { data: po, error: poError } = await supabaseAdmin
            .from('purchase_orders')
            .insert({
                po_number: generatePONumber(),
                supplier_id: supplierId,
                total_amount: totalAmount,
                status: 'Draft',
                expected_delivery_date: expectedDeliveryDate,
                notes,
                created_by: req.user.id
            })
            .select().single();

        if (poError) throw poError;

        // 2. Add Items
        const poItems = items.map(item => ({
            purchase_order_id: po.id,
            product_name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.quantity * item.unitPrice
        }));

        const { error: itemsError } = await supabaseAdmin.from('purchase_order_items').insert(poItems);
        if (itemsError) throw itemsError;

        return res.status(201).json({ success: true, data: po });
    } catch (error) { next(error); }
};

// @route PUT /api/purchase-orders/:id/status
exports.updatePurchaseOrderStatus = async (req, res, next) => {
    try {
        const { status, actualDeliveryDate, notes } = req.body;
        const updateData = { status };
        
        if (actualDeliveryDate) updateData.actual_delivery_date = actualDeliveryDate;
        if (notes !== undefined) updateData.notes = notes;

        // If received, we might want to update stock automatically in a real system.
        // For now, just update status.
        
        const { data, error } = await supabaseAdmin.from('purchase_orders').update(updateData).eq('id', req.params.id).select().single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Purchase order not found' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};
