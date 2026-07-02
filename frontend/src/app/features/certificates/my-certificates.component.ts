import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CertificateService } from '../../core/services/certificate.service';
import { Certificate } from '../../core/models/lot2.models';

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
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
        <p>T&eacute;l&eacute;chargez vos attestations de participation aux &eacute;v&eacute;nements.</p>
      </div>
    </div>

    <div class="loading-state" *ngIf="loading()">
      <div class="spinner spinner-lg spinner-dark"></div>
      <p>Chargement&hellip;</p>
    </div>

    <div class="alert alert-error animate-fade" *ngIf="error() && !loading()">
      <span class="material-icons">error_outline</span> {{ error() }}
    </div>

    <div class="empty-state animate-in" *ngIf="!loading() && !error() && certs().length === 0">
      <div class="empty-icon-wrap">
        <span class="material-icons empty-icon">workspace_premium</span>
      </div>
      <h3>Aucun certificat disponible</h3>
      <p>Vos certificats apparaissent ici apr&egrave;s validation par l'organisateur.</p>
      <a routerLink="/events" class="btn btn-primary">
        <span class="material-icons">explore</span> D&eacute;couvrir des &eacute;v&eacute;nements
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
            <code class="cert-code">{{ cert.verificationCode | slice:0:16 }}&hellip;</code>
          </div>
        </div>

        <div class="cert-issued">&Eacute;mis le {{ cert.issuedAt | date:'dd/MM/yyyy' }}</div>

        <div class="cert-actions">
          <button class="btn btn-primary btn-sm" (click)="download(cert)"
            [disabled]="cert.status === 'pending' || downloading() === cert._id">
            <span class="spinner spinner-sm" *ngIf="downloading() === cert._id"></span>
            <span class="material-icons" *ngIf="downloading() !== cert._id">download</span>
            {{ downloading() === cert._id ? 'G&eacute;n&eacute;ration&hellip;' : cert.status === 'pending' ? 'En attente validation' : 'T&eacute;l&eacute;charger PDF' }}
          </button>
          <a class="btn btn-secondary btn-sm" [routerLink]="['/verify-certificate', cert.verificationCode]">
            <span class="material-icons">qr_code_scanner</span>
            V&eacute;rifier
          </a>
        </div>

        <div class="cert-notice" *ngIf="cert.status === 'pending'">
          <span class="material-icons">info</span>
          En attente de validation par l'organisateur de l'&eacute;v&eacute;nement.
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .toast-inline { position:fixed; top:var(--space-6); right:var(--space-6); z-index:9999; }
    .toast-inline-body {
      display:flex; align-items:center; gap:var(--space-3);
      padding:var(--space-4) var(--space-5); border-radius:var(--radius-md);
      box-shadow:var(--shadow-xl); font-size:.875rem; font-weight:500;
    }
    .toast-inline-body .material-icons { font-size:18px; }
    .toast-inline-success { background:var(--color-success); color:#fff; }
    .toast-inline-error { background:var(--color-danger); color:#fff; }
    .toast-inline-info { background:var(--color-primary); color:#fff; }
    .certs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:var(--space-6); }
    @media(max-width:640px) { .certs-grid { grid-template-columns:1fr; } }
    .cert-card {
      position:relative; overflow:hidden;
      background:var(--color-surface); border-radius:var(--radius-xl);
      border:1px solid var(--color-line);
      box-shadow:var(--shadow-card);
      padding:var(--space-6);
      display:flex; flex-direction:column; gap:var(--space-3);
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
    .cert-event-title { font-size:1.1rem; font-weight:700; color:var(--color-ink); line-height:1.3; }
    .cert-details { display:flex; flex-direction:column; gap:var(--space-2); }
    .cert-detail { display:flex; align-items:center; gap:var(--space-2); font-size:.8rem; color:var(--color-muted); }
    .detail-icon { font-size:14px !important; color:var(--gray-400); }
    .cert-code { font-size:.7rem; color:var(--color-muted); background:var(--gray-50); padding:2px 6px; border-radius:var(--radius-sm); }
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
    return ({ pending: 'En attente', validated: 'Valid&eacute;', sent: 'Disponible', downloaded: 'T&eacute;l&eacute;charg&eacute;' } as any)[s] || s;
  }

  getEventTitle(cert: Certificate): string {
    return (cert.event as any)?.title || '\u2014';
  }
  getEventDate(cert: Certificate): string {
    return (cert.event as any)?.startDate || '';
  }
  getOrganizerName(cert: Certificate): string {
    return (cert.event as any)?.organizer?.fullName || '';
  }

  download(cert: Certificate): void {
    if (cert.status === 'pending') return;
    this.downloading.set(cert._id);
    this.certService.downloadCertificate(cert._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'certificat-' + ((cert.event as any)?.title || cert._id).replace(/[^a-z0-9]/gi, '_') + '.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
        this.showToast('Certificat t&eacute;l&eacute;charg&eacute; !', 'success');
      },
      error: () => { this.downloading.set(null); this.showToast('Erreur lors du t&eacute;l&eacute;chargement.', 'error'); },
    });
  }

  private showToast(msg: string, type: 'success'|'info'|'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
