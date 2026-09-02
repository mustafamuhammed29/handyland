/**
 * Phone Verification Service
 * Handles sending and verifying OTP codes via multiple adapters:
 * 1. Log / Development (Default) - Prints OTP to console/log
 * 2. Twilio (SMS) - If TWILIO credentials are set
 * 3. WhatsApp Business Cloud API (WhatsApp OTP) - If WHATSAPP credentials are set
 */

const NodeCache = require('node-cache');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Cache OTPs for 5 minutes (300 seconds)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class PhoneVerificationService {
    /**
     * Generates a 6-digit random verification code
     * @returns {string}
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Sends OTP code via Twilio SMS
     * @param {string} phone
     * @param {string} otp
     * @returns {Promise<boolean>}
     */
    async sendTwilioSMS(phone, otp) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM_PHONE;

        if (!sid || !token || !from) return false;

        try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
            const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
            
            const params = new URLSearchParams();
            params.append('To', phone);
            params.append('From', from);
            params.append('Body', `Dein HandyLand Verifizierungscode ist: ${otp}. Er ist 5 Minuten gültig.`);

            const response = await axios.post(twilioUrl, params, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log(`[Twilio] OTP sent successfully to ${phone}. Message SID: ${response.data.sid}`);
            return true;
        } catch (error) {
            console.error('[Twilio] Error sending SMS:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Sends OTP code via WhatsApp Business Cloud API
     * @param {string} phone
     * @param {string} otp
     * @returns {Promise<boolean>}
     */
    async sendWhatsAppOTP(phone, otp) {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'verification_code';

        if (!token || !phoneId) return false;

        try {
            // Clean phone number (WhatsApp needs it without leading '+' or '00')
            const cleanPhone = phone.replace(/[^0-9]/g, '');

            const waUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
            
            const isHelloWorld = templateName === 'hello_world';
            
            const payload = {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: isHelloWorld ? 'en_US' : (process.env.WHATSAPP_TEMPLATE_LANG || 'de') }
                }
            };

            if (!isHelloWorld) {
                payload.template.components = [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: otp }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: 0,
                        parameters: [
                            { type: 'text', text: otp }
                        ]
                    }
                ];
            }

            const response = await axios.post(waUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[WhatsApp] OTP sent successfully to ${phone}. Message ID: ${response.data.messages[0].id}`);
            return true;
        } catch (error) {
            console.error('[WhatsApp] Error sending message:', error.response ? error.response.data : error.message);
            return false;
        }
    }

    /**
     * Entry Point: Sends verification code to phone
     * @param {string} phone
     * @returns {Promise<{success: boolean, message: string, devCode?: string}>}
     */
    async sendOTP(phone) {
        if (!phone) {
            return { success: false, message: 'Phone number is required' };
        }

        const otp = this.generateOTP();
        
        // Cache code with key: phone_otp_+49...
        otpCache.set(`phone_otp_${phone}`, otp);

        if (process.env.NODE_ENV !== 'production') {
            console.log('\n--- 📱 PHONE VERIFICATION REQUEST ---');
            console.log(`Target Phone: ${phone}`);
            console.log(`Generated OTP Code: ${otp}`);
            console.log('-------------------------------------\n');
        } else {
            console.log(`[Phone Verification] Sending OTP to ${phone}`);
        }

        // 1. Try WhatsApp first if configured
        if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
            const sent = await this.sendWhatsAppOTP(phone, otp);
            if (sent) {
                return { 
                    success: true, 
                    message: 'Verification code sent via WhatsApp successfully.',
                    devCode: process.env.NODE_ENV === 'development' ? otp : undefined 
                };
            }
        }

        // 2. Try Twilio SMS if configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE) {
            const sent = await this.sendTwilioSMS(phone, otp);
            if (sent) {
                return { success: true, message: 'Verification code sent via SMS successfully.' };
            }
        }

        // 3. Fallback to Console Log (Development Mode)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEVELOPMENT MODE] Verification code for ${phone} is: ${otp}`);
        }
        
        return { 
            success: true, 
            message: 'Development Mode: Code generated and printed to console.', 
            devCode: process.env.NODE_ENV === 'development' ? otp : undefined 
        };
    }

    /**
     * Verifies the OTP code and updates public.users
     * @param {string} userId
     * @param {string} phone
     * @param {string} otp
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOTP(userId, phone, otp) {
        if (!userId || !phone || !otp) {
            return { success: false, message: 'Missing parameters. userId, phone, and otp are required.' };
        }

        const cachedOTP = otpCache.get(`phone_otp_${phone}`);

        if (!cachedOTP) {
            return { success: false, message: 'Verification code expired or never requested.' };
        }

        if (cachedOTP !== otp) {
            return { success: false, message: 'Invalid verification code.' };
        }

        // Valid OTP -> Clear from cache immediately (single use security)
        otpCache.del(`phone_otp_${phone}`);

        try {
            // Update phone number and mark verified in public.users
            const { error } = await supabase
                .from('users')
                .update({
                    phone: phone,
                    is_verified: true // Mark profile verified
                })
                .eq('id', userId);

            if (error) {
                console.error('Error updating user profile with phone:', error.message);
                return { success: false, message: 'Verification succeeded but failed to update user profile in database.' };
            }

            console.log(`[Success] Verified and updated phone number: ${phone} for User ID: ${userId}`);
            return { success: true, message: 'Phone number verified successfully.' };
        } catch (err) {
            console.error('Unexpected error during verification database update:', err.message);
            return { success: false, message: 'Internal server error updating profile.' };
        }
    }
}

module.exports = new PhoneVerificationService();
