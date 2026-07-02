import { Component, OnInit, signal } from '@angular/core';
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
import { CommonModule, DatePipe }    from '@angular/common';
import { RouterModule }              from '@angular/router';
import { CertificateService }        from '../../core/services/certificate.service';
import { Certificate }               from '../../core/models/lot2.models';
<<<<<<< HEAD
=======
=======
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CertificateService } from '../../core/services/certificate.service';
import { AuthService }        from '../../core/services/auth.service';
import { Certificate }        from '../../core/models/lot2.models';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
<div class="toast-inline" *ngIf="toast()">
  <div class="toast-inline-body toast-inline-{{ toast()!.type }}">
    <span class="material-icons">{{ toast()!.type === 'success' ? 'check_circle' : 'error_outline' }}</span>
    {{ toast()!.msg }}
  </div>
</div>

<div class="page">
  <div class="page-inner">
    <div class="page-header">
      <div>
        <span class="eyebrow">Mon espace</span>
        <h1>Mes Certificats</h1>
        <p>Téléchargez vos attestations de participation aux événements.</p>
      </div>
    </div>

    <div class="loading-state" *ngIf="loading()">
      <div class="spinner spinner-lg spinner-dark"></div>
      <p>Chargement…</p>
    </div>

    <div class="alert alert-error animate-fade" *ngIf="error() && !loading()">
      <span class="material-icons">error_outline</span> {{ error() }}
    </div>

    <div class="empty-state animate-in" *ngIf="!loading() && !error() && certs().length === 0">
      <div class="empty-icon-wrap">
        <span class="material-icons empty-icon">workspace_premium</span>
      </div>
      <h3>Aucun certificat disponible</h3>
      <p>Vos certificats apparaissent ici après validation par l'organisateur, suite à votre participation à un événement.</p>
      <a routerLink="/events" class="btn btn-primary">
        <span class="material-icons">explore</span> Découvrir des événements
      </a>
    </div>

    <div class="certs-grid" *ngIf="!loading() && certs().length > 0">
      <div *ngFor="let cert of certs()" class="cert-card animate-in">
        <div class="cert-card-glow"></div>
        <div class="cert-card-top">
          <div class="cert-icon">
            <span class="material-icons">workspace_premium</span>
          </div>
          <span class="cert-status status-{{ cert.status }}">
            <span class="material-icons status-icon">
              {{ cert.status === 'downloaded' ? 'download_done' : cert.status === 'sent' ? 'check_circle' : cert.status === 'validated' ? 'verified' : 'schedule' }}
            </span>
            {{ statusLabel(cert.status) }}
          </span>
        </div>

        <h3 class="cert-event-title">{{ getEventTitle(cert) }}</h3>

        <div class="cert-details">
          <div class="cert-detail">
            <span class="material-icons detail-icon">event</span>
            <span>{{ getEventDate(cert) | date:'d MMMM yyyy' }}</span>
          </div>
          <div class="cert-detail" *ngIf="getOrganizerName(cert)">
            <span class="material-icons detail-icon">person</span>
            <span>{{ getOrganizerName(cert) }}</span>
          </div>
          <div class="cert-detail">
            <span class="material-icons detail-icon">fingerprint</span>
            <code class="cert-code">{{ cert.verificationCode | slice:0:16 }}…</code>
          </div>
        </div>

        <div class="cert-issued">Émis le {{ cert.issuedAt | date:'dd/MM/yyyy' }}</div>

        <div class="cert-actions">
          <button
            class="btn btn-primary btn-sm"
            (click)="download(cert)"
            [disabled]="cert.status === 'pending' || downloading() === cert._id">
            <span class="spinner spinner-sm" *ngIf="downloading() === cert._id"></span>
            <span class="material-icons" *ngIf="downloading() !== cert._id">download</span>
            {{ downloading() === cert._id ? 'Génération…' : cert.status === 'pending' ? 'En attente validation' : 'Télécharger PDF' }}
          </button>
          <a class="btn btn-secondary btn-sm" [routerLink]="['/verify-certificate', cert.verificationCode]">
            <span class="material-icons">qr_code_scanner</span>
            Vérifier
          </a>
        </div>

        <div class="cert-notice" *ngIf="cert.status === 'pending'">
          <span class="material-icons">info</span>
          En attente de validation par l'organisateur de l'événement.
        </div>
<<<<<<< HEAD
=======
=======
<div class="cert-page">
  <div class="cert-header">
    <h1>🏆 Mes Certificats</h1>
    <p class="subtitle">Téléchargez vos attestations de participation</p>
  </div>

  <div *ngIf="loading()" class="loading-state">
    <div class="spinner"></div>
    <p>Chargement de vos certificats…</p>
  </div>

  <div *ngIf="error()" class="error-state">
    <span class="error-icon">⚠️</span>
    <p>{{ error() }}</p>
  </div>

  <div *ngIf="!loading() && !error()">
    <div *ngIf="certificates().length === 0" class="empty-state">
      <div class="empty-icon">📜</div>
      <h3>Aucun certificat disponible</h3>
      <p>Les certificats sont générés automatiquement après la fin des événements auxquels vous avez participé.</p>
      <a routerLink="/events" class="btn btn-primary">Découvrir des événements</a>
    </div>

    <div *ngIf="certificates().length > 0" class="cert-grid">
      <div *ngFor="let cert of certificates()" class="cert-card">
        <div class="cert-card__ribbon">Certifié</div>
        <div class="cert-card__top">
          <div class="cert-icon">🏆</div>
          <div class="cert-info">
            <h3 class="cert-event-title">{{ cert.event?.title }}</h3>
            <p class="cert-date">
              📅 {{ cert.event?.startDate | date:'dd MMMM yyyy':'':'fr' }}
            </p>
            <p class="cert-org" *ngIf="cert.event?.organizer?.fullName">
              👤 {{ cert.event?.organizer?.fullName }}
            </p>
          </div>
        </div>

        <div class="cert-card__meta">
          <span class="cert-code">
            🔑 {{ cert.verificationCode | slice:0:16 }}…
          </span>
          <span class="cert-issued">
            Émis le {{ cert.issuedAt | date:'dd/MM/yyyy' }}
          </span>
        </div>

        <div class="cert-card__actions">
          <button class="btn btn-primary btn-sm" (click)="download(cert)" [disabled]="downloading() === cert._id">
            <span *ngIf="downloading() !== cert._id">⬇️ Télécharger PDF</span>
            <span *ngIf="downloading() === cert._id">Génération…</span>
          </button>
          <a class="btn btn-outline btn-sm" [routerLink]="['/verify-certificate', cert.verificationCode]">
            🔍 Vérifier
          </a>
        </div>
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    .toast-inline { position:fixed; top:var(--space-6); right:var(--space-6); z-index:9999; }
    .toast-inline-body {
      display:flex; align-items:center; gap:var(--space-3);
      padding:var(--space-4) var(--space-5); border-radius:var(--radius-md);
      box-shadow:var(--shadow-xl); font-size:.875rem; font-weight:500;
      animation:slideInRight .3s var(--ease-out);
    }
    .toast-inline-body .material-icons { font-size:18px; }
    .toast-inline-success { background:var(--color-success); color:#fff; }
    .toast-inline-error { background:var(--color-danger); color:#fff; }
    .toast-inline-info { background:var(--color-primary); color:#fff; }
    @keyframes slideInRight { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:none; } }

    .certs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:var(--space-6); }
    @media(max-width:640px) { .certs-grid { grid-template-columns:1fr; } }
    .cert-card {
      position:relative; overflow:hidden;
      background:var(--color-surface); border-radius:var(--radius-xl);
      border:1px solid var(--color-line);
      box-shadow:var(--shadow-card);
      padding:var(--space-6);
      display:flex; flex-direction:column; gap:var(--space-3);
      transition:all var(--duration-base) var(--ease-out);
    }
    .cert-card:hover {
      transform:translateY(-4px);
      box-shadow:var(--shadow-card-hover);
      border-color:var(--brand-200);
    }
    .cert-card-glow {
      position:absolute; top:-50%; left:-50%; width:200%; height:200%;
      background:radial-gradient(circle at 30% 0%, rgba(99,102,241,.04) 0%, transparent 60%);
      pointer-events:none;
    }
    .cert-card-top { display:flex; align-items:center; justify-content:space-between; }
    .cert-icon {
      width:44px; height:44px; border-radius:var(--radius-md);
      background:linear-gradient(135deg, var(--brand-100), var(--brand-200));
      display:flex; align-items:center; justify-content:center;
    }
    .cert-icon .material-icons { font-size:24px; color:var(--brand-600); }
    :host-context(.dark) .cert-icon { background:rgba(99,102,241,.15); }
    :host-context(.dark) .cert-icon .material-icons { color:var(--brand-400); }
    .cert-status {
      display:inline-flex; align-items:center; gap:var(--space-1);
      padding:.25rem .7rem; border-radius:var(--radius-full);
      font-size:.7rem; font-weight:700; letter-spacing:.04em;
    }
    .status-icon { font-size:14px !important; }
    .status-sent { background:rgba(16,185,129,.12); color:#059669; }
    .status-validated { background:rgba(59,130,246,.12); color:#2563eb; }
    .status-pending { background:rgba(245,158,11,.12); color:#d97706; }
    .status-downloaded { background:rgba(139,92,246,.12); color:#7c3aed; }
    :host-context(.dark) .status-sent { background:rgba(16,185,129,.15); color:#34d399; }
    :host-context(.dark) .status-validated { background:rgba(59,130,246,.15); color:#93c5fd; }
    :host-context(.dark) .status-pending { background:rgba(245,158,11,.15); color:#fbbf24; }
    :host-context(.dark) .status-downloaded { background:rgba(139,92,246,.15); color:#c4b5fd; }
    .cert-event-title { font-size:1.1rem; font-weight:700; color:var(--color-ink); line-height:1.3; }
    .cert-details { display:flex; flex-direction:column; gap:var(--space-2); }
    .cert-detail { display:flex; align-items:center; gap:var(--space-2); font-size:.8rem; color:var(--color-muted); }
    .detail-icon { font-size:14px !important; color:var(--gray-400); }
    .cert-code { font-size:.7rem; color:var(--color-muted); background:var(--gray-50); padding:2px 6px; border-radius:var(--radius-sm); }
    :host-context(.dark) .cert-code { background:var(--dark-surface-2); }
    .cert-issued { font-size:.75rem; color:var(--color-muted); }
    .cert-actions {
      display:flex; gap:var(--space-3); flex-wrap:wrap;
      margin-top:auto; padding-top:var(--space-4);
      border-top:1px solid var(--color-line);
    }
    .cert-notice {
      display:flex; align-items:center; gap:var(--space-2);
      background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2);
      border-radius:var(--radius-md); padding:var(--space-3);
      font-size:.8rem; color:#d97706;
    }
    :host-context(.dark) .cert-notice { background:rgba(245,158,11,.1); color:#fbbf24; }
    .cert-notice .material-icons { font-size:16px; }
  `],
})
export class MyCertificatesComponent implements OnInit {
  certs       = signal<Certificate[]>([]);
  loading     = signal(true);
  error       = signal('');
  downloading = signal<string|null>(null);
  toast       = signal<{ msg: string; type: 'success'|'info'|'error' } | null>(null);

  constructor(private certService: CertificateService) {}

  ngOnInit(): void {
    this.certService.getMyCertificates().subscribe({
      next: (res) => { this.certs.set(res.data?.certificates || []); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger vos certificats.'); this.loading.set(false); },
    });
  }

  statusLabel(s: string): string {
    return ({ pending: 'En attente', validated: 'Validé', sent: 'Disponible', downloaded: 'Téléchargé' } as any)[s] || s;
  }

  getEventTitle(cert: Certificate): string {
    return (cert.event as any)?.title || '—';
  }
  getEventDate(cert: Certificate): string {
    return (cert.event as any)?.startDate || '';
  }
  getOrganizerName(cert: Certificate): string {
    return (cert.event as any)?.organizer?.fullName || '';
  }

  download(cert: Certificate): void {
    if (cert.status === 'pending') return;
<<<<<<< HEAD
=======
=======
    .cert-page { max-width:1000px; margin:0 auto; padding:2rem 1rem; }
    .cert-header { text-align:center; margin-bottom:2.5rem; }
    .cert-header h1 { font-size:2rem; font-weight:700; color:var(--mat-primary,#6366f1); margin-bottom:.5rem; }
    .subtitle { color:#64748b; }
    .loading-state,.error-state { text-align:center; padding:3rem; color:#64748b; }
    .spinner { width:40px; height:40px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { text-align:center; padding:4rem 2rem; background:#f8fafc; border-radius:16px; }
    .empty-icon { font-size:4rem; margin-bottom:1rem; }
    .cert-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1.5rem; }
    .cert-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.5rem; position:relative; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:transform .2s,box-shadow .2s; }
    .cert-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(99,102,241,.15); }
    .cert-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#6366f1,#818cf8); }
    .cert-card__ribbon { position:absolute; top:12px; right:-22px; background:#6366f1; color:#fff; font-size:10px; font-weight:700; padding:3px 28px; transform:rotate(30deg); letter-spacing:1px; }
    .cert-card__top { display:flex; gap:1rem; align-items:flex-start; margin-bottom:1rem; }
    .cert-icon { font-size:2.5rem; flex-shrink:0; }
    .cert-event-title { font-size:1rem; font-weight:700; color:#1e293b; margin:0 0 .4rem; line-height:1.3; }
    .cert-date,.cert-org { font-size:.85rem; color:#64748b; margin:.2rem 0; }
    .cert-card__meta { display:flex; flex-direction:column; gap:.25rem; background:#f8fafc; border-radius:8px; padding:.75rem; margin-bottom:1rem; font-size:.8rem; }
    .cert-code { font-family:monospace; color:#6366f1; }
    .cert-issued { color:#94a3b8; }
    .cert-card__actions { display:flex; gap:.75rem; flex-wrap:wrap; }
    .btn { padding:.5rem 1.2rem; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-size:.875rem; text-decoration:none; display:inline-flex; align-items:center; gap:.4rem; transition:all .2s; }
    .btn-primary { background:#6366f1; color:#fff; } .btn-primary:hover:not(:disabled) { background:#4f46e5; }
    .btn-outline { background:transparent; border:1.5px solid #6366f1; color:#6366f1; } .btn-outline:hover { background:#ede9fe; }
    .btn-sm { padding:.375rem .875rem; font-size:.8rem; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    @media(max-width:600px) { .cert-grid { grid-template-columns:1fr; } }
  `],
})
export class MyCertificatesComponent implements OnInit {
  certificates = signal<Certificate[]>([]);
  loading      = signal(true);
  error        = signal<string | null>(null);
  downloading  = signal<string | null>(null);

  constructor(
    private certService: CertificateService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.certService.getMyCertificates().subscribe({
      next: (res) => {
        this.certificates.set(res.data?.certificates || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger vos certificats.');
        this.loading.set(false);
      },
    });
  }

  download(cert: Certificate): void {
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    this.downloading.set(cert._id);
    this.certService.downloadCertificate(cert._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
        a.download = `certificat-${((cert.event as any)?.title || cert._id).replace(/[^a-z0-9]/gi, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
        this.showToast('Certificat téléchargé !', 'success');
      },
      error: () => { this.downloading.set(null); this.showToast('Erreur lors du téléchargement.', 'error'); },
    });
  }

  private showToast(msg: string, type: 'success'|'info'|'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
<<<<<<< HEAD
=======
=======
        a.download = `certificat-${(cert.event as any)?.title?.replace(/[^a-z0-9]/gi, '_') || cert._id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => this.downloading.set(null),
    });
  }
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
}
