/**
 * backend/controllers/inventoryController.js
 * Inventory & Stock management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/inventory
exports.getInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, type = 'Product', search, lowStock } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const table = type === 'Product' ? 'products' : 'accessories';
        
        let query = supabaseAdmin.from(table).select('id, legacy_id, name, stock, min_stock, price, is_active', { count: 'exact' });

        if (lowStock === 'true') {
            // Using raw SQL logic here requires a special view or we just filter where stock <= min_stock
            // Since Supabase JS doesn't support comparing two columns directly easily, we'll fetch all and filter, 
            // OR use a database RPC. For simplicity, we assume min_stock is mostly static.
            // A better way is using an RPC, but we'll use a basic filter for now if possible, or fetch and filter if small.
        }

        if (search) query = query.or(`name.ilike.%${search}%,legacy_id.ilike.%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Manual filter for low stock if requested
        let finalData = data;
        let finalCount = count;
        if (lowStock === 'true') {
            finalData = data.filter(item => item.stock <= item.min_stock);
            finalCount = finalData.length;
        }

        return res.status(200).json({
            success: true, count: finalCount,
            pagination: { page: Number(page), limit: Number(limit), total: finalCount, pages: Math.ceil(finalCount / Number(limit)) },
            data: finalData
        });
    } catch (error) { next(error); }
};

// @route PUT /api/inventory/update
exports.updateStock = async (req, res, next) => {
    try {
        const { itemId, type = 'Product', newStock, changeAmount, reason, notes } = req.body;
        
        if (!itemId || newStock === undefined || changeAmount === undefined || !reason) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const table = type === 'Product' ? 'products' : 'accessories';

        // 1. Get current stock & name
        const { data: item, error: itemError } = await supabaseAdmin.from(table).select('name, stock').eq('id', itemId).single();
        if (itemError || !item) return res.status(404).json({ success: false, message: 'Item not found' });

        // 2. Update stock
        const { error: updateError } = await supabaseAdmin.from(table).update({ stock: newStock }).eq('id', itemId);
        if (updateError) throw updateError;

        // 3. Log history
        await supabaseAdmin.from('stock_history').insert({
            item_id: itemId,
            item_model: type,
            item_name: item.name,
            user_id: req.user.id,
            user_name: req.user.name,
            previous_stock: item.stock,
            new_stock: newStock,
            change_amount: changeAmount,
            reason: reason,
            notes: notes || ''
        });

        return res.status(200).json({ success: true, message: 'Stock updated successfully', data: { newStock } });
    } catch (error) { next(error); }
};

// @route GET /api/inventory/history
exports.getStockHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, itemId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('stock_history').select('*', { count: 'exact' });
        if (itemId) query = query.eq('item_id', itemId);

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
