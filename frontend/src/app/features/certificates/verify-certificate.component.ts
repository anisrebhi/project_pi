import { Component, OnInit, signal } from '@angular/core';
<<<<<<< HEAD
import { CommonModule, DatePipe }    from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule }               from '@angular/forms';
import { CertificateService }        from '../../core/services/certificate.service';
import { CertificateVerification }   from '../../core/models/lot2.models';
=======
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CertificateService } from '../../core/services/certificate.service';
import { CertificateVerification } from '../../core/models/lot2.models';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  template: `
<div class="verify-page">
  <div class="verify-card">

    <!-- Header -->
    <div class="verify-header">
      <div class="verify-logo">
        <span class="material-icons">workspace_premium</span>
      </div>
      <h2>Vérification de Certificat</h2>
      <p>Vérifiez l'authenticité d'un certificat EventPass</p>
    </div>

    <!-- Loading -->
    <div *ngIf="loading()" class="verify-loader">
      <div class="verify-spinner"></div>
      <p>Vérification en cours…</p>
    </div>

    <!-- Auto-verified result (from URL param) or manual search -->
    <ng-container *ngIf="!loading()">

      <!-- Valid result -->
      <div *ngIf="result()" class="verify-result verify-valid" @fadeUp>
        <div class="result-icon result-icon-valid">
          <span class="material-icons">verified</span>
        </div>
        <div class="result-badge-label">Certificat Authentique</div>

        <div class="result-grid">
          <div class="result-row">
            <span class="result-label">Titulaire</span>
            <span class="result-value">{{ result()!.holder }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Événement</span>
            <span class="result-value">{{ result()!.event }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Date de l'événement</span>
            <span class="result-value">{{ result()!.eventDate | date:'d MMMM yyyy' }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Émis le</span>
            <span class="result-value">{{ result()!.issuedAt | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Statut</span>
            <span class="result-value">
              <span class="cert-status-badge cert-status-{{ result()!.status }}">
                {{ statusLabel(result()!.status) }}
              </span>
            </span>
          </div>
          <div class="result-row" *ngIf="result()!.downloadCount">
            <span class="result-label">Téléchargements</span>
            <span class="result-value">{{ result()!.downloadCount }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Code de vérification</span>
            <span class="result-value code-value">{{ result()!.verificationCode }}</span>
          </div>
        </div>
      </div>

      <!-- Invalid result -->
      <div *ngIf="error() && !result()" class="verify-result verify-invalid">
        <div class="result-icon result-icon-invalid">
          <span class="material-icons">gpp_bad</span>
        </div>
        <div class="result-badge-label result-label-invalid">Certificat Invalide</div>
        <p class="verify-error-msg">Ce code ne correspond à aucun certificat valide ou le certificat n'a pas encore été validé.</p>
      </div>

      <!-- Manual search form (always visible) -->
      <div class="verify-form" [class.mt-8]="result() || error()">
        <p class="verify-form-title">
          <span class="material-icons">search</span>
          {{ result() || error() ? 'Vérifier un autre certificat' : 'Entrer le code de vérification' }}
        </p>
        <div class="verify-input-group">
          <input
            type="text"
            class="verify-input"
            [(ngModel)]="manualCode"
            placeholder="Ex: A1B2C3D4E5F6..."
            (keyup.enter)="verifyManual()"
            [disabled]="verifying()"
          />
          <button
            class="btn btn-primary"
            (click)="verifyManual()"
            [disabled]="!manualCode.trim() || verifying()">
            <span class="spinner spinner-sm" *ngIf="verifying()"></span>
            <span class="material-icons" *ngIf="!verifying()">verified_user</span>
            Vérifier
          </button>
        </div>
        <p class="verify-form-hint">
          Saisissez le code de vérification figurant sur le certificat ou scannez le QR code.
        </p>
      </div>
    </ng-container>

    <!-- Footer -->
    <div class="verify-footer">
      <a routerLink="/" class="btn btn-ghost btn-sm">
        <span class="material-icons">arrow_back</span> Accueil
      </a>
      <a routerLink="/events" class="btn btn-ghost btn-sm">
        <span class="material-icons">event</span> Événements
      </a>
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    </div>
  </div>
</div>
  `,
  styles: [`
<<<<<<< HEAD
    .verify-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: var(--space-6); background: var(--color-bg);
    }
    .verify-card {
      background: var(--color-surface); border-radius: var(--radius-2xl);
      padding: var(--space-8) var(--space-8);
      max-width: 560px; width: 100%;
      box-shadow: var(--shadow-2xl); border: 1px solid var(--color-line);
      animation: fadeUp var(--duration-slow) var(--ease-out);
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

    /* Header */
    .verify-header { text-align: center; margin-bottom: var(--space-6); }
    .verify-logo {
      width: 64px; height: 64px; border-radius: var(--radius-xl);
      background: linear-gradient(135deg, var(--brand-100), var(--brand-200));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto var(--space-4);
    }
    :host-context(.dark) .verify-logo { background: rgba(99,102,241,.18); }
    .verify-logo .material-icons { font-size: 32px; color: var(--brand-600); }
    :host-context(.dark) .verify-logo .material-icons { color: var(--brand-400); }
    .verify-header h2 { font-size: 1.4rem; color: var(--color-ink); margin-bottom: var(--space-1); font-weight: 700; }
    .verify-header p  { color: var(--color-muted); font-size: .85rem; margin: 0; }

    /* Loader */
    .verify-loader { text-align: center; padding: var(--space-8) 0; }
    .verify-spinner {
      width: 44px; height: 44px; margin: 0 auto var(--space-4);
      border: 4px solid var(--color-line); border-top-color: var(--color-primary);
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .verify-loader p { color: var(--color-muted); font-size: .9rem; }

    /* Result */
    .verify-result { text-align: center; margin-bottom: var(--space-6); }
    .result-icon {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto var(--space-3);
    }
    .result-icon .material-icons { font-size: 36px; }
    .result-icon-valid   { background: rgba(16,185,129,.12); }
    .result-icon-valid .material-icons { color: #059669; }
    .result-icon-invalid { background: rgba(239,68,68,.12); }
    .result-icon-invalid .material-icons { color: #dc2626; }
    :host-context(.dark) .result-icon-valid   { background: rgba(16,185,129,.18); }
    :host-context(.dark) .result-icon-valid .material-icons { color: #34d399; }
    :host-context(.dark) .result-icon-invalid { background: rgba(239,68,68,.18); }
    :host-context(.dark) .result-icon-invalid .material-icons { color: #f87171; }

    .result-badge-label {
      font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-5); color: #059669;
    }
    .result-label-invalid { color: #dc2626; }
    :host-context(.dark) .result-badge-label { color: #34d399; }
    :host-context(.dark) .result-label-invalid { color: #f87171; }
    .verify-error-msg { color: var(--color-muted); font-size: .85rem; margin: 0; }

    .result-grid {
      text-align: left; display: flex; flex-direction: column; gap: var(--space-2);
    }
    .result-row {
      display: flex; justify-content: space-between; align-items: baseline;
      background: var(--color-bg-subtle); border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4); gap: var(--space-3);
    }
    :host-context(.dark) .result-row { background: var(--dark-surface-2); }
    .result-label {
      font-size: .72rem; color: var(--color-muted);
      text-transform: uppercase; letter-spacing: .05em; font-weight: 600; flex-shrink: 0;
    }
    .result-value { font-size: .88rem; color: var(--color-ink); font-weight: 600; text-align: right; }
    .code-value { font-family: monospace; font-size: .75rem; word-break: break-all; }

    /* Status badge */
    .cert-status-badge {
      display: inline-block; padding: .15rem .5rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 700;
    }
    .cert-status-sent       { background: rgba(16,185,129,.12); color: #059669; }
    .cert-status-downloaded { background: rgba(139,92,246,.12); color: #7c3aed; }
    .cert-status-validated  { background: rgba(59,130,246,.12); color: #2563eb; }
    .cert-status-pending    { background: rgba(245,158,11,.12); color: #d97706; }

    /* Manual form */
    .verify-form { margin-top: var(--space-4); padding-top: var(--space-5); border-top: 1px solid var(--color-line); }
    .mt-8 { margin-top: var(--space-8); }
    .verify-form-title {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: .85rem; font-weight: 600; color: var(--color-ink); margin-bottom: var(--space-3);
    }
    .verify-form-title .material-icons { font-size: 16px; color: var(--color-primary); }
    .verify-input-group { display: flex; gap: var(--space-2); }
    .verify-input {
      flex: 1; padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-line); border-radius: var(--radius-md);
      background: var(--color-bg); color: var(--color-ink);
      font-size: .875rem; font-family: monospace;
      transition: border-color var(--duration-fast);
    }
    .verify-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    :host-context(.dark) .verify-input { background: var(--dark-surface-2); border-color: var(--dark-line); }
    .verify-form-hint { font-size: .75rem; color: var(--color-muted); margin-top: var(--space-2); }

    /* Footer */
    .verify-footer {
      display: flex; justify-content: center; gap: var(--space-3);
      margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--color-line);
    }
    .btn-ghost {
      background: transparent; border: 1px solid var(--color-line);
      color: var(--color-muted); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-4); font-size: .8rem;
      display: inline-flex; align-items: center; gap: var(--space-1);
      text-decoration: none; transition: all var(--duration-fast);
    }
    .btn-ghost:hover { background: var(--color-bg-subtle); color: var(--color-ink); }
    .btn-ghost .material-icons { font-size: 16px; }
  `],
})
export class VerifyCertificateComponent implements OnInit {
  result   = signal<CertificateVerification | null>(null);
  loading  = signal(false);
  error    = signal(false);
  verifying = signal(false);
  manualCode = '';
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

  constructor(
    private route: ActivatedRoute,
    private certService: CertificateService,
  ) {}

  ngOnInit(): void {
<<<<<<< HEAD
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.manualCode = code;
      this.loading.set(true);
      this.verifyCode(code.trim().toUpperCase(), () => this.loading.set(false));
    }
  }

  verifyManual(): void {
    const code = this.manualCode.trim().toUpperCase();
    if (!code) return;
    this.result.set(null);
    this.error.set(false);
    this.verifying.set(true);
    this.verifyCode(code, () => this.verifying.set(false));
  }

  private verifyCode(code: string, done: () => void): void {
    this.certService.verify(code).subscribe({
      next: (res) => { this.result.set(res.data ?? null); done(); },
      error: ()    => { this.error.set(true); done(); },
    });
  }

  statusLabel(s: string): string {
    return ({ pending: 'En attente', validated: 'Validé', sent: 'Envoyé par email', downloaded: 'Téléchargé' } as any)[s] || s;
  }
=======
    const code = this.route.snapshot.paramMap.get('code') || '';
    this.certService.verify(code).subscribe({
      next: (res) => { this.result.set(res.data); this.loading.set(false); },
      error: ()    => { this.error.set(true); this.loading.set(false); },
    });
  }
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
}
