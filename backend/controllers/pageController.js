/**
 * backend/controllers/pageController.js
 * CMS Pages management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/pages
exports.getPages = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        let query = supabaseAdmin.from('pages').select('id, slug, title, is_published, created_at, updated_at').order('created_at', { ascending: false });

        if (!isAdmin) query = query.eq('is_published', true);

        const { data, error } = await query;
        if (error) throw error;

        const mappedData = (data || []).map(p => ({
            _id: p.id,
            slug: p.slug,
            title: p.title,
            isPublished: p.is_published,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        }));

        return res.status(200).json({ success: true, count: mappedData.length, data: mappedData });
    } catch (error) { next(error); }
};

// @route GET /api/pages/:slug
exports.getPage = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        let query = supabaseAdmin.from('pages').select('*');
        
        // Handle ID or slug
        if (req.params.slug.length === 36 && req.params.slug.includes('-')) {
            query = query.eq('id', req.params.slug);
        } else {
            query = query.eq('slug', req.params.slug);
        }

        const { data, error } = await query.single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Page not found' });
        
        if (!data.is_published && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Page not published' });
        }

        const mapped = {
            _id: data.id,
            slug: data.slug,
            title: data.title,
            content: data.content,
            isPublished: data.is_published,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        return res.status(200).json({ success: true, data: mapped });
    } catch (error) { next(error); }
};

// @route POST /api/pages (Admin — Create or Update by slug)
exports.createPage = async (req, res, next) => {
    try {
        const { slug, title, isPublished } = req.body;
        let { content } = req.body;
        if (content) content = content.replace(/&nbsp;/g, ' ').replace(/  +/g, ' ');

        if (!slug || !title) return res.status(400).json({ success: false, message: 'Slug and title are required' });

        // Check if page already exists by slug
        const { data: existing } = await supabaseAdmin
            .from('pages').select('id').eq('slug', slug).maybeSingle();

        let data, error;

        if (existing) {
            // Update existing page
            const result = await supabaseAdmin
                .from('pages')
                .update({ title, content, is_published: isPublished !== false, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Insert new page
            const result = await supabaseAdmin
                .from('pages')
                .insert({ slug, title, content, is_published: isPublished !== false })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) {
            console.error('createPage Supabase error:', error);
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Slug already exists' });
            throw error;
        }

        const mapped = {
            _id: data.id,
            slug: data.slug,
            title: data.title,
            content: data.content,
            isPublished: data.is_published,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        return res.status(existing ? 200 : 201).json({ success: true, data: mapped });
    } catch (error) {
        console.error('createPage error:', error);
        next(error);
    }
};

// @route PUT /api/pages/:id (Admin)
exports.updatePage = async (req, res, next) => {
    try {
        const { slug, title, isPublished } = req.body;
        let { content } = req.body;
        if (content) content = content.replace(/&nbsp;/g, ' ').replace(/  +/g, ' ');

        const updateData = {};
        
        if (slug) updateData.slug = slug;
        if (title) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (isPublished !== undefined) updateData.is_published = isPublished;

        const { data, error } = await supabaseAdmin.from('pages').update(updateData).eq('id', req.params.id).select().single();
        
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Slug already exists' });
            throw error;
        }
        if (!data) return res.status(404).json({ success: false, message: 'Page not found' });

        const mapped = {
            _id: data.id,
            slug: data.slug,
            title: data.title,
            content: data.content,
            isPublished: data.is_published,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        return res.status(200).json({ success: true, data: mapped });
    } catch (error) { next(error); }
};

// @route DELETE /api/pages/:id (Admin)
exports.deletePage = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('pages').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Page deleted' });
    } catch (error) { next(error); }
};
