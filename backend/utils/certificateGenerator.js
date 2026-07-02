/**
 * @file utils/certificateGenerator.js
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
 * @description Generates a premium participation certificate PDF with QR code.
 *              Design: dark elegant theme with gold accents and EventPass branding.
 */
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
<<<<<<< HEAD
=======
=======
 * @description Generates a professional participation certificate PDF with QR code.
 */

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851

/**
 * @param {Object} params
 * @param {Object} params.user             - { fullName, email }
 * @param {Object} params.event            - { title, startDate, endDate, location, organizer: { fullName } }
 * @param {string} params.verificationCode - Unique certificate ID / verification code
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
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
<<<<<<< HEAD
=======
=======
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDF = async ({ user, event, verificationCode }) => {
  // Pre-generate the QR code as a PNG buffer
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-certificate/${verificationCode}`;
  const qrBuffer  = await QRCode.toBuffer(verifyUrl, { width: 160, margin: 1 });

  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      const chunks = [];

      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;   // 841.89
      const H = doc.page.height;  // 595.28

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      // ── Background layers ──────────────────────────────────────────────────
      // Main dark background
      doc.rect(0, 0, W, H).fill('#0f172a');

      // Subtle inner card
      doc.roundedRect(24, 24, W - 48, H - 48, 12).fill('#1e293b');

      // ── Left accent stripe ─────────────────────────────────────────────────
      doc.rect(24, 24, 8, H - 48).fill(primaryColor);

      // ── Top decorative border ──────────────────────────────────────────────
      doc.rect(32, 24, W - 56, 6).fill(primaryColor);

      // ── Geometric corner ornaments ─────────────────────────────────────────
      // Top-left
      doc.moveTo(32, 60).lineTo(80, 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(32, 60).lineTo(32, 108).lineWidth(1.5).strokeColor('#334155').stroke();
      // Top-right
      doc.moveTo(W - 32, 60).lineTo(W - 80, 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, 60).lineTo(W - 32, 108).lineWidth(1.5).strokeColor('#334155').stroke();
      // Bottom-left
      doc.moveTo(32, H - 60).lineTo(80, H - 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(32, H - 60).lineTo(32, H - 108).lineWidth(1.5).strokeColor('#334155').stroke();
      // Bottom-right
      doc.moveTo(W - 32, H - 60).lineTo(W - 80, H - 60).lineWidth(1.5).strokeColor('#334155').stroke();
      doc.moveTo(W - 32, H - 60).lineTo(W - 32, H - 108).lineWidth(1.5).strokeColor('#334155').stroke();

      // ── Header section ─────────────────────────────────────────────────────
      const textX = 72;
      const contentW = W - 250; // leave right panel for QR

      // Organization brand (top-left)
      doc.fontSize(9)
         .fillColor('#6366f1')
         .font('Helvetica-Bold')
         .text('EVENT PASS', textX, 52, { characterSpacing: 5 });

      // Certificate title
      doc.fontSize(9)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('ATTESTATION OFFICIELLE DE PARTICIPATION', textX, 80, { characterSpacing: 3 });

      // ── Main title ─────────────────────────────────────────────────────────
      doc.fontSize(28)
         .fillColor('#f8fafc')
         .font('Helvetica-Bold')
         .text('Certificat de Participation', textX, 102, { width: contentW - textX });

      // ── Divider ────────────────────────────────────────────────────────────
      doc.moveTo(textX, 148).lineTo(contentW - 20, 148)
         .lineWidth(1).strokeColor('#334155').stroke();

      // Gold accent dot
      doc.circle(contentW - 24, 148, 4).fill(primaryColor);

      // ── Body ───────────────────────────────────────────────────────────────
      doc.fontSize(11)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text('Ce certificat atteste que', textX, 165);

      // Participant name — large and prominent
      const name = user.fullName || user.email;
      const nameFontSize = name.length > 30 ? 22 : name.length > 20 ? 26 : 30;
      doc.fontSize(nameFontSize)
         .fillColor('#f1f5f9')
         .font('Helvetica-Bold')
         .text(name, textX, 185, { width: contentW - textX - 10 });

      const nameH = doc.heightOfString(name, { fontSize: nameFontSize, width: contentW - textX - 10 });

      // Underline for name
      doc.moveTo(textX, 185 + nameH + 4).lineTo(textX + Math.min(name.length * (nameFontSize * 0.6), contentW - textX - 40), 185 + nameH + 4)
         .lineWidth(2).strokeColor(primaryColor).stroke();

      const afterNameY = 185 + nameH + 18;

      doc.fontSize(11)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text("a participé à l'événement :", textX, afterNameY);

      // Event title
      const eventTitle = event.title;
      const eventFontSize = eventTitle.length > 50 ? 14 : eventTitle.length > 30 ? 16 : 18;
      doc.fontSize(eventFontSize)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text(eventTitle, textX, afterNameY + 18, { width: contentW - textX - 10 });

      const eventH = doc.heightOfString(eventTitle, { fontSize: eventFontSize, width: contentW - textX - 10 });
      const afterEventY = afterNameY + 18 + eventH + 10;

      // ── Event details row ──────────────────────────────────────────────────
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

      // Organizer signature area
      const sigColW = (contentW - textX - 40) / 2;

      // Left: Organizer
      doc.fontSize(8)
         .fillColor('#475569')
         .font('Helvetica')
         .text('ORGANISATEUR', textX, bottomY + 12, { characterSpacing: 2 });

      doc.fontSize(13)
         .fillColor('#e2e8f0')
         .font('Helvetica-Bold')
         .text(orgName, textX, bottomY + 26);

      // Signature line
      doc.moveTo(textX, bottomY + 65).lineTo(textX + sigColW, bottomY + 65)
         .lineWidth(1).strokeColor('#334155').stroke();

      doc.fontSize(8)
         .fillColor('#334155')
         .font('Helvetica')
         .text('Signature & Cachet', textX, bottomY + 70);

      // Middle: Verification code
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

      // QR panel background
      doc.roundedRect(qrPanelX - 8, 30, qrPanelW + 8, qrPanelH - 4, 8)
         .fill('#0f172a');

      // QR label
      doc.fontSize(8)
         .fillColor('#6366f1')
         .font('Helvetica-Bold')
         .text('SCANNER POUR VÉRIFIER', qrPanelX, 48, { width: qrPanelW, align: 'center', characterSpacing: 1 });

      // QR image — centered in right panel
      const qrSize = Math.min(qrPanelW - 16, 140);
      const qrX    = qrPanelX + (qrPanelW - qrSize) / 2;
      const qrY    = 70;

      // White background behind QR
      doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12).fill('#ffffff');
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // URL hint below QR
      doc.fontSize(7)
         .fillColor('#475569')
         .font('Helvetica')
         .text('eventpass.local', qrPanelX, qrY + qrSize + 16, { width: qrPanelW, align: 'center' });

      // Verify badge
      const badgeY = qrY + qrSize + 32;
      doc.roundedRect(qrPanelX, badgeY, qrPanelW, 28, 6)
         .fill('rgba(99,102,241,0.15)');

      doc.fontSize(8)
         .fillColor('#a5b4fc')
         .font('Helvetica-Bold')
         .text('✓  AUTHENTICITÉ GARANTIE', qrPanelX, badgeY + 8, { width: qrPanelW, align: 'center' });

      // Unique code at bottom of QR panel
      const codeShort = verificationCode.substring(0, 8) + '...';
      doc.fontSize(7.5)
         .fillColor('#334155')
         .font('Helvetica')
         .text(codeShort, qrPanelX, badgeY + 42, { width: qrPanelW, align: 'center' });

<<<<<<< HEAD
=======
=======
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

>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };
