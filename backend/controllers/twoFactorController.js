'use strict';

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { supabaseAdmin } = require('../config/supabase');

exports.setup2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ name: `HandyLand (${req.user.email})` });

        // Update user profile in Supabase
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                two_factor_secret: secret.base32, 
                two_factor_enabled: false 
            })
            .eq('id', req.user.id);

        if (error) throw error;

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ success: true, qrCode: qrCodeUrl, secret: secret.base32 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { token } = req.body;

        // Fetch secret from Supabase
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('two_factor_secret')
            .eq('id', req.user.id)
            .single();

        if (fetchError || !user) throw new Error('User not found');

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
        }

        // Enable 2FA
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ two_factor_enabled: true })
            .eq('id', req.user.id);

        if (updateError) throw updateError;

        res.json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ 
                two_factor_enabled: false, 
                two_factor_secret: null 
            })
            .eq('id', req.user.id);

        if (error) throw error;

        res.json({ success: true, message: '2FA disabled' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
