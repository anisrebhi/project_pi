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

/**
 * Build the payload encoded inside a reservation's "ticket" QR code.
 * Contains just enough data for an organizer/admin to verify the ticket
 * at the entrance (reservation id, event id, holder, ticket count, status).
 *
 * @param {Object} reservation - Mongoose Reservation document
 * @param {Object} event       - Mongoose Event document (or populated ref)
 * @param {Object} user        - Mongoose User document (or populated ref)
 * @param {string} baseUrl     - Base URL for the verification page
 * @returns {string} JSON string
 */
const buildReservationQRPayload = (reservation, event, user, baseUrl) => {
  const verifyUrl = `${baseUrl}/reservations/${reservation._id}/verify`;
  return JSON.stringify({
    reservationId: reservation._id.toString(),
    eventId: event._id.toString(),
    eventTitle: event.title,
    userId: user._id.toString(),
    numberOfTickets: reservation.numberOfTickets,
    status: reservation.status,
    url: verifyUrl,
  });
};

/**
 * Generate a ticket QR code (base64 PNG data URL) for a confirmed reservation.
 *
 * @param {Object} reservation
 * @param {Object} event
 * @param {Object} user
 * @param {string} baseUrl
 * @returns {Promise<string>} data:image/png;base64,... string
 */
const generateReservationQRCode = async (reservation, event, user, baseUrl) => {
  const payload = buildReservationQRPayload(reservation, event, user, baseUrl);

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};

module.exports = {
  generateEventQRCode,
  generateEventQRCodeBuffer,
  buildQRPayload,
  generateReservationQRCode,
  buildReservationQRPayload,
};
