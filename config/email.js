/**
 * @file config/email.js
 * @description Nodemailer transporter configuration
 *              Uses SMTP credentials from environment variables.
 */

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

// Verify connection on startup (non-blocking)
if (process.env.NODE_ENV !== "test") {
  transporter.verify((error) => {
    if (error) {
      console.warn("Email transporter error:", error.message);
    } else {
      console.log("Email transporter ready");
    }
  });
}

module.exports = transporter;
