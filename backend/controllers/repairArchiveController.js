/**
 * backend/controllers/repairArchiveController.js
 * Repair Cases/Archive management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/repairs/archive
exports.getAllCases = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = supabaseAdmin.from('repair_cases').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.status(200).json({
            success: true,
            cases: data,
            count,
            totalPages: Math.ceil(count / Number(limit)),
            currentPage: Number(page)
        });
    } catch (error) { next(error); }
};

// @route POST /api/repairs/archive
exports.createCase = async (req, res, next) => {
    try {
        const { title, category, difficulty, time, labelBefore, labelAfter, description } = req.body;
        
        const insertData = { title, category, difficulty, time, description };
        if (labelBefore) insertData.label_before = labelBefore;
        if (labelAfter) insertData.label_after = labelAfter;
        // In a real app, img_before and img_after would come from file uploads (req.files)
        // Here we just accept them if passed via body for simplicity, or handle via upload middleware
        if (req.body.imgBefore) insertData.img_before = req.body.imgBefore;
        if (req.body.imgAfter) insertData.img_after = req.body.imgAfter;

        const { data, error } = await supabaseAdmin.from('repair_cases').insert(insertData).select().single();
        if (error) throw error;

        return res.status(201).json(data);
    } catch (error) { next(error); }
};

// @route PUT /api/repairs/archive/:id
exports.updateCase = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, category, difficulty, time, labelBefore, labelAfter, description } = req.body;
        
        const updateData = {};
        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (difficulty) updateData.difficulty = difficulty;
        if (time) updateData.time = time;
        if (labelBefore) updateData.label_before = labelBefore;
        if (labelAfter) updateData.label_after = labelAfter;
        if (description) updateData.description = description;
        if (req.body.imgBefore) updateData.img_before = req.body.imgBefore;
        if (req.body.imgAfter) updateData.img_after = req.body.imgAfter;

        const { data, error } = await supabaseAdmin.from('repair_cases').update(updateData).eq('id', id).select().single();
        if (error || !data) return res.status(404).json({ message: 'Case not found' });

        return res.json(data);
    } catch (error) { next(error); }
};

// @route DELETE /api/repairs/archive/:id
exports.deleteCase = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('repair_cases').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.json({ message: 'Case deleted' });
    } catch (error) { next(error); }
};
