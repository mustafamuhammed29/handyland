'use strict';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const resetHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#6366f1;font-size:28px;margin:0;letter-spacing:-0.5px;">HandyLand</h1>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Mobile Repair &amp; Shop</p>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">
      <h2 style="color:#f1f5f9;margin:0 0 12px;font-size:22px;">Password Reset Request</h2>
      <p style="color:#94a3b8;margin:0 0 28px;line-height:1.7;">Hi {{userName}},<br><br>We received a request to reset your HandyLand password. Click the button below to choose a new one.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{resetUrl}}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:bold;display:inline-block;">Reset Password &rarr;</a>
      </div>
      <p style="color:#475569;font-size:13px;margin:24px 0 0;padding-top:20px;border-top:1px solid #334155;line-height:1.6;">This link expires in <strong style="color:#94a3b8;">1 hour</strong>. If you did not request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.</p>
    </div>
    <p style="color:#334155;font-size:12px;text-align:center;margin-top:24px;">&copy; 2025 HandyLand. All rights reserved.</p>
  </div>
</body>
</html>`;

const resetText = `Password Reset Request

Hi {{userName}},

We received a request to reset your HandyLand password.

Click the link below to reset it:
{{resetUrl}}

This link expires in 1 hour.
If you did not request this, please ignore this email.

HandyLand Team`;

const verifyHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#6366f1;font-size:28px;margin:0;letter-spacing:-0.5px;">HandyLand</h1>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Mobile Repair &amp; Shop</p>
    </div>
    <div style="background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">&#x2705;</span>
      </div>
      <h2 style="color:#f1f5f9;margin:0 0 12px;font-size:22px;text-align:center;">Verify your Email</h2>
      <p style="color:#94a3b8;margin:0 0 28px;line-height:1.7;text-align:center;">Welcome to HandyLand, <strong style="color:#f1f5f9;">{{userName}}</strong>!<br>Please verify your email address to activate your account.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{verificationUrl}}" style="background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:bold;display:inline-block;">Verify Email &rarr;</a>
      </div>
      <p style="color:#475569;font-size:13px;margin:24px 0 0;padding-top:20px;border-top:1px solid #334155;line-height:1.6;text-align:center;">If you did not create a HandyLand account, you can safely ignore this email.</p>
    </div>
    <p style="color:#334155;font-size:12px;text-align:center;margin-top:24px;">&copy; 2025 HandyLand. All rights reserved.</p>
  </div>
</body>
</html>`;

const verifyText = `Welcome to HandyLand, {{userName}}!

Please verify your email address to activate your account:
{{verificationUrl}}

If you did not create a HandyLand account, you can safely ignore this email.

HandyLand Team`;

async function run() {
    console.log('Updating email templates...\n');

    const r1 = await supabase.from('email_templates').update({
        body_html: resetHtml,
        body_text: resetText,
        subject: 'Reset your HandyLand password',
        variables: ['{{userName}}', '{{resetUrl}}']
    }).eq('name', 'reset_password');
    console.log('reset_password:', r1.error ? 'ERROR: ' + r1.error.message : 'OK ✅');

    const r2 = await supabase.from('email_templates').update({
        body_html: verifyHtml,
        body_text: verifyText,
        subject: 'Verify your HandyLand account',
        variables: ['{{userName}}', '{{verificationUrl}}']
    }).eq('name', 'verify_email');
    console.log('verify_email:  ', r2.error ? 'ERROR: ' + r2.error.message : 'OK ✅');

    console.log('\nDone!');
}

run().catch(console.error);
