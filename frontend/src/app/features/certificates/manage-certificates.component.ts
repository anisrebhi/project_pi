import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule }           from '@angular/router';
import { CertificateService }     from '../../core/services/certificate.service';
import { Certificate }            from '../../core/models/lot2.models';

@Component({
  selector: 'app-manage-certificates',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  template: `
<div class="mgmt-section">
  <!-- Header -->
  <div class="mgmt-header">
    <div class="mgmt-title-area">
      <div class="mgmt-icon">
        <span class="material-icons">workspace_premium</span>
      </div>
      <div>
        <h3>Gestion des Certificats</h3>
        <p class="mgmt-sub">Gérez les certificats de participation des participants confirmés.</p>
      </div>
    </div>
    <div class="mgmt-actions">
      <button class="btn btn-outline btn-sm" (click)="load()" [disabled]="loading()" title="Rafraîchir">
        <span class="material-icons" [class.spinning]="loading()">refresh</span>
      </button>
      <button class="btn btn-secondary btn-sm" (click)="initializeAll()" [disabled]="initializing() || loading()">
        <span class="spinner spinner-sm" *ngIf="initializing()"></span>
        <span class="material-icons" *ngIf="!initializing()">add_circle</span>
        Initialiser tous
      </button>
      <button *ngIf="hasPending()" class="btn btn-primary btn-sm" (click)="bulkValidateAll()" [disabled]="bulkActing()">
        <span class="spinner spinner-sm" *ngIf="bulkActing() === 'validate'"></span>
        <span class="material-icons" *ngIf="bulkActing() !== 'validate'">verified</span>
        Valider tous
      </button>
      <button *ngIf="hasValidated()" class="btn btn-success btn-sm" (click)="bulkSendAll()" [disabled]="bulkActing()">
        <span class="spinner spinner-sm" *ngIf="bulkActing() === 'send'"></span>
        <span class="material-icons" *ngIf="bulkActing() !== 'send'">send</span>
        Envoyer tous
      </button>
    </div>
  </div>

  <!-- Stats -->
  <div class="cert-stats" *ngIf="stats()">
    <div class="cert-stat-pill total">
      <span class="cert-stat-count">{{ stats()!.total }}</span>
      <span class="cert-stat-name">Total</span>
    </div>
    <div class="cert-stat-pill pending">
      <span class="cert-stat-count">{{ stats()!.pending }}</span>
      <span class="cert-stat-name">En attente</span>
    </div>
    <div class="cert-stat-pill validated">
      <span class="cert-stat-count">{{ stats()!.validated }}</span>
      <span class="cert-stat-name">Validés</span>
    </div>
    <div class="cert-stat-pill sent">
      <span class="cert-stat-count">{{ stats()!.sent }}</span>
      <span class="cert-stat-name">Envoyés</span>
    </div>
    <div class="cert-stat-pill downloaded">
      <span class="cert-stat-count">{{ stats()!.downloaded }}</span>
      <span class="cert-stat-name">Téléchargés</span>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading-state" *ngIf="loading()">
    <div class="spinner spinner-md spinner-dark"></div>
  </div>

  <!-- Toast -->
  <div *ngIf="toast()" class="mgmt-toast" [class.mgmt-toast-error]="toast()!.type === 'error'">
    <span class="material-icons">{{ toast()!.type === 'success' ? 'check_circle' : 'error' }}</span>
    {{ toast()!.msg }}
  </div>

  <!-- Empty state -->
  <div class="mgmt-empty" *ngIf="!loading() && certs().length === 0">
    <span class="material-icons">workspace_premium</span>
    <p>Aucun certificat encore créé.</p>
    <span class="mgmt-empty-hint">Cliquez « Initialiser tous » pour créer les certificats de tous les participants confirmés.</span>
  </div>

  <!-- Table -->
  <div class="table-wrap" *ngIf="!loading() && certs().length > 0">
    <table>
      <thead>
        <tr>
          <th>Participant</th>
          <th>Statut</th>
          <th>Émis</th>
          <th>Dernière action</th>
          <th>Téléchargements</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let cert of certs()">
          <td>
            <div class="cert-user-cell">
              <div class="cert-avatar-sm">{{ initial(cert) }}</div>
              <div class="cert-user-info">
                <span class="cert-user-name">{{ name(cert) }}</span>
                <span class="cert-user-email">{{ email(cert) }}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="cert-status-pill cert-status-{{ cert.status }}">
              <span class="material-icons">{{ statusIcon(cert.status) }}</span>
              {{ statusLabel(cert.status) }}
            </span>
          </td>
          <td class="cell-muted">{{ cert.issuedAt | date:'dd/MM/yy' }}</td>
          <td class="cell-muted">{{ lastAction(cert) }}</td>
          <td class="cell-center">
            <span class="dl-count" *ngIf="cert.downloadCount">
              <span class="material-icons">download</span> {{ cert.downloadCount }}
            </span>
            <span class="cell-muted" *ngIf="!cert.downloadCount">—</span>
          </td>
          <td>
            <div class="cert-row-actions">
              <!-- Validate -->
              <button *ngIf="cert.status === 'pending'"
                      class="btn btn-primary btn-xs"
                      (click)="validate(cert)"
                      [disabled]="acting() === cert._id"
                      title="Valider">
                <span class="spinner spinner-sm" *ngIf="acting() === cert._id"></span>
                <span class="material-icons" *ngIf="acting() !== cert._id">verified</span>
                Valider
              </button>

              <!-- Send email -->
              <button *ngIf="cert.status === 'validated'"
                      class="btn btn-success btn-xs"
                      (click)="send(cert)"
                      [disabled]="acting() === cert._id"
                      title="Envoyer par email">
                <span class="spinner spinner-sm" *ngIf="acting() === cert._id"></span>
                <span class="material-icons" *ngIf="acting() !== cert._id">send</span>
                Envoyer
              </button>

              <!-- Resend (if already sent) -->
              <button *ngIf="cert.status === 'sent' || cert.status === 'downloaded'"
                      class="btn btn-outline btn-xs"
                      (click)="send(cert)"
                      [disabled]="acting() === cert._id"
                      title="Renvoyer l'email">
                <span class="spinner spinner-sm" *ngIf="acting() === cert._id"></span>
                <span class="material-icons" *ngIf="acting() !== cert._id">forward_to_inbox</span>
                Renvoyer
              </button>

              <!-- Download PDF -->
              <button *ngIf="cert.status !== 'pending'"
                      class="btn btn-secondary btn-xs"
                      (click)="download(cert)"
                      [disabled]="acting() === cert._id"
                      title="Télécharger PDF">
                <span class="material-icons">download</span>
              </button>

              <!-- Verify link -->
              <a *ngIf="cert.status !== 'pending'"
                 [routerLink]="['/verify-certificate', cert.verificationCode]"
                 target="_blank"
                 class="btn btn-ghost btn-xs"
                 title="Vérifier authenticité">
                <span class="material-icons">qr_code_scanner</span>
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .mgmt-section {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-line);
      padding: var(--space-6);
      margin-top: var(--space-6);
    }
    .mgmt-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-5);
    }
    .mgmt-title-area { display: flex; align-items: flex-start; gap: var(--space-3); }
    .mgmt-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md); flex-shrink: 0;
      background: linear-gradient(135deg, var(--brand-100), var(--brand-200));
      display: flex; align-items: center; justify-content: center;
    }
    :host-context(.dark) .mgmt-icon { background: rgba(99,102,241,.15); }
    .mgmt-icon .material-icons { font-size: 20px; color: var(--brand-600); }
    :host-context(.dark) .mgmt-icon .material-icons { color: var(--brand-400); }
    .mgmt-title-area h3 { font-size: .95rem; font-weight: 700; color: var(--color-ink); margin: 0 0 2px; }
    .mgmt-sub { font-size: .78rem; color: var(--color-muted); margin: 0; }
    .mgmt-actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin .7s linear infinite; }

    /* Stats */
    .cert-stats { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap; }
    .cert-stat-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .72rem; font-weight: 600; border: 1px solid;
      min-width: 64px;
    }
    .cert-stat-count { font-size: 1.15rem; font-weight: 800; line-height: 1.2; }
    .cert-stat-name { font-size: .65rem; text-transform: uppercase; letter-spacing: .05em; }
    .cert-stat-pill.total     { background: var(--gray-50); border-color: var(--color-line); color: var(--color-ink); }
    .cert-stat-pill.pending   { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.2); color: #d97706; }
    .cert-stat-pill.validated { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.2); color: #2563eb; }
    .cert-stat-pill.sent      { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.2); color: #059669; }
    .cert-stat-pill.downloaded{ background: rgba(139,92,246,.08); border-color: rgba(139,92,246,.2); color: #7c3aed; }
    :host-context(.dark) .cert-stat-pill.total     { background: var(--dark-surface-2); }
    :host-context(.dark) .cert-stat-pill.pending   { color: #fbbf24; }
    :host-context(.dark) .cert-stat-pill.validated { color: #93c5fd; }
    :host-context(.dark) .cert-stat-pill.sent      { color: #34d399; }
    :host-context(.dark) .cert-stat-pill.downloaded{ color: #c4b5fd; }

    /* Toast */
    .mgmt-toast {
      display: flex; align-items: center; gap: var(--space-2);
      background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2);
      color: #065f46; border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4); font-size: .875rem;
      margin-bottom: var(--space-4); animation: fadeUp .25s ease;
    }
    .mgmt-toast-error {
      background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); color: #dc2626;
    }
    :host-context(.dark) .mgmt-toast { color: #34d399; }
    :host-context(.dark) .mgmt-toast-error { color: #f87171; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
    .mgmt-toast .material-icons { font-size: 16px; }

    /* Empty */
    .mgmt-empty {
      text-align: center; padding: var(--space-8) var(--space-4);
      color: var(--color-muted); display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
    }
    .mgmt-empty .material-icons { font-size: 36px; color: var(--gray-300); }
    .mgmt-empty p { font-size: .9rem; margin: 0; }
    .mgmt-empty-hint { font-size: .75rem; }

    /* Table */
    .cert-user-cell { display: flex; align-items: center; gap: var(--space-2); }
    .cert-avatar-sm {
      width: 30px; height: 30px; border-radius: 50%; background: var(--color-primary);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .8rem; flex-shrink: 0;
    }
    .cert-user-info { display: flex; flex-direction: column; gap: 1px; }
    .cert-user-name { font-size: .8rem; font-weight: 600; color: var(--color-ink); }
    .cert-user-email { font-size: .7rem; color: var(--color-muted); }

    /* Status pill */
    .cert-status-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: .2rem .6rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 700; letter-spacing: .03em;
      white-space: nowrap;
    }
    .cert-status-pill .material-icons { font-size: 12px; }
    .cert-status-pending    { background: rgba(245,158,11,.12); color: #d97706; }
    .cert-status-validated  { background: rgba(59,130,246,.12); color: #2563eb; }
    .cert-status-sent       { background: rgba(16,185,129,.12); color: #059669; }
    .cert-status-downloaded { background: rgba(139,92,246,.12); color: #7c3aed; }
    :host-context(.dark) .cert-status-pending    { color: #fbbf24; }
    :host-context(.dark) .cert-status-validated  { color: #93c5fd; }
    :host-context(.dark) .cert-status-sent       { color: #34d399; }
    :host-context(.dark) .cert-status-downloaded { color: #c4b5fd; }

    .cell-muted { font-size: .78rem; color: var(--color-muted); }
    .cell-center { text-align: center; }
    .dl-count {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: .72rem; color: var(--color-muted);
    }
    .dl-count .material-icons { font-size: 12px; }

    /* Actions */
    .cert-row-actions { display: flex; gap: var(--space-1); align-items: center; flex-wrap: wrap; }
    .btn-xs {
      padding: .2rem .55rem; font-size: .72rem; gap: 3px;
      display: inline-flex; align-items: center;
    }
    .btn-xs .material-icons { font-size: 13px; }
    .btn-ghost {
      background: transparent; border: 1px solid var(--color-line);
      color: var(--color-muted); border-radius: var(--radius-sm);
    }
    .btn-ghost:hover { background: var(--color-bg-subtle); color: var(--color-ink); }
    .btn-outline {
      background: transparent; border: 1px solid var(--color-line);
      color: var(--color-ink); border-radius: var(--radius-sm);
    }
    .btn-outline:hover { background: var(--color-bg-subtle); }
  `],
})
export class ManageCertificatesComponent implements OnInit {
  @Input() eventId!: string;

  certs        = signal<Certificate[]>([]);
  stats        = signal<any>(null);
  loading      = signal(true);
  initializing = signal(false);
  bulkActing   = signal<string|null>(null);
  acting       = signal<string|null>(null);
  toast        = signal<{ msg: string; type: 'success'|'error' } | null>(null);

  constructor(private certService: CertificateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.certService.getEventCertificates(this.eventId).subscribe({
      next: (res) => {
        this.certs.set(res.data?.certificates || []);
        this.stats.set(res.data?.stats || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  hasPending():   boolean { return this.certs().some(c => c.status === 'pending'); }
  hasValidated(): boolean { return this.certs().some(c => c.status === 'validated'); }

  initializeAll(): void {
    this.initializing.set(true);
    this.certService.initializeForEvent(this.eventId).subscribe({
      next: (res) => {
        this.initializing.set(false);
        this.showToast(`${res.data?.created || 0} certificat(s) créé(s), ${res.data?.skipped || 0} ignoré(s).`, 'success');
        this.load();
      },
      error: (e) => { this.initializing.set(false); this.showToast(e?.error?.message || 'Erreur.', 'error'); },
    });
  }

  bulkValidateAll(): void {
    this.bulkActing.set('validate');
    this.certService.bulkValidate(this.eventId).subscribe({
      next: (res) => { this.bulkActing.set(null); this.showToast(`${res.data?.validated || 0} certificat(s) validé(s).`, 'success'); this.load(); },
      error: (e) => { this.bulkActing.set(null); this.showToast(e?.error?.message || 'Erreur.', 'error'); },
    });
  }

  bulkSendAll(): void {
    this.bulkActing.set('send');
    this.certService.bulkSend(this.eventId).subscribe({
      next: (res) => {
        this.bulkActing.set(null);
        this.showToast(`${res.data?.sent || 0} envoyé(s)${res.data?.errors ? `, ${res.data.errors} erreur(s)` : ''}.`, 'success');
        this.load();
      },
      error: (e) => { this.bulkActing.set(null); this.showToast(e?.error?.message || 'Erreur.', 'error'); },
    });
  }

  validate(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.validate(cert._id).subscribe({
      next: () => { this.acting.set(null); this.showToast('Certificat validé.', 'success'); this.load(); },
      error: (e) => { this.acting.set(null); this.showToast(e?.error?.message || 'Erreur.', 'error'); },
    });
  }

  send(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.sendByEmail(cert._id).subscribe({
      next: () => { this.acting.set(null); this.showToast('Email envoyé.', 'success'); this.load(); },
      error: (e) => { this.acting.set(null); this.showToast(e?.error?.message || 'Erreur.', 'error'); },
    });
  }

  download(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.downloadCertificate(cert._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        const n   = this.name(cert).replace(/[^a-z0-9]/gi, '_') || cert._id;
        a.href = url; a.download = `certificat-${n}.pdf`; a.click();
        URL.revokeObjectURL(url); this.acting.set(null); this.load();
      },
      error: () => this.acting.set(null),
    });
  }

  statusLabel(s: string): string {
    return ({ pending: 'En attente', validated: 'Validé', sent: 'Envoyé', downloaded: 'Téléchargé' } as any)[s] || s;
  }
  statusIcon(s: string): string {
    return ({ pending: 'hourglass_empty', validated: 'verified', sent: 'mark_email_read', downloaded: 'download_done' } as any)[s] || 'help';
  }
  lastAction(cert: Certificate): string {
    if (cert.downloadedAt) return (cert.downloadedAt as any) ? new Date(cert.downloadedAt).toLocaleDateString('fr-FR') : '—';
    if (cert.emailSentAt)  return new Date(cert.emailSentAt).toLocaleDateString('fr-FR');
    if (cert.validatedAt)  return new Date(cert.validatedAt).toLocaleDateString('fr-FR');
    return '—';
  }
  name(cert: Certificate):    string { return (cert.user as any)?.fullName || '—'; }
  email(cert: Certificate):   string { return (cert.user as any)?.email    || '—'; }
  initial(cert: Certificate): string { return this.name(cert).charAt(0).toUpperCase(); }

  private showToast(msg: string, type: 'success'|'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4500);
  }
}
