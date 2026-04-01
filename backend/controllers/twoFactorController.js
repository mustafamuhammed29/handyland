'use strict';
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `HandyLand (${req.user.email})` });
    await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret.base32, twoFactorEnabled: false });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ success: true, qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 2 });
    if (!verified) {return res.status(400).json({ success: false, message: 'Invalid 2FA token' });}
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false, twoFactorSecret: undefined });
    res.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
