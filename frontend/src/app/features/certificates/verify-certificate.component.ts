import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CertificateService } from '../../core/services/certificate.service';
import { CertificateVerification } from '../../core/models/lot2.models';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
<div class="verify-page">
  <div class="verify-card">
    <div *ngIf="loading()" class="state-block">
      <div class="spinner"></div>
      <p>Vérification en cours…</p>
    </div>

    <div *ngIf="!loading() && result()" class="state-block valid">
      <div class="check-icon">✅</div>
      <h2>Certificat Valide</h2>
      <div class="result-grid">
        <div class="result-item">
          <span class="label">Titulaire</span>
          <span class="value">{{ result()!.holder }}</span>
        </div>
        <div class="result-item">
          <span class="label">Événement</span>
          <span class="value">{{ result()!.event }}</span>
        </div>
        <div class="result-item">
          <span class="label">Date de l'événement</span>
          <span class="value">{{ result()!.eventDate | date:'dd MMMM yyyy':'':'fr' }}</span>
        </div>
        <div class="result-item">
          <span class="label">Émis le</span>
          <span class="value">{{ result()!.issuedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>
    </div>

    <div *ngIf="!loading() && error()" class="state-block invalid">
      <div class="x-icon">❌</div>
      <h2>Certificat Invalide</h2>
      <p>Ce certificat n'existe pas ou a été révoqué.</p>
    </div>

    <div class="verify-footer">
      <a routerLink="/" class="btn btn-outline">← Retour à l'accueil</a>
    </div>
  </div>
</div>
  `,
  styles: [`
    .verify-page { min-height:80vh; display:flex; align-items:center; justify-content:center; padding:2rem; background:#f8fafc; }
    .verify-card { background:#fff; border-radius:20px; padding:3rem 2.5rem; max-width:520px; width:100%; box-shadow:0 8px 32px rgba(0,0,0,.1); text-align:center; }
    .spinner { width:48px; height:48px; border:4px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 1.5rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .check-icon,.x-icon { font-size:4rem; margin-bottom:1rem; }
    .valid h2 { color:#059669; } .invalid h2 { color:#dc2626; }
    .result-grid { text-align:left; margin:1.5rem 0; display:grid; gap:.75rem; }
    .result-item { background:#f8fafc; border-radius:10px; padding:.75rem 1rem; }
    .label { display:block; font-size:.75rem; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
    .value { font-size:1rem; color:#1e293b; font-weight:600; }
    .verify-footer { margin-top:2rem; }
    .btn { padding:.6rem 1.5rem; border-radius:10px; border:none; cursor:pointer; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; }
    .btn-outline { border:1.5px solid #6366f1; color:#6366f1; background:transparent; } .btn-outline:hover { background:#ede9fe; }
  `],
})
export class VerifyCertificateComponent implements OnInit {
  result  = signal<CertificateVerification | null>(null);
  loading = signal(true);
  error   = signal(false);

  constructor(
    private route: ActivatedRoute,
    private certService: CertificateService,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    this.certService.verify(code).subscribe({
      next: (res) => { this.result.set(res.data); this.loading.set(false); },
      error: ()    => { this.error.set(true); this.loading.set(false); },
    });
  }
}
