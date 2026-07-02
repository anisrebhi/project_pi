import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CertificateService } from '../../core/services/certificate.service';
import { CertificateVerification } from '../../core/models/lot2.models';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  template: `
<div class="verify-page">
  <div class="verify-card">
    <div class="verify-header">
      <div class="verify-logo">
        <span class="material-icons">workspace_premium</span>
      </div>
      <h2>Vérification de Certificat</h2>
      <p>Vérifiez l'authenticité d'un certificat EventPass</p>
    </div>

    <div *ngIf="loading()" class="verify-loader">
      <div class="verify-spinner"></div>
      <p>Vérification en cours&hellip;</p>
    </div>

    <ng-container *ngIf="!loading()">
      <div *ngIf="result()" class="verify-result verify-valid">
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
            <span class="result-label">&Eacute;v&eacute;nement</span>
            <span class="result-value">{{ result()!.event }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Date de l'&eacute;v&eacute;nement</span>
            <span class="result-value">{{ result()!.eventDate | date:'d MMMM yyyy' }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">&Eacute;mis le</span>
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
            <span class="result-label">T&eacute;l&eacute;chargements</span>
            <span class="result-value">{{ result()!.downloadCount }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Code de v&eacute;rification</span>
            <span class="result-value code-value">{{ result()!.verificationCode }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="error() && !result()" class="verify-result verify-invalid">
        <div class="result-icon result-icon-invalid">
          <span class="material-icons">gpp_bad</span>
        </div>
        <div class="result-badge-label result-label-invalid">Certificat Invalide</div>
        <p class="verify-error-msg">Ce code ne correspond &agrave; aucun certificat valide.</p>
      </div>

      <div class="verify-form" [class.mt-8]="result() || error()">
        <p class="verify-form-title">
          <span class="material-icons">search</span>
          {{ result() || error() ? 'V&eacute;rifier un autre certificat' : 'Entrer le code de v&eacute;rification' }}
        </p>
        <div class="verify-input-group">
          <input type="text" class="verify-input" [(ngModel)]="manualCode"
            placeholder="Ex: A1B2C3D4E5F6..." (keyup.enter)="verifyManual()" [disabled]="verifying()" />
          <button class="btn btn-primary" (click)="verifyManual()" [disabled]="!manualCode.trim() || verifying()">
            <span class="spinner spinner-sm" *ngIf="verifying()"></span>
            <span class="material-icons" *ngIf="!verifying()">verified_user</span>
            V&eacute;rifier
          </button>
        </div>
        <p class="verify-form-hint">Saisissez le code de v&eacute;rification figurant sur le certificat.</p>
      </div>
    </ng-container>

    <div class="verify-footer">
      <a routerLink="/" class="btn btn-ghost btn-sm">
        <span class="material-icons">arrow_back</span> Accueil
      </a>
      <a routerLink="/events" class="btn btn-ghost btn-sm">
        <span class="material-icons">event</span> &Eacute;v&eacute;nements
      </a>
    </div>
  </div>
</div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: var(--space-6); background: var(--color-bg);
    }
    .verify-card {
      background: var(--color-surface); border-radius: var(--radius-2xl);
      padding: var(--space-8) var(--space-8);
      max-width: 560px; width: 100%;
      box-shadow: var(--shadow-2xl); border: 1px solid var(--color-line);
    }
    .verify-header { text-align: center; margin-bottom: var(--space-6); }
    .verify-logo {
      width: 64px; height: 64px; border-radius: var(--radius-xl);
      background: linear-gradient(135deg, var(--brand-100), var(--brand-200));
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto var(--space-4);
    }
    .verify-logo .material-icons { font-size: 32px; color: var(--brand-600); }
    .verify-header h2 { font-size: 1.4rem; color: var(--color-ink); margin-bottom: var(--space-1); font-weight: 700; }
    .verify-header p  { color: var(--color-muted); font-size: .85rem; margin: 0; }
    .verify-loader { text-align: center; padding: var(--space-8) 0; }
    .verify-spinner {
      width: 44px; height: 44px; margin: 0 auto var(--space-4);
      border: 4px solid var(--color-line); border-top-color: var(--color-primary);
      border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .verify-loader p { color: var(--color-muted); font-size: .9rem; }
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
    .result-badge-label {
      font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-5); color: #059669;
    }
    .result-label-invalid { color: #dc2626; }
    .verify-error-msg { color: var(--color-muted); font-size: .85rem; margin: 0; }
    .result-grid { text-align: left; display: flex; flex-direction: column; gap: var(--space-2); }
    .result-row {
      display: flex; justify-content: space-between; align-items: baseline;
      background: var(--color-bg-subtle); border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4); gap: var(--space-3);
    }
    .result-label {
      font-size: .72rem; color: var(--color-muted);
      text-transform: uppercase; letter-spacing: .05em; font-weight: 600; flex-shrink: 0;
    }
    .result-value { font-size: .88rem; color: var(--color-ink); font-weight: 600; text-align: right; }
    .code-value { font-family: monospace; font-size: .75rem; word-break: break-all; }
    .cert-status-badge {
      display: inline-block; padding: .15rem .5rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 700;
    }
    .cert-status-sent       { background: rgba(16,185,129,.12); color: #059669; }
    .cert-status-downloaded { background: rgba(139,92,246,.12); color: #7c3aed; }
    .cert-status-validated  { background: rgba(59,130,246,.12); color: #2563eb; }
    .cert-status-pending    { background: rgba(245,158,11,.12); color: #d97706; }
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
    }
    .verify-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
    .verify-form-hint { font-size: .75rem; color: var(--color-muted); margin-top: var(--space-2); }
    .verify-footer {
      display: flex; justify-content: center; gap: var(--space-3);
      margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--color-line);
    }
    .btn-ghost {
      background: transparent; border: 1px solid var(--color-line);
      color: var(--color-muted); border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-4); font-size: .8rem;
      display: inline-flex; align-items: center; gap: var(--space-1);
      text-decoration: none;
    }
    .btn-ghost:hover { background: var(--color-bg-subtle); color: var(--color-ink); }
    .btn-ghost .material-icons { font-size: 16px; }
  `],
})
export class VerifyCertificateComponent implements OnInit {
  result     = signal<CertificateVerification | null>(null);
  loading    = signal(false);
  error      = signal(false);
  verifying  = signal(false);
  manualCode = '';

  constructor(
    private route: ActivatedRoute,
    private certService: CertificateService,
  ) {}

  ngOnInit(): void {
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
    return ({ pending: 'En attente', validated: 'Valid&eacute;', sent: 'Envoy&eacute; par email', downloaded: 'T&eacute;l&eacute;charg&eacute;' } as any)[s] || s;
  }
}
