/**
 * @file utils/emailTemplates.js
 * @description Builders for all transactional emails (reservations + new lot-2 features).
 */

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
};

// ─── Reservation Confirmation ─────────────────────────────────────────────────
const buildReservationConfirmationEmail = ({ reservation, user, event, qrCodeDataUrl }) => {
  const subject = `Confirmation de votre réservation — ${event.title}`;
  const attachments = [];
  let qrImageHtml = '';
  if (qrCodeDataUrl) {
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    attachments.push({ filename: `qrcode-${reservation._id}.png`, content: Buffer.from(base64Data, 'base64'), cid: 'ticket-qrcode', contentType: 'image/png' });
    qrImageHtml = `<p>Présentez ce QR code à l'entrée :</p><img src="cid:ticket-qrcode" width="220" height="220" />`;
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>Réservation confirmée ✅</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>Votre réservation pour <strong>${event.title}</strong> est confirmée.</p>
    <ul>
      <li><strong>Référence :</strong> ${reservation._id}</li>
      <li><strong>Date :</strong> ${formatDate(event.startDate)}</li>
      <li><strong>Billets :</strong> ${reservation.numberOfTickets}</li>
      <li><strong>Montant :</strong> ${reservation.totalPrice > 0 ? reservation.totalPrice + ' DT' : 'Gratuit'}</li>
    </ul>
    ${qrImageHtml}
    <p style="color:#999;font-size:12px">Email automatique — ne pas répondre.</p>
  </div>`;
  const text = `Réservation confirmée pour ${event.title}. Référence: ${reservation._id}.`;
  return { subject, html, text, attachments };
};

<<<<<<< HEAD
=======
// ─── Waitlist Confirmation ────────────────────────────────────────────────────
const buildWaitlistConfirmationEmail = ({ user, event, entry, position }) => {
  const subject = `Inscription sur liste d'attente — ${event.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>📋 Vous êtes sur la liste d'attente</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>L'événement <strong>${event.title}</strong> est complet. Vous êtes en position <strong>#${position}</strong>.</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `Liste d'attente: ${event.title}, position #${position}`, attachments: [] };
};

// ─── Waitlist Promotion ───────────────────────────────────────────────────────
const buildWaitlistPromotionEmail = ({ user, event, reservation }) => {
  const subject = `🎉 Une place est disponible — ${event.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>🎉 Votre place est confirmée !</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>Votre réservation pour <strong>${event.title}</strong> est maintenant confirmée. Réf: ${reservation._id}</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `Place confirmée pour ${event.title}. Réf: ${reservation._id}`, attachments: [] };
};

>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
// ─── Event Reminder ───────────────────────────────────────────────────────────
const buildEventReminderEmail = ({ user, event, reservation }) => {
  const subject = `⏰ Rappel — ${event.title} commence demain`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>⏰ Rappel de participation</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>L'événement <strong>${event.title}</strong> commence demain à ${formatDate(event.startDate)}.</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `Rappel: ${event.title} commence demain.`, attachments: [] };
};

// ─── Event Modified ───────────────────────────────────────────────────────────
const buildEventModifiedEmail = ({ user, event, changes }) => {
  const subject = `📝 Modification — ${event.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>📝 Événement modifié</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>L'événement <strong>${event.title}</strong> a été modifié. Nouvelle date : ${formatDate(event.startDate)}.</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `${event.title} modifié.`, attachments: [] };
};

// ─── Event Cancelled ──────────────────────────────────────────────────────────
const buildEventCancelledEmail = ({ user, event }) => {
  const subject = `❌ Annulation — ${event.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>❌ Événement annulé</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>L'événement <strong>${event.title}</strong> prévu le ${formatDate(event.startDate)} a été annulé.</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `${event.title} annulé.`, attachments: [] };
};

// ─── Certificate Email ────────────────────────────────────────────────────────
const buildCertificateEmail = ({ user, event, verificationCode, pdfBuffer }) => {
  const subject = `🏆 Votre certificat de participation — ${event.title}`;
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">🏆 Certificat de Participation</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:16px;color:#1e293b">Bonjour <strong>${user.fullName || user.email}</strong>,</p>
      <p style="color:#475569">Félicitations ! Vous avez participé à l'événement :</p>
      <div style="background:#ede9fe;border-left:4px solid #6366f1;padding:16px;border-radius:8px;margin:16px 0">
        <h2 style="color:#4338ca;margin:0 0 8px">${event.title}</h2>
        <p style="color:#6366f1;margin:0">📅 ${formatDate(event.startDate)}</p>
      </div>
      <p style="color:#475569">Votre certificat de participation est joint à cet email en PDF.</p>
      <p style="color:#475569">Vous pouvez également le télécharger depuis votre espace personnel.</p>
      <div style="background:#f1f5f9;padding:12px;border-radius:8px;margin:16px 0;font-family:monospace;font-size:12px;color:#64748b">
        Code de vérification : <strong>${verificationCode}</strong>
      </div>
    </div>
    <div style="background:#e2e8f0;padding:16px;text-align:center">
      <p style="color:#94a3b8;font-size:12px;margin:0">Email automatique — EventPass Platform</p>
    </div>
  </div>`;
  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `certificat-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }
  return { subject, html, text: `Certificat de participation pour ${event.title}. Code: ${verificationCode}`, attachments };
};

// ─── New Photos Notification ──────────────────────────────────────────────────
const buildNewPhotosEmail = ({ user, event, count }) => {
  const subject = `📸 Nouvelles photos — ${event.title}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2>📸 La galerie est disponible !</h2>
    <p>Bonjour ${user.fullName || ''},</p>
    <p>${count} nouvelle(s) photo(s) ont été ajoutées à l'événement <strong>${event.title}</strong>.</p>
    <p>Connectez-vous pour les consulter dans la galerie.</p>
    <p style="color:#999;font-size:12px">Email automatique.</p>
  </div>`;
  return { subject, html, text: `${count} nouvelles photos pour ${event.title}.`, attachments: [] };
};

module.exports = {
  buildReservationConfirmationEmail,
<<<<<<< HEAD
=======
  buildWaitlistConfirmationEmail,
  buildWaitlistPromotionEmail,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  buildEventReminderEmail,
  buildEventModifiedEmail,
  buildEventCancelledEmail,
  buildCertificateEmail,
  buildNewPhotosEmail,
  formatDate,
};
