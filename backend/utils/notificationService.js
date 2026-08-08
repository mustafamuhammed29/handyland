/**
 * notificationService.js
 * Single entry-point for creating + delivering notifications.
 * Handles: DB save (Supabase) → Socket.io push → Email
 */
const { supabaseAdmin } = require('../config/supabase');
const { emitNotification } = require('./socket');
const { sendEmail } = require('./emailService');

/**
 * Create and deliver a notification to a user.
 *
 * @param {Object} opts
 * @param {string}  opts.userId      - Supabase User ID (UUID)
 * @param {string}  [opts.userEmail] - User's email (will fetch if not provided)
 * @param {string}  [opts.userName]  - User's name (will fetch if not provided)
 * @param {string}  opts.message     - Short notification text
 * @param {string}  opts.type        - 'info' | 'success' | 'warning' | 'error'
 * @param {string}  [opts.link]      - Frontend URL to navigate on click
 * @param {string}  opts.category    - 'orderUpdates' | 'repairStatus' | 'promotions' | 'newsletter'
 * @param {string}  [opts.subject]   - Email subject
 * @param {string}  [opts.emailHtml] - Custom email HTML
 */
const notify = async ({
  userId,
  userEmail = null,
  userName = null,
  message,
  type = 'info',
  link = null,
  category = 'orderUpdates',
  subject = null,
  emailHtml = null
}) => {
  try {
    if (!userId) return;

    // ── 1. Save to DB ──────────────────────────────────────────
    const { data: notif, error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      message,
      type,
      link,
      read: false
    }).select().single();

    if (error) throw error;

    // ── 2. Real-time push via Socket.io ────────────────────────
    if (notif) {
      emitNotification(userId, {
        id: notif.id,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        read: false,
        createdAt: notif.created_at
      });
    }

    // ── 3. Fetch User Email & Prefs if needed ──────────────────
    let targetEmail = userEmail;
    let targetName = userName;
    let shouldEmail = true; // Default to true for important updates if prefs not found

    if (!targetEmail) {
      const { data: userProfile } = await supabaseAdmin.from('users').select('email, first_name, last_name').eq('id', userId).single();
      if (userProfile) {
        targetEmail = userProfile.email;
        targetName = targetName || userProfile.first_name || 'Kunde';
        
        // Note: If you add a notification_prefs JSON column to users table in the future,
        // you can check it here. E.g.:
        // if (userProfile.notification_prefs) { shouldEmail = userProfile.notification_prefs[category] !== false; }
      }
    }

    // ── 4. Send Email ──────────────────────────────────────────
    if (shouldEmail && targetEmail) {
      const emailSubject = subject || `HandyLand: ${message.substring(0, 60)}`;
      const html = emailHtml || buildDefaultEmailHtml(targetName, message, link, type);
      try {
        await sendEmail({ email: targetEmail, subject: emailSubject, html, message: message });
      } catch (emailErr) {
        console.error('📧 Notification email failed (non-fatal):', emailErr.message);
      }
    }
  } catch (err) {
    console.error('❌ notificationService error (non-fatal):', err.message);
  }
};

/** Build a clean, minimal HTML email */
const buildDefaultEmailHtml = (name, message, link, type) => {
  const colors = { success: '#22c55e', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' };
  const color = colors[type] || colors.info;
  const frontendUrl = process.env.FRONTEND_URL || 'https://front-end-rho-five-94.vercel.app';
  
  // Format link correctly: ensure it starts with / if we are appending to frontendUrl
  const finalLink = link ? (link.startsWith('http') ? link : `${frontendUrl}${link.startsWith('/') ? '' : '/'}${link}`) : null;

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:100%;">
        <tr><td style="background:${color};padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">HandyLand</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#94a3b8;margin:0 0 8px;">Hallo ${name || 'Kunde'},</p>
          <p style="color:#f1f5f9;font-size:16px;line-height:1.6;margin:0 0 24px;">${message}</p>
          ${finalLink ? `<a href="${finalLink}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Details ansehen →</a>` : ''}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #334155;">
          <p style="color:#475569;font-size:12px;margin:0;">Sie können Ihre Benachrichtigungseinstellungen in Ihrem <a href="${frontendUrl}/dashboard" style="color:#3b82f6;">Konto</a> verwalten.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

module.exports = { notify };
