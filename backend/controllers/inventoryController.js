'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/inventory/stats
exports.getInventoryStats = async (req, res, next) => {
    try {
        // 1. Total Stock & Value from Products
        const { data: products } = await supabaseAdmin.from('products').select('stock, price, cost_price, min_stock');
        
        // 2. Total Stock & Value from Accessories
        const { data: accessories } = await supabaseAdmin.from('accessories').select('stock, price, cost_price, min_stock');

        // 3. Total Stock & Value from Repair Parts
        const { data: parts } = await supabaseAdmin.from('repair_parts').select('stock, price, cost_price, min_stock');

        const allItems = [...(products || []), ...(accessories || []), ...(parts || [])];

        let totalStock = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        allItems.forEach(item => {
            totalStock += (item.stock || 0);
            totalValue += (item.stock || 0) * (item.price || 0);
            if ((item.stock || 0) <= (item.min_stock || 2) && (item.stock || 0) > 0) lowStockCount++;
            if ((item.stock || 0) === 0) outOfStockCount++;
        });

        // 4. Sales Stats (from Orders)
        const { data: orders } = await supabaseAdmin.from('orders').select('total_amount').eq('status', 'delivered');
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

        return res.status(200).json({
            success: true,
            data: {
                totalStock,
                totalValue,
                lowStockCount,
                criticalStockCount: lowStockCount, // Can refine later
                outOfStockCount,
                totalItemsSold: orders?.length || 0,
                totalRevenue
            }
        });
    } catch (error) { next(error); }
};

// @route GET /api/inventory/items
exports.getInventoryItems = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, type = 'All', search, stock = 'All' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let allData = [];
        let totalItems = 0;

        if (type === 'All' || type === 'Product') {
            let q = supabaseAdmin.from('products').select('*');
            if (search) q = q.ilike('name', `%${search}%`);
            if (stock === 'Low') q = q.lte('stock', 2).gt('stock', 0);
            if (stock === 'Out') q = q.eq('stock', 0);
            const { data } = await q;
            if (data) allData = [...allData, ...data.map(i => ({ ...i, type: 'Product' }))];
        }

        if (type === 'All' || type === 'Accessory') {
            let q = supabaseAdmin.from('accessories').select('*');
            if (search) q = q.ilike('name', `%${search}%`);
            if (stock === 'Low') q = q.lte('stock', 2).gt('stock', 0);
            if (stock === 'Out') q = q.eq('stock', 0);
            const { data } = await q;
            if (data) allData = [...allData, ...data.map(i => ({ ...i, type: 'Accessory' }))];
        }

        if (type === 'All' || type === 'RepairPart') {
            let q = supabaseAdmin.from('repair_parts').select('*');
            if (search) q = q.ilike('name', `%${search}%`);
            if (stock === 'Low') q = q.lte('stock', 2).gt('stock', 0);
            if (stock === 'Out') q = q.eq('stock', 0);
            const { data } = await q;
            if (data) allData = [...allData, ...data.map(i => ({ ...i, type: 'RepairPart' }))];
        }

        totalItems = allData.length;
        const pagedData = allData.slice(offset, offset + Number(limit));

        return res.status(200).json({
            success: true,
            totalItems,
            data: pagedData.map(i => ({
                _id: i.id,
                name: i.name,
                type: i.type,
                stock: i.stock,
                minStock: i.min_stock || 2,
                price: i.price,
                costPrice: i.cost_price || 0,
                isMarginScheme: i.is_margin_scheme || false,
                category: i.category,
                brand: i.brand,
                image: i.image
            }))
        });
    } catch (error) { next(error); }
};

// @route GET /api/inventory/sales
exports.getRecentSales = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;
        
        // Fetch delivered orders and their items
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*)')
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (error) throw error;

        const sales = [];
        orders.forEach(order => {
            order.order_items?.forEach(item => {
                sales.push({
                    _id: item.id,
                    orderId: order.id,
                    orderNumber: order.order_number,
                    itemName: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                    date: order.created_at,
                    customerName: order.shipping_full_name
                });
            });
        });

        return res.status(200).json({ success: true, data: sales });
    } catch (error) { next(error); }
};

// @route GET /api/inventory/history
exports.getStockHistory = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;

        const { data, error } = await supabaseAdmin
            .from('stock_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: (data || []).map(h => ({
                _id: h.id,
                itemName: h.item_name,
                itemType: h.item_model,
                prevStock: h.previous_stock,
                newStock: h.new_stock,
                change: h.change_amount,
                reason: h.reason,
                notes: h.notes,
                date: h.created_at,
                userName: h.user_name
            }))
        });
    } catch (error) { next(error); }
};

// @route PUT /api/inventory/:type/:id/stock
exports.updateStock = async (req, res, next) => {
    try {
        const { id, type } = req.params;
        const { stock, newStock, price, costPrice, changeAmount, reason, notes, isMarginScheme, imeis } = req.body;
        
        const targetStock = stock !== undefined ? stock : newStock;
        
        const tableMap = {
            'Product': 'products',
            'Accessory': 'accessories',
            'RepairPart': 'repair_parts'
        };
        const table = tableMap[type] || 'products';

        // 1. Get current item
        const { data: item } = await supabaseAdmin.from(table).select('name, stock').eq('id', id).single();
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        // 2. Prepare update data
        const updateData = {};
        if (targetStock !== undefined) updateData.stock = targetStock;
        if (price !== undefined) updateData.price = price;
        if (costPrice !== undefined) updateData.cost_price = costPrice;
        if (isMarginScheme !== undefined) updateData.is_margin_scheme = isMarginScheme;
        if (imeis !== undefined) updateData.imeis = imeis;

        // 3. Update
        const { error } = await supabaseAdmin.from(table).update(updateData).eq('id', id);
        if (error) throw error;

        // 4. Log history if stock changed
        if (targetStock !== undefined && targetStock !== item.stock) {
            await supabaseAdmin.from('stock_history').insert({
                item_id: id,
                item_model: type,
                item_name: item.name,
                user_id: req.user.id,
                user_name: req.user.name,
                previous_stock: item.stock,
                new_stock: targetStock,
                change_amount: changeAmount || (targetStock - item.stock),
                reason: reason || 'Manual Update',
                notes: notes || ''
            });
        }

        return res.status(200).json({ success: true, message: 'Item updated' });
    } catch (error) { next(error); }
};
