/**
 * backend/controllers/productController.js
 * Products CRUD using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { deleteImage } = require('../config/supabase');

// ── @route GET /api/products ──────────────────────────────────
exports.getProducts = async (req, res, next) => {
    try {
        const {
            page = 1, limit = 20,
            category, brand, condition,
            minPrice, maxPrice,
            search, sort = 'created_at',
            order = 'desc', isActive, featured
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Map frontend sort aliases to valid DB columns
        const sortAliasMap = {
            newest: 'created_at',
            oldest: 'created_at',
            'price-asc': 'price',
            'price-desc': 'price',
            name: 'name',
            rating: 'rating'
        };
        const dbSort = sortAliasMap[sort] || sort;
        const dbOrder = sort === 'oldest' ? 'asc'
            : sort === 'price-asc' ? 'asc'
                : sort === 'price-desc' ? 'desc'
                    : order;

        let query = supabaseAdmin
            .from('products')
            .select('*', { count: 'exact' });

        // Filters
        if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');
        else query = query.eq('is_active', true); // default: active only

        if (featured === 'true') {
            query = query.gt('stock', 0).order('sold', { ascending: false });
        }

        // Ignore placeholder 'All' value sent by frontend dropdowns
        if (category && category !== 'All') query = query.ilike('category', category);
        if (brand && brand !== 'All') query = query.ilike('brand', brand);
        if (condition && condition !== 'All') query = query.ilike('condition', condition);
        if (minPrice) query = query.gte('price', Number(minPrice));
        if (maxPrice) query = query.lte('price', Number(maxPrice));

        // Full-text search
        if (search) {
            query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
        }

        // Sort & pagination
        query = query
            .order(dbSort, { ascending: dbOrder === 'asc' })
            .range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true,
            count,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                pages: Math.ceil(count / Number(limit))
            },
            products: data,
            data: data
        });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/products/:id ──────────────────────────────
exports.getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Support both UUID and legacy string ID
        let query = supabaseAdmin.from('products').select('*, product_imeis(*)');

        if (id.includes('-') && id.length === 36) {
            query = query.eq('id', id);
        } else {
            query = query.eq('legacy_id', id);
        }

        const { data, error } = await query.single();
        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ 
            success: true, 
            product: data,
            data: data 
        });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/products ─────────────────────────────────
exports.createProduct = async (req, res, next) => {
    try {
        const productData = {
            legacy_id: req.body.id || null,
            name: req.body.name,
            price: req.body.price,
            stock: req.body.stock || 0,
            min_stock: req.body.minStock || 2,
            is_active: req.body.isActive !== false,
            barcode: req.body.barcode || null,
            description: req.body.description || null,
            features: req.body.features || [],
            image: req.fileUrl || req.body.image || null,
            images: req.fileUrls || req.body.images || [],
            category: req.body.category || null,
            sub_category: req.body.subCategory || null,
            brand: req.body.brand || null,
            model: req.body.model || null,
            supplier_name: req.body.supplierName || null,
            supplier_contact: req.body.supplierContact || null,
            cost_price: req.body.costPrice || 0,
            condition: req.body.condition || null,
            seller: req.body.seller || null,
            battery: req.body.battery || null,
            processor: req.body.processor || null,
            color: req.body.color || null,
            display: req.body.display || null,
            storage: req.body.storage || null,
            specs: req.body.specs || {},
            is_margin_scheme: req.body.isMarginScheme || false,
            seo_meta_title: req.body.seo?.metaTitle || null,
            seo_meta_description: req.body.seo?.metaDescription || null,
            seo_keywords: req.body.seo?.keywords || null,
            seo_canonical_url: req.body.seo?.canonicalUrl || null
        };

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;

        // Insert IMEIs if provided
        if (req.body.imeis && req.body.imeis.length > 0) {
            const imeis = req.body.imeis.map(imei => ({
                product_id: data.id,
                code: imei.code,
                status: imei.status || 'available',
                cost_price: imei.costPrice || null
            }));
            await supabaseAdmin.from('product_imeis').insert(imeis);
        }

        return res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route PUT /api/products/:id ──────────────────────────────
exports.updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const updateData = {};
        const fieldMap = {
            name: 'name', price: 'price', stock: 'stock', minStock: 'min_stock',
            isActive: 'is_active', barcode: 'barcode', description: 'description',
            features: 'features', category: 'category', subCategory: 'sub_category',
            brand: 'brand', model: 'model', supplierName: 'supplier_name',
            supplierContact: 'supplier_contact', costPrice: 'cost_price',
            condition: 'condition', seller: 'seller', battery: 'battery',
            processor: 'processor', color: 'color', display: 'display',
            storage: 'storage', specs: 'specs', isMarginScheme: 'is_margin_scheme'
        };

        Object.keys(fieldMap).forEach(key => {
            if (req.body[key] !== undefined) updateData[fieldMap[key]] = req.body[key];
        });

        if (req.fileUrl) updateData.image = req.fileUrl;
        if (req.fileUrls) updateData.images = req.fileUrls;
        if (req.body.seo) {
            updateData.seo_meta_title = req.body.seo.metaTitle;
            updateData.seo_meta_description = req.body.seo.metaDescription;
            updateData.seo_keywords = req.body.seo.keywords;
            updateData.seo_canonical_url = req.body.seo.canonicalUrl;
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'Product not found' });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ── @route DELETE /api/products/:id ──────────────────────────
exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get product first to delete image
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('image, images')
            .eq('id', id)
            .single();

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/products/categories ───────────────────────
exports.getCategories = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('category')
            .eq('is_active', true)
            .not('category', 'is', null);

        if (error) throw error;

        const categories = [...new Set(data.map(p => p.category).filter(Boolean))];
        return res.status(200).json({ success: true, categories, data: categories });
    } catch (error) {
        next(error);
    }
};

// ── @route GET /api/products/featured ─────────────────────────
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('sold', { ascending: false })
            .limit(8);

        if (error) throw error;
        return res.status(200).json({ success: true, products: data, data });
    } catch (error) {
        next(error);
    }
};

// ── @route POST /api/products/validate-stock ──────────────────
exports.validateStock = async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }

        const results = [];
        let allAvailable = true;

        for (const item of items) {
            const { data: product } = await supabaseAdmin
                .from('products')
                .select('id, name, stock')
                .eq('id', item.id)
                .single();

            if (!product) {
                results.push({ id: item.id, name: item.name, available: false, reason: 'Product not found' });
                allAvailable = false;
            } else if (product.stock < item.quantity) {
                results.push({ id: item.id, name: product.name, available: false, currentStock: product.stock, requested: item.quantity });
                allAvailable = false;
            } else {
                results.push({ id: item.id, name: product.name, available: true });
            }
        }

        return res.status(200).json({ success: allAvailable, results });
    } catch (error) {
        next(error);
    }
};
// ── @route GET /api/products/admin/stats ──────────────────────
exports.getProductStats = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('stock, price, is_active');

        if (error) throw error;

        const active = (data || []).filter(p => p.is_active !== false);
        const stats = {
            totalProducts: active.length,
            totalInventoryValue: active.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0),
            lowStock: active.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length,
            outOfStock: active.filter(p => (p.stock || 0) === 0).length
        };

        return res.status(200).json({ success: true, data: stats });
    } catch (error) { next(error); }
};

exports.getRelatedProducts = async (req, res, next) => {
    try {
        const { data: product } = await supabaseAdmin
            .from('products')
            .select('brand, category')
            .eq('id', req.params.id)
            .single();

        if (!product) return res.status(200).json({ success: true, products: [] });

        const { data: related } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_active', true)
            .neq('id', req.params.id)
            .or(`brand.eq."${product.brand}",category.eq."${product.category}"`)
            .limit(4);

        res.status(200).json({ success: true, products: related || [] });
    } catch (error) {
        next(error);
    }
};

exports.getProductReviews = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, reviews: [] });
    } catch (error) {
        next(error);
    }
};

exports.getProductQuestions = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, questions: [] });
    } catch (error) {
        next(error);
    }
};
