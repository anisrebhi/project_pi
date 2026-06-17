/**
 * @file utils/qrCodeHelper.js
 * @description Helper to generate QR codes for events.
 *
 * The QR code embeds a JSON payload with the event's public URL and key info,
 * and is returned as a base64 data URL (image/png) so it can be stored in
 * MongoDB and sent directly to any client without a separate file system.
 */

const QRCode = require('qrcode');

/**
 * Build the payload that will be encoded inside the QR code.
 * Keeping it small: only the data a scanner needs to identify / open the event.
 *
 * @param {Object} event  - Mongoose Event document (or plain object)
 * @param {string} baseUrl - e.g. process.env.BASE_URL or process.env.FRONTEND_URL
 * @returns {string} JSON string
 */
const buildQRPayload = (event, baseUrl) => {
  const url = `${baseUrl}/events/${event._id}`;
  return JSON.stringify({
    eventId:   event._id.toString(),
    title:     event.title,
    startDate: event.startDate,
    url,
  });
};

/**
 * Generate a QR code as a base64 PNG data URL.
 *
 * @param {Object} event   - Mongoose Event document
 * @param {string} baseUrl - Base URL for the public event page
 * @returns {Promise<string>} data:image/png;base64,... string
 */
const generateEventQRCode = async (event, baseUrl) => {
  const payload = buildQRPayload(event, baseUrl);

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',   // Medium: good balance size / resilience
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark:  '#000000',
      light: '#ffffff',
    },
  });

  return dataUrl;
};

/**
 * Generate a QR code as a raw PNG Buffer (useful for email attachments, etc.)
 *
 * @param {Object} event
 * @param {string} baseUrl
 * @returns {Promise<Buffer>}
 */
const generateEventQRCodeBuffer = async (event, baseUrl) => {
  const payload = buildQRPayload(event, baseUrl);
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
  });
};

module.exports = {
  generateEventQRCode,
  generateEventQRCodeBuffer,
  buildQRPayload,
};
