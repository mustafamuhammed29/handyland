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

        // Map to camelCase for frontend
        const mappedData = (data || []).map(t => ({
            _id: t.id,
            name: t.name,
            subject: t.subject,
            html: t.body_html,
            text: t.body_text,
            variables: t.variables || [],
            isActive: t.is_active,
            createdAt: t.created_at
        }));

        return res.status(200).json({ success: true, count: mappedData.length, data: mappedData });
    } catch (error) { next(error); }
};

// @route GET /api/email-templates/:id
exports.getTemplate = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin.from('email_templates').select('*').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ success: false, message: 'Template not found' });
        
        const mapped = {
            _id: data.id,
            name: data.name,
            subject: data.subject,
            html: data.body_html,
            text: data.body_text,
            variables: data.variables || [],
            isActive: data.is_active,
            createdAt: data.created_at
        };

        return res.status(200).json({ success: true, data: mapped });
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
        const { name, subject, html, bodyHtml, bodyText, text, variables, isActive } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (subject) updateData.subject = subject;
        
        // Handle both camelCase and short names from frontend
        const finalHtml = html || bodyHtml;
        if (finalHtml !== undefined) updateData.body_html = finalHtml;
        
        const finalText = text || bodyText;
        if (finalText !== undefined) updateData.body_text = finalText;
        
        if (variables) updateData.variables = variables;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data, error } = await supabaseAdmin.from('email_templates').update(updateData).eq('id', req.params.id).select().single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ success: false, message: 'Template name already exists' });
            throw error;
        }
        if (!data) return res.status(404).json({ success: false, message: 'Template not found' });

        const mapped = {
            _id: data.id,
            name: data.name,
            subject: data.subject,
            html: data.body_html,
            text: data.body_text,
            variables: data.variables || [],
            isActive: data.is_active,
            createdAt: data.created_at
        };

        return res.status(200).json({ success: true, data: mapped });
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
