/**
 * @file utils/emailService.js
 * @description Lightweight email-sending wrapper around nodemailer.
 *
 * Configuration is read from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * If SMTP credentials are not configured (e.g. local development), emails
 * are logged to the console instead of being sent, so the rest of the
 * application keeps working without a mail server.
 */

const nodemailer = require('nodemailer');

let transporter = null;
let transporterInitialized = false;

/**
 * Lazily build and cache the nodemailer transporter.
 * Returns `null` if SMTP is not configured.
 */
const getTransporter = () => {
  if (transporterInitialized) return transporter;
  transporterInitialized = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      '[Email] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). ' +
      'Emails will be logged to the console instead of being sent.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: SMTP_SECURE === 'true', // true for port 465, false for other ports
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
};

/**
 * Send an email.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject
 * @param {string} [options.html]   - HTML body
 * @param {string} [options.text]   - Plain-text body
 * @param {Array}  [options.attachments] - nodemailer attachments array
 * @returns {Promise<{sent: boolean, messageId?: string, reason?: string}>}
 */
const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!to) {
    console.warn('[Email] sendMail called without a recipient address — skipping.');
    return { sent: false, reason: 'No recipient address provided' };
  }

  const from = process.env.EMAIL_FROM || 'no-reply@event-management.local';
  const t = getTransporter();

  if (!t) {
    console.log(`[Email:DEV] To: ${to} | Subject: "${subject}" | (SMTP not configured, not sent)`);
    return { sent: false, reason: 'SMTP not configured' };
  }

  const info = await t.sendMail({ from, to, subject, html, text, attachments });
  return { sent: true, messageId: info.messageId };
};

module.exports = { sendMail, getTransporter };
