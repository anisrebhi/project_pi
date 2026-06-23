/**
 * @file utils/certificateGenerator.js
 * @description Generates a professional participation certificate PDF with QR code.
 */

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');

/**
 * @param {Object} params
 * @param {Object} params.user             - { fullName, email }
 * @param {Object} params.event            - { title, startDate, endDate, location, organizer: { fullName } }
 * @param {string} params.verificationCode - Unique certificate ID / verification code
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDF = async ({ user, event, verificationCode }) => {
  // Pre-generate the QR code as a PNG buffer
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-certificate/${verificationCode}`;
  const qrBuffer  = await QRCode.toBuffer(verifyUrl, { width: 160, margin: 1 });

  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
      const chunks = [];

      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;   // 841.89
      const H = doc.page.height;  // 595.28

      // ─── Background gradient-like rectangles ──────────────────────────────
      doc.rect(0, 0, W, H).fill('#0f172a');
      doc.rect(20, 20, W - 40, H - 40).fill('#1e293b');

      // ─── Decorative borders ───────────────────────────────────────────────
      doc.rect(30, 30, W - 60, H - 60)
         .lineWidth(3)
         .strokeColor('#6366f1')
         .stroke();
      doc.rect(35, 35, W - 70, H - 70)
         .lineWidth(1)
         .strokeColor('#818cf8')
         .stroke();

      // ─── Accent top bar ───────────────────────────────────────────────────
      doc.rect(30, 30, W - 60, 8).fill('#6366f1');

      // ─── Header ───────────────────────────────────────────────────────────
      doc.fontSize(13)
         .fillColor('#a5b4fc')
         .font('Helvetica')
         .text('EVENT PASS', 0, 60, { align: 'center', characterSpacing: 8 });

      doc.fontSize(30)
         .fillColor('#f8fafc')
         .font('Helvetica-Bold')
         .text('CERTIFICAT DE PARTICIPATION', 0, 90, { align: 'center', characterSpacing: 2 });

      // ─── Divider ──────────────────────────────────────────────────────────
      const lineY = 145;
      doc.moveTo(100, lineY).lineTo(W - 100, lineY).lineWidth(1.5).strokeColor('#6366f1').stroke();

      // ─── Body text ────────────────────────────────────────────────────────
      doc.fontSize(13)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text('Ce certificat atteste que', 0, 165, { align: 'center' });

      // Participant name
      doc.fontSize(28)
         .fillColor('#f1f5f9')
         .font('Helvetica-Bold')
         .text(user.fullName || user.email, 0, 190, { align: 'center' });

      doc.fontSize(13)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text('a participé à l\'événement', 0, 230, { align: 'center' });

      // Event name
      doc.fontSize(20)
         .fillColor('#818cf8')
         .font('Helvetica-Bold')
         .text(event.title, 0, 255, { align: 'center' });

      // Dates
      const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      const dateStr = event.startDate === event.endDate
        ? `Le ${formatDate(event.startDate)}`
        : `Du ${formatDate(event.startDate)} au ${formatDate(event.endDate)}`;

      doc.fontSize(12)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text(dateStr, 0, 290, { align: 'center' });

      if (event.location?.address) {
        doc.fontSize(11)
           .fillColor('#64748b')
           .text(`📍 ${event.location.address}`, 0, 312, { align: 'center' });
      }

      // ─── Divider 2 ────────────────────────────────────────────────────────
      doc.moveTo(100, 340).lineTo(W - 100, 340).lineWidth(1).strokeColor('#334155').stroke();

      // ─── Organizer section (left) ─────────────────────────────────────────
      const sigX = 120;
      const sigY = 360;
      const orgName = event.organizer?.fullName || 'Organisateur';

      doc.fontSize(10)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('ORGANISATEUR', sigX, sigY, { characterSpacing: 2 });

      doc.fontSize(14)
         .fillColor('#f1f5f9')
         .font('Helvetica-Bold')
         .text(orgName, sigX, sigY + 18);

      // Signature line
      doc.moveTo(sigX, sigY + 70).lineTo(sigX + 200, sigY + 70)
         .lineWidth(1).strokeColor('#475569').stroke();
      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Signature & cachet', sigX, sigY + 75);

      // ─── Verification code (center) ────────────────────────────────────────
      const codeX = W / 2 - 100;
      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('CODE DE VÉRIFICATION', codeX, sigY, { characterSpacing: 2, width: 200, align: 'center' });

      doc.fontSize(10)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text(verificationCode, codeX, sigY + 18, { width: 200, align: 'center' });

      // ─── QR Code (right) ──────────────────────────────────────────────────
      const qrX = W - 220;
      const qrY = sigY - 10;
      doc.image(qrBuffer, qrX, qrY, { width: 100, height: 100 });
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('Scanner pour vérifier', qrX - 10, qrY + 104, { width: 120, align: 'center' });

      // ─── Footer ───────────────────────────────────────────────────────────
      doc.rect(30, H - 38, W - 60, 8).fill('#6366f1');
      doc.fontSize(8)
         .fillColor('#475569')
         .font('Helvetica')
         .text(
           `Certificat généré le ${new Date().toLocaleDateString('fr-FR')} — EventPass Platform`,
           0, H - 48, { align: 'center' }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };
