import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MaterialService } from '../../services/material.service';
import { Material, MaterialStatus, STATUS_LABELS, MATERIAL_STATUSES } from '../../models/material.model';

@Component({
  selector: 'app-material-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div *ngIf="loading" class="text-center mt-2"><mat-spinner diameter="40"></mat-spinner></div>

    <ng-container *ngIf="!loading && material">
      <div class="back-bar animate-in">
        <button class="back-btn" routerLink="/materials">
          <mat-icon>arrow_back</mat-icon> Retour à la liste
        </button>
      </div>

      <div class="hero-section animate-in animate-in-delay-1">
        <div class="hero-info">
          <div class="hero-badge">
            <span [class]="'status-' + material.status">{{ getLabel(material.status) }}</span>
          </div>
          <h1 class="hero-title">{{ material.name }}</h1>
          <p class="hero-meta" *ngIf="material.serialNumber">Série: {{ material.serialNumber }}</p>
        </div>
        <div class="hero-actions">
          <button mat-stroked-button [routerLink]="['/materials', material._id, 'edit']">
            <mat-icon>edit</mat-icon> Modifier
          </button>
          <button mat-stroked-button class="delete-btn" (click)="deleteMaterial()">
            <mat-icon>delete</mat-icon> Supprimer
          </button>
        </div>
      </div>

      <div class="detail-grid animate-in animate-in-delay-2">
        <div class="detail-card">
          <div class="detail-card-header">
            <mat-icon>description</mat-icon>
            <span>Informations générales</span>
          </div>
          <div class="detail-card-body">
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">{{ material.description || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Catégorie</span>
              <span class="detail-value category-tag">{{ material.category.name || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Projet</span>
              <span class="detail-value">{{ material.project?.name || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Emplacement</span>
              <span class="detail-value">{{ material.location || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">État</span>
              <span class="detail-value">{{ material.condition || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-card-header">
            <mat-icon>inventory</mat-icon>
            <span>Stock & Valeur</span>
          </div>
          <div class="detail-card-body">
            <div class="detail-row">
              <span class="detail-label">Quantité</span>
              <span class="detail-value"><span class="qty-badge-lg">{{ material.quantity }}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Prix d'achat</span>
              <span class="detail-value price">{{ material.purchasePrice ? (material.purchasePrice + ' €') : '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date d'achat</span>
              <span class="detail-value">{{ material.purchaseDate ? (material.purchaseDate | date:'dd/MM/yyyy') : '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Valeur totale</span>
              <span class="detail-value price">{{ material.purchasePrice ? ((material.purchasePrice * material.quantity) + ' €') : '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-card-header">
            <mat-icon>sync_alt</mat-icon>
            <span>Changer le statut</span>
          </div>
          <div class="detail-card-body">
            <p class="status-hint">Sélectionnez un nouveau statut pour ce matériel :</p>
            <div class="status-options">
              <button class="status-option" *ngFor="let s of statuses"
                [class.selected]="material.status === s"
                [disabled]="material.status === s"
                (click)="updateStatus(s)">
                <span [class]="'status-' + s">{{ getLabel(s) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-card-header">
            <mat-icon>schedule</mat-icon>
            <span>Dates</span>
          </div>
          <div class="detail-card-body">
            <div class="detail-row">
              <span class="detail-label">Créé le</span>
              <span class="detail-value">{{ material.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Modifié le</span>
              <span class="detail-value">{{ material.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card full-width" *ngIf="material.notes">
          <div class="detail-card-header">
            <mat-icon>notes</mat-icon>
            <span>Notes</span>
          </div>
          <div class="detail-card-body">
            <p class="notes-text">{{ material.notes }}</p>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .back-bar { margin-bottom: 16px; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: var(--text-secondary); font-family: 'Inter',sans-serif; font-size: 0.85rem; padding: 6px 12px; border-radius: 8px; transition: all var(--transition); }
    .back-btn:hover { background: #fff; color: var(--primary); }
    .back-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .hero-section { display: flex; justify-content: space-between; align-items: flex-start; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: var(--radius); padding: 28px 32px; margin-bottom: 24px; border: 1px solid rgba(91,91,214,0.1); }
    .hero-info { display: flex; flex-direction: column; gap: 8px; }
    .hero-badge { margin-bottom: 4px; }
    .hero-title { font-size: 1.8rem; font-weight: 800; margin: 0; color: var(--text); letter-spacing: -0.5px; }
    .hero-meta { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }
    .hero-actions { display: flex; gap: 8px; }
    .hero-actions button { background: #fff; border: 1px solid rgba(0,0,0,0.08); }
    .delete-btn { color: var(--danger) !important; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .detail-card { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.04); overflow: hidden; }
    .detail-card.full-width { grid-column: 1 / -1; }
    .detail-card-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.04); font-weight: 600; font-size: 0.9rem; }
    .detail-card-header mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .detail-card-body { padding: 16px 20px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.03); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 0.8rem; color: var(--text-secondary); }
    .detail-value { font-size: 0.9rem; font-weight: 500; }
    .category-tag { padding: 2px 10px; border-radius: 6px; background: #f3f4f6; }
    .price { font-weight: 600; color: var(--primary); }
    .qty-badge-lg { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; border-radius: 8px; background: var(--bg); font-weight: 700; padding: 0 10px; }
    .status-hint { margin: 0 0 12px; font-size: 0.8rem; color: var(--text-secondary); }
    .status-options { display: flex; flex-wrap: wrap; gap: 8px; }
    .status-option { padding: 0; border: 2px solid transparent; border-radius: 20px; cursor: pointer; transition: all var(--transition); font-family: 'Inter',sans-serif; background: none; }
    .status-option:hover { transform: scale(1.05); }
    .status-option.selected { border-color: var(--primary); }
    .status-option:disabled { opacity: 0.6; cursor: not-allowed; }
    .status-option:disabled:hover { transform: none; }
    .notes-text { margin: 0; font-size: 0.9rem; line-height: 1.6; color: var(--text); white-space: pre-wrap; }
  `],
})
export class MaterialDetailComponent implements OnInit {
  material: Material | null = null;
  loading = false;
  statuses = MATERIAL_STATUSES;

  constructor(
    private service: MaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) this.loadMaterial(params['id']);
    });
  }

  getLabel(status: MaterialStatus): string {
    return STATUS_LABELS[status];
  }

  loadMaterial(id: string) {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (res) => { this.material = res.data; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  updateStatus(status: MaterialStatus) {
    if (!this.material) return;
    this.service.updateStatus(this.material._id, status).subscribe({
      next: (res) => {
        this.material = res.data;
        this.snackBar.open(`Statut changé à "${this.getLabel(status)}"`, 'Fermer', { duration: 3000 });
      },
    });
  }

  deleteMaterial() {
    if (!this.material) return;
    if (confirm(`Supprimer "${this.material.name}" ?`)) {
      this.service.delete(this.material._id).subscribe({
        next: () => {
          this.snackBar.open('Matériel supprimé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/materials']);
        },
      });
    }
  }
}
