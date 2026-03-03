/**
 * notificationService.js
 * Single entry-point for creating + delivering notifications.
 * Handles: DB save → Socket.io push → Email (if prefs allow)
 */
const Notification = require('../models/Notification');
const { emitNotification } = require('./socket');
const sendEmail = require('./emailService');

/**
 * Create and deliver a notification to a user.
 *
 * @param {Object} opts
 * @param {string}  opts.userId      - MongoDB User ObjectId (string)
 * @param {string}  opts.userEmail   - User's email address
 * @param {string}  opts.userName    - User's name (for email greeting)
 * @param {string}  opts.message     - Short notification text
 * @param {string}  opts.type        - 'info' | 'success' | 'warning' | 'error'
 * @param {string}  [opts.link]      - Frontend URL to navigate on click
 * @param {string}  opts.category    - 'orderUpdates' | 'repairStatus' | 'promotions' | 'newsletter'
 * @param {string}  [opts.subject]   - Email subject (optional, auto-generated if not provided)
 * @param {string}  [opts.emailHtml] - Custom email HTML (optional)
 * @param {object}  [opts.prefs]     - User's notificationPrefs from DB (optional, skip email if not provided)
 */
const notify = async ({
    userId,
    userEmail,
    userName,
    message,
    type = 'info',
    link = null,
    category = 'orderUpdates',
    subject = null,
    emailHtml = null,
    prefs = null
}) => {
    try {
        // ── 1. Save to DB ──────────────────────────────────────────
        const notif = await Notification.create({ user: userId, message, type, link });

        // ── 2. Real-time push via Socket.io ────────────────────────
        emitNotification(userId, {
            _id: notif._id,
            message: notif.message,
            type: notif.type,
            link: notif.link,
            read: false,
            createdAt: notif.createdAt
        });

        // ── 3. Email – only if user has prefs set AND that category is ON ──
        const shouldEmail = prefs ? prefs[category] : false;
        if (shouldEmail && userEmail) {
            const emailSubject = subject || `HandyLand: ${message.substring(0, 60)}`;
            const html = emailHtml || buildDefaultEmailHtml(userName, message, link, type);
            try {
                await sendEmail({ email: userEmail, subject: emailSubject, html });
            } catch (emailErr) {
                console.error('📧 Notification email failed (non-fatal):', emailErr.message);
            }
        }
    } catch (err) {
        // Never let notification failure crash the main request
        console.error('❌ notificationService error (non-fatal):', err.message);
    }
};

/** Build a clean, minimal HTML email */
const buildDefaultEmailHtml = (name, message, link, type) => {
    const colors = { success: '#22c55e', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' };
    const color = colors[type] || colors.info;

    return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr><td style="background:${color};padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">HandyLand</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#94a3b8;margin:0 0 8px;">Hi ${name || 'there'},</p>
          <p style="color:#f1f5f9;font-size:16px;line-height:1.6;margin:0 0 24px;">${message}</p>
          ${link ? `<a href="${link}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">View Details →</a>` : ''}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #334155;">
          <p style="color:#475569;font-size:12px;margin:0;">You received this because you have notifications enabled for this category. <br>Manage your preferences in your <a href="/dashboard" style="color:#3b82f6;">account settings</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

module.exports = { notify };
