import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CertificateService } from '../../core/services/certificate.service';
import { AuthService }        from '../../core/services/auth.service';
import { Certificate }        from '../../core/models/lot2.models';

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
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
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
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
    this.downloading.set(cert._id);
    this.certService.downloadCertificate(cert._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `certificat-${(cert.event as any)?.title?.replace(/[^a-z0-9]/gi, '_') || cert._id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => this.downloading.set(null),
    });
  }
}
