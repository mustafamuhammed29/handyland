/**
 * backend/controllers/emailTemplateController.js
 * Email Templates management using Supabase
 */
'use strict';

const { supabaseAdmin } = require('../config/supabase');

// @route GET /api/email-templates
exports.getTemplates = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('email_templates').select('*').order('name', { ascending: true });
        if (error) throw error;
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) { next(error); }
};

// @route GET /api/email-templates/:id
exports.getTemplate = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('email_templates').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Template not found' });
        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route POST /api/email-templates
exports.createTemplate = async (req, res, next) => {
    try {
        const { name, subject, bodyHtml, bodyText, variables, isActive } = req.body;
        if (!name || !subject) return res.status(400).json({ success: false, message: 'Name and subject are required' });

        const { data, error } = await supabaseAdmin
            .from('email_templates')
            .insert({ name, subject, body_html: bodyHtml, body_text: bodyText, variables: variables || [], is_active: isActive !== false })
            .select().single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Template name already exists' });
            throw error;
        }

        return res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route PUT /api/email-templates/:id
exports.updateTemplate = async (req, res, next) => {
    try {
        const { name, subject, bodyHtml, bodyText, variables, isActive } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (subject) updateData.subject = subject;
        if (bodyHtml !== undefined) updateData.body_html = bodyHtml;
        if (bodyText !== undefined) updateData.body_text = bodyText;
        if (variables) updateData.variables = variables;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabaseAdmin.from('email_templates').update(updateData).eq('id', req.params.id).select().single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Template name already exists' });
            throw error;
        }
        if (!data) return res.status(404).json({ success: false, message: 'Template not found' });

        return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @route DELETE /api/email-templates/:id
exports.deleteTemplate = async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin.from('email_templates').delete().eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (error) { next(error); }
};
