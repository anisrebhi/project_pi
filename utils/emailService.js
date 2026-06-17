/**
 * @file utils/emailService.js
 * @description Email service — sends transactional emails via Nodemailer.
 *              Supports verification emails, password reset, and welcome messages.
 *              Configure SMTP credentials in .env (see .env.example).
 *
 * NOTE: For development/demo, emails are logged to console when EMAIL_ENABLED=false.
 */

const nodemailer = require("nodemailer");

// ─── Transporter Factory ──────────────────────────────────────────────────────

const createTransporter = () => {
  // If EMAIL_ENABLED is false, use ethereal (console log) — great for dev/testing
  if (process.env.EMAIL_ENABLED !== "true") {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_DEV_USER || "test@ethereal.email",
        pass: process.env.EMAIL_DEV_PASS || "testpassword",
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Base Send Function ───────────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html, text }) => {
  // When email is disabled, just log to console (safe for dev/academic context)
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("\n📧 [EMAIL SIMULATED]");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${text || "(html only)"}`);
    console.log("─".repeat(60));
    return { messageId: "simulated", simulated: true };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "Event Management"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
  return info;
};

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * Send an email verification link
 * @param {string} email - Recipient email
 * @param {string} fullName - User's full name
 * @param {string} rawToken - Raw (unhashed) verification token
 */
const sendVerificationEmail = async (email, fullName, rawToken) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}`;

  return sendEmail({
    to: email,
    subject: "✅ Verify your email address",
    text: `Hello ${fullName},\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify your email address</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Thank you for registering. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background-color: #4CAF50; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in <strong>24 hours</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy this URL:<br>${verifyUrl}</p>
      </div>
    `,
  });
};

/**
 * Send a password reset link
 * @param {string} email
 * @param {string} fullName
 * @param {string} rawToken
 */
const sendPasswordResetEmail = async (email, fullName, rawToken) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  return sendEmail({
    to: email,
    subject: "🔐 Reset your password",
    text: `Hello ${fullName},\n\nYou requested a password reset. Visit:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset your password</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>You requested a password reset. Click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #e74c3c; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in <strong>1 hour</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, ignore this email — your password won't change.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy this URL:<br>${resetUrl}</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
