const pool = require('../config/db');
const { sendEmail } = require('../config/email');

/**
 * Preference-to-notification type mapping.
 * Keys MUST match the literal `type` strings inserted into the notification
 * table by the controllers. Values are the column name in
 * notification_preference that gates email delivery for that type.
 *
 * Types with no entry here are still inserted as in-app notifications but
 * never trigger email — used for admin-only events with no preference row.
 */
const TYPE_TO_PREF = {
  new_application: 'email_new_application',                 // employer ← student applied
  application_status_change: 'email_application_status',    // student ← employer changed status
  new_message: 'email_new_message',                         // both
  internship_approved: 'email_internship_approved',         // employer ← admin approved
  internship_rejected: 'email_internship_approved',         // employer ← admin rejected
  invitation_received: 'email_invitation',                  // student ← employer invited
};

/**
 * Create a notification, optionally send email based on user preferences,
 * and push via Socket.IO if the io instance is provided.
 *
 * @param {Object} opts
 * @param {number} opts.userId - Recipient user ID
 * @param {string} opts.type - Notification type
 * @param {string} opts.title - Notification title
 * @param {string} opts.message - Notification message body
 * @param {number|null} opts.referenceId - Related entity ID
 * @param {string|null} opts.referenceType - Related entity type
 * @param {Object|null} opts.io - Socket.IO server instance
 */
async function createNotification({ userId, type, title, message, referenceId = null, referenceType = null, io = null }) {
  try {
    // Insert notification
    const [result] = await pool.execute(
      `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(userId), type, title, message, referenceId ? String(referenceId) : null, referenceType]
    );

    const notificationId = result.insertId;

    // Push via Socket.IO
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        notificationId,
        type,
        title,
        message,
        referenceId,
        referenceType,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Check email preference
    const prefColumn = TYPE_TO_PREF[type];
    let shouldEmail = false;

    if (prefColumn) {
      const [prefRows] = await pool.execute(
        `SELECT ${prefColumn} AS pref FROM notification_preference WHERE user_id = ?`,
        [String(userId)]
      );
      // If no preference row (e.g., admin), default to no email for admin
      if (prefRows.length > 0) {
        shouldEmail = !!prefRows[0].pref;
      }
    }
    // Admin notifications (new_user_registered, internship_pending_review, user_deactivated)
    // have no preference row — we don't email admins unless explicitly configured

    if (shouldEmail) {
      // Get user email
      const [userRows] = await pool.execute(
        'SELECT email, full_name FROM users WHERE user_id = ?',
        [String(userId)]
      );

      if (userRows.length > 0) {
        const { email, full_name } = userRows[0];
        const html = buildEmailHtml(title, message, full_name);

        await sendEmail(email, `InternMatch: ${title}`, html);

        // Mark email_sent
        await pool.execute(
          'UPDATE notification SET email_sent = 1 WHERE notification_id = ?',
          [String(notificationId)]
        );
      }
    }

    return notificationId;
  } catch (err) {
    console.error('[notificationService] createNotification failed:', err.message);
    return null;
  }
}

/**
 * Build a simple HTML email template.
 */
function buildEmailHtml(title, message, recipientName) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">InternMatch</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #475569; margin: 0 0 8px 0; font-size: 14px;">Hi ${recipientName || 'there'},</p>
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">${title}</h2>
        <p style="color: #475569; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">${message}</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View on InternMatch</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
        You can manage your email preferences in your account settings.
      </p>
    </div>
  `;
}

module.exports = { createNotification };
