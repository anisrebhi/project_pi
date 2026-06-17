/**
 * @file utils/emailTemplates.js
 * @description Builders for transactional email content related to reservations.
 */

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
};

/**
 * Build the subject/html/text/attachments for a reservation confirmation email.
 * The ticket QR code (if provided as a base64 data URL) is attached as an
 * inline image referenced via `cid:ticket-qrcode`.
 *
 * @param {Object} params
 * @param {Object} params.reservation - Reservation document
 * @param {Object} params.user        - User document (recipient)
 * @param {Object} params.event       - Event document
 * @param {string} [params.qrCodeDataUrl] - data:image/png;base64,... ticket QR code
 * @returns {{ subject: string, html: string, text: string, attachments: Array }}
 */
const buildReservationConfirmationEmail = ({ reservation, user, event, qrCodeDataUrl }) => {
  const subject = `Confirmation de votre réservation — ${event.title}`;

  const locationLine = event.location?.address
    ? `<p><strong>Lieu :</strong> ${event.location.address}</p>`
    : '';

  const attachments = [];
  let qrImageHtml = '';

  if (qrCodeDataUrl) {
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    attachments.push({
      filename: `qrcode-${reservation._id}.png`,
      content: Buffer.from(base64Data, 'base64'),
      cid: 'ticket-qrcode',
      contentType: 'image/png',
    });
    qrImageHtml = `
      <p>Présentez ce QR code à l'entrée de l'événement :</p>
      <img src="cid:ticket-qrcode" alt="QR code de la réservation" width="220" height="220" />
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Réservation confirmée ✅</h2>
      <p>Bonjour ${user.fullName || ''},</p>
      <p>Votre réservation pour l'événement <strong>${event.title}</strong> a bien été confirmée.</p>

      <h3>Détails de la réservation</h3>
      <ul>
        <li><strong>Référence :</strong> ${reservation._id}</li>
        <li><strong>Événement :</strong> ${event.title}</li>
        <li><strong>Date de début :</strong> ${formatDate(event.startDate)}</li>
        <li><strong>Date de fin :</strong> ${formatDate(event.endDate)}</li>
        <li><strong>Nombre de billets :</strong> ${reservation.numberOfTickets}</li>
        <li><strong>Montant total :</strong> ${reservation.totalPrice} ${reservation.totalPrice > 0 ? '' : '(Gratuit)'}</li>
        <li><strong>Statut :</strong> ${reservation.status}</li>
      </ul>
      ${locationLine}
      ${qrImageHtml}

      <p style="margin-top: 24px; color: #555;">
        Vous pouvez également télécharger votre billet au format PDF (incluant ce QR code)
        depuis votre espace personnel.
      </p>
      <p style="color: #999; font-size: 12px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  `;

  const text = [
    `Réservation confirmée pour : ${event.title}`,
    `Référence: ${reservation._id}`,
    `Date de début: ${formatDate(event.startDate)}`,
    `Date de fin: ${formatDate(event.endDate)}`,
    `Nombre de billets: ${reservation.numberOfTickets}`,
    `Montant total: ${reservation.totalPrice}`,
    `Statut: ${reservation.status}`,
  ].join('\n');

  return { subject, html, text, attachments };
};

module.exports = { buildReservationConfirmationEmail, formatDate };
