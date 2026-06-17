/**
 * @file utils/pdfGenerator.js
 * @description Generates a downloadable PDF "ticket" for a confirmed reservation,
 *              embedding the ticket QR code and the key reservation/event details.
 */

const PDFDocument = require('pdfkit');
const { formatDate } = require('./emailTemplates');

/**
 * Generate a reservation ticket as a PDF buffer.
 *
 * @param {Object} params
 * @param {Object} params.reservation - Reservation document
 * @param {Object} params.user        - User document (ticket holder)
 * @param {Object} params.event       - Event document
 * @param {string} [params.qrCodeDataUrl] - data:image/png;base64,... ticket QR code
 * @returns {Promise<Buffer>}
 */
const generateReservationTicketPDF = ({ reservation, user, event, qrCodeDataUrl }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ─── Header ────────────────────────────────────────────────────────────
      doc
        .fontSize(20)
        .fillColor('#1a1a1a')
        .text('Billet de réservation', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .fillColor('#333333')
        .text(event.title, { align: 'center' })
        .moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1);

      // ─── Reservation details ───────────────────────────────────────────────
      doc.fontSize(12).fillColor('#000000');

      const rows = [
        ['Référence de réservation', String(reservation._id)],
        ['Titulaire', user.fullName || user.email || 'N/A'],
        ['Email', user.email || 'N/A'],
        ['Événement', event.title],
        ['Date de début', formatDate(event.startDate)],
        ['Date de fin', formatDate(event.endDate)],
        ['Lieu', event.location?.address || 'N/A'],
        ['Nombre de billets', String(reservation.numberOfTickets)],
        ['Montant total', `${reservation.totalPrice} ${reservation.totalPrice > 0 ? '' : '(Gratuit)'}`],
        ['Statut', reservation.status],
      ];

      rows.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value);
      });

      doc.moveDown(1.5);

      // ─── QR Code ────────────────────────────────────────────────────────────
      if (qrCodeDataUrl) {
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text("Présentez ce QR code à l'entrée :", { align: 'center' })
          .moveDown(0.5);

        const qrSize = 200;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const x = doc.page.margins.left + (pageWidth - qrSize) / 2;
        doc.image(qrBuffer, x, doc.y, { width: qrSize, height: qrSize });
        doc.moveDown(qrSize / doc.currentLineHeight() + 1);
      }

      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          "Ce billet est personnel et ne peut être transféré. " +
          "Veuillez le présenter (numérique ou imprimé) à l'entrée de l'événement.",
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReservationTicketPDF };
