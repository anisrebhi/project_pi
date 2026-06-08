/**
 * @file services/emailService.js
 * @description Email sending service — verification, QR code tickets, reminders.
 */

const QRCode = require("qrcode");
const transporter = require("../config/email");

// ─── Verification Email ───────────────────────────────────────────────────────

/**
 * Send email verification link to newly registered user
 * @param {Object} user - User document
 * @param {string} token - Raw email verify token
 */
const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString("fr-FR");

  await transporter.sendMail({
    from: `"Event Management" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Confirmez votre adresse email",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1a1a2e">Bienvenue, ${user.fullName} !</h2>
        <p>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
        <p><strong>Ce lien expire le ${expiresAt}.</strong></p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#6d28d9;color:#fff;
                  border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Vérifier mon email
        </a>
        <p style="color:#666;font-size:13px">
          Si vous n'avez pas créé de compte, ignorez cet email.
        </p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">Event Management Platform</p>
      </div>
    `,
  });
};

// ─── QR Code Ticket Email ─────────────────────────────────────────────────────

/**
 * Generate QR code image and send as email attachment
 * @param {Object} user - User document
 * @param {Object} event - Event document
 * @param {string} qrToken - The signed JWT token to encode in QR
 */
const sendQRCodeEmail = async (user, event, qrToken) => {
  const eventDate = new Date(event.date).toLocaleString("fr-FR");

  // Encode the token as JSON payload in the QR code
  const qrPayload = JSON.stringify({ qrToken });
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    width: 300,
    margin: 2,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  await transporter.sendMail({
    from: `"Event Management" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `🎫 Votre billet — ${event.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1a1a2e">Inscription confirmée !</h2>
        <p>Bonjour <strong>${user.fullName}</strong>,</p>
        <p>Votre inscription à l'événement suivant est confirmée :</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Événement</td>
            <td style="padding:8px">${event.title}</td>
          </tr>
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Date</td>
            <td style="padding:8px">${eventDate}</td>
          </tr>
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Lieu</td>
            <td style="padding:8px">${event.location}</td>
          </tr>
        </table>
        <p><strong>Présentez ce QR code à l'entrée :</strong></p>
        <img src="cid:qrcode" alt="QR Code d'accès" style="display:block;margin:16px 0"/>
        <p style="color:#d97706;font-size:13px">⚠️ Ce QR code est à usage unique et personnel.</p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">Event Management Platform</p>
      </div>
    `,
    attachments: [
      {
        filename: "billet-qr.png",
        content: qrBuffer,
        cid: "qrcode", // referenced as cid:qrcode in HTML
      },
    ],
  });
};

// ─── Reminder Email ───────────────────────────────────────────────────────────

/**
 * Send 24h-before reminder to a registered participant
 * @param {Object} user - User document
 * @param {Object} event - Event document
 */
const sendReminderEmail = async (user, event) => {
  const eventDate = new Date(event.date).toLocaleString("fr-FR");

  await transporter.sendMail({
    from: `"Event Management" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `⏰ Rappel — ${event.title} demain`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1a1a2e">N'oubliez pas !</h2>
        <p>Bonjour <strong>${user.fullName}</strong>,</p>
        <p>Nous vous rappelons que vous êtes inscrit(e) à :</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <strong>${event.title}</strong><br>
          📅 ${eventDate}<br>
          📍 ${event.location}
        </div>
        <p>Pensez à avoir votre QR code prêt. Bon événement !</p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">Event Management Platform</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendQRCodeEmail, sendReminderEmail };
