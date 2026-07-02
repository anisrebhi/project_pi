/**
 * @file utils/certificateGenerator.js
 * @description Generates a premium participation certificate PDF with QR code.
 *              Design: dark elegant theme with gold accents and EventPass branding.
 */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

/**
 * @param {Object} params
 * @param {Object} params.user             - { fullName, email }
 * @param {Object} params.event            - { title, startDate, endDate, location, organizer: { fullName } }
 * @param {string} params.verificationCode - Unique certificate ID / verification code
 * @param {Object} [params.options]        - Customization options
 * @param {string} [params.options.primaryColor]  - Hex color for accents (default: #6366f1)
 * @param {string} [params.options.orgName]       - Organization name override
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDF = async ({ user, event, verificationCode, options = {} }) => {
  const primaryColor = options.primaryColor || '#6366f1';
  const orgName      = options.orgName || event.organizer?.fullName || 'EventPass';

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-certificate/${verificationCode}`;

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 180,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const chunks = [];

      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;   // 841.89
      const H = doc.page.height;  // 595.28

      // ── Background layers ──────────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill('#0f172a');
      doc.roundedRect(24, 24, W - 48, H - 48, 12).fill('#1e293b');
      doc.rect(24, 24, 8, H - 48).fill(primaryColor);
      doc.rect(32, 24, W - 56, 6).fill(primaryColor);

      // ── Geometric corner ornaments ─────────────────────────────────────────
      doc.moveTo(32, 60).lineTo(80, 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(32, 60).lineTo(32, 108).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, 60).lineTo(W - 80, 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, 60).lineTo(W - 32, 108).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(32, H - 60).lineTo(80, H - 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(32, H - 60).lineTo(32, H - 108).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, H - 60).lineTo(W - 80, H - 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, H - 60).lineTo(W - 32, H - 108).lineWidth(1.5).strokeColor('#334155').stroke();

      // ── Header section ─────────────────────────────────────────────────────
      const textX = 72;
      const contentW = W - 250;

      doc.fontSize(9)
         .fillColor('#6366f1')
         .font('Helvetica-Bold')
         .text('EVENT PASS', textX, 52, { characterSpacing: 5 });

      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('ATTESTATION OFFICIELLE DE PARTICIPATION', textX, 80, { characterSpacing: 3 });

      doc.fontSize(28)
         .fillColor('#f8fafc')
         .font('Helvetica-Bold')
         .text('Certificat de Participation', textX, 102, { width: contentW - textX });

      doc.moveTo(textX, 148).lineTo(contentW - 20, 148)
         .lineWidth(1).strokeColor('#334155').stroke();
      doc.circle(contentW - 24, 148, 4).fill(primaryColor);

      // ── Body ───────────────────────────────────────────────────────────────
      doc.fontSize(11)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text('Ce certificat atteste que', textX, 165);

      const name = user.fullName || user.email;
      const nameFontSize = name.length > 30 ? 22 : name.length > 20 ? 26 : 30;
      doc.fontSize(nameFontSize)
         .fillColor('#f1f5f9')
         .font('Helvetica-Bold')
         .text(name, textX, 185, { width: contentW - textX - 10 });

      const nameH = doc.heightOfString(name, { fontSize: nameFontSize, width: contentW - textX - 10 });
      doc.moveTo(textX, 185 + nameH + 4).lineTo(textX + Math.min(name.length * (nameFontSize * 0.6), contentW - textX - 40), 185 + nameH + 4)
         .lineWidth(2).strokeColor(primaryColor).stroke();

      const afterNameY = 185 + nameH + 18;

      doc.fontSize(11)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text("a participé à l'événement :", textX, afterNameY);

      const eventTitle = event.title;
      const eventFontSize = eventTitle.length > 50 ? 14 : eventTitle.length > 30 ? 16 : 18;
      doc.fontSize(eventFontSize)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text(eventTitle, textX, afterNameY + 18, { width: contentW - textX - 10 });

      const eventH = doc.heightOfString(eventTitle, { fontSize: eventFontSize, width: contentW - textX - 10 });
      const afterEventY = afterNameY + 18 + eventH + 10;

      const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const start = event.startDate ? formatDate(event.startDate) : '';
      const end   = event.endDate   ? formatDate(event.endDate)   : '';
      let dateStr = '';
      if (start && end && start !== end) dateStr = `Du ${start} au ${end}`;
      else if (start)                    dateStr = `Le ${start}`;

      if (dateStr) {
        doc.fontSize(10)
           .fillColor('#64748b')
           .font('Helvetica')
           .text(`📅  ${dateStr}`, textX, afterEventY);
      }

      if (event.location?.address) {
        doc.fontSize(10)
           .fillColor('#64748b')
           .font('Helvetica')
           .text(`📍  ${event.location.address}`, textX, afterEventY + (dateStr ? 16 : 0), {
             width: contentW - textX - 20,
           });
      }

      // ── Bottom section ─────────────────────────────────────────────────────
      const bottomY = H - 120;

      doc.moveTo(textX, bottomY).lineTo(contentW - 20, bottomY)
         .lineWidth(1).strokeColor('#1e293b').stroke();

      const sigColW = (contentW - textX - 40) / 2;

      doc.fontSize(8)
         .fillColor('#475569')
         .font('Helvetica')
         .text('ORGANISATEUR', textX, bottomY + 12, { characterSpacing: 2 });

      doc.fontSize(13)
         .fillColor('#e2e8f0')
         .font('Helvetica-Bold')
         .text(orgName, textX, bottomY + 26);

      doc.moveTo(textX, bottomY + 65).lineTo(textX + sigColW, bottomY + 65)
         .lineWidth(1).strokeColor('#334155').stroke();
      doc.fontSize(8)
         .fillColor('#334155')
         .font('Helvetica')
         .text('Signature & Cachet', textX, bottomY + 70);

      const midX = textX + sigColW + 20;
      doc.fontSize(8)
         .fillColor('#475569')
         .font('Helvetica')
         .text('CODE DE VÉRIFICATION', midX, bottomY + 12, { characterSpacing: 2, width: sigColW });

      doc.fontSize(9)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text(verificationCode, midX, bottomY + 26, { width: sigColW, lineBreak: false });

      // ── Footer strip ───────────────────────────────────────────────────────
      doc.rect(32, H - 38, W - 56, 8).fill(primaryColor);

      doc.fontSize(7.5)
         .fillColor('#475569')
         .font('Helvetica')
         .text(
           `Document généré le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })} — Vérifiable sur EventPass Platform`,
           textX, H - 48, { width: contentW - textX }
         );

      // ── Right panel: QR Code ───────────────────────────────────────────────
      const qrPanelX = contentW + 10;
      const qrPanelW = W - contentW - 40;
      const qrPanelH = H - 60;

      doc.roundedRect(qrPanelX - 8, 30, qrPanelW + 8, qrPanelH - 4, 8)
         .fill('#0f172a');

      doc.fontSize(8)
         .fillColor('#6366f1')
         .font('Helvetica-Bold')
         .text('SCANNER POUR VÉRIFIER', qrPanelX, 48, { width: qrPanelW, align: 'center', characterSpacing: 1 });

      const qrSize = Math.min(qrPanelW - 16, 140);
      const qrX    = qrPanelX + (qrPanelW - qrSize) / 2;
      const qrY    = 70;

      doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).fill('#ffffff');
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      doc.fontSize(7)
         .fillColor('#475569')
         .font('Helvetica')
         .text('eventpass.local', qrPanelX, qrY + qrSize + 16, { width: qrPanelW, align: 'center' });

      const badgeY = qrY + qrSize + 32;
      doc.roundedRect(qrPanelX, badgeY, qrPanelW, 28, 6)
         .fill('rgba(99,102,241,0.15)');

      doc.fontSize(8)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text('✓  AUTHENTICITÉ GARANTIE', qrPanelX, badgeY + 8, { width: qrPanelW, align: 'center' });

      const codeShort = verificationCode.substring(0, 8) + '...';
      doc.fontSize(7.5)
         .fillColor('#334155')
         .font('Helvetica')
         .text(codeShort, qrPanelX, badgeY + 42, { width: qrPanelW, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };
