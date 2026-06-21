import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaterialService } from '../../services/material.service';
import { Material, MaterialStatus, MATERIAL_STATUSES, STATUS_LABELS, Category, Project } from '../../models/material.model';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatDatepickerModule, MatNativeDateModule, MatCardModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="form-header animate-in">
      <div class="form-header-left">
        <h1>{{ isEdit ? 'Modifier' : 'Nouveau' }} matériel</h1>
        <p class="form-subtitle">{{ isEdit ? 'Modifiez les informations du matériel' : 'Remplissez les informations pour ajouter un nouveau matériel' }}</p>
      </div>
      <button mat-stroked-button routerLink="/materials"><mat-icon>arrow_back</mat-icon> Retour</button>
    </div>

    <div class="form-card animate-in animate-in-delay-1">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <div class="form-section-header">
            <mat-icon>info</mat-icon>
            <span>Informations de base</span>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="field-required">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="name" placeholder="Nom du matériel">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Requis</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Numéro de série</mat-label>
              <input matInput formControlName="serialNumber" placeholder="SN-...">
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-required">
              <mat-label>Quantité</mat-label>
              <input matInput type="number" formControlName="quantity" min="0">
              <mat-error *ngIf="form.get('quantity')?.hasError('required')">Requis</mat-error>
              <mat-error *ngIf="form.get('quantity')?.hasError('min')">Minimum 0</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <mat-select formControlName="status">
                <mat-option *ngFor="let s of statuses" [value]="s">{{ getLabel(s) }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="field-required">
              <mat-label>Catégorie</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let c of categories" [value]="c._id">{{ c.name }}</mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('category')?.hasError('required')">Requis</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Projet</mat-label>
              <mat-select formControlName="project">
                <mat-option value="">Aucun</mat-option>
                <mat-option *ngFor="let p of projects" [value]="p._id">{{ p.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-header">
            <mat-icon>description</mat-icon>
            <span>Détails</span>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Description du matériel..."></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Emplacement</mat-label>
              <input matInput formControlName="location" placeholder="Entrepôt, étagère...">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>État</mat-label>
              <input matInput formControlName="condition" placeholder="Neuf, Bon, Usagé...">
            </mat-form-field>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-header">
            <mat-icon>shopping_cart</mat-icon>
            <span>Achat</span>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Date d'achat</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="purchaseDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Prix d'achat (€)</mat-label>
              <input matInput type="number" formControlName="purchasePrice" min="0">
            </mat-form-field>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-header">
            <mat-icon>notes</mat-icon>
            <span>Notes</span>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3" placeholder="Informations supplémentaires..."></textarea>
            </mat-form-field>
          </div>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/materials">Annuler</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting" class="submit-btn">
            <mat-icon>{{ isEdit ? 'save' : 'add_circle' }}</mat-icon>
            {{ isEdit ? 'Enregistrer' : 'Créer le matériel' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .form-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .form-subtitle { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.85rem; }
    .form-card { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.04); overflow: hidden; }
    .form-section { padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.04); }
    .form-section:last-of-type { border-bottom: none; }
    .form-section-header { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem; margin-bottom: 16px; color: var(--text); }
    .form-section-header mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary); }
    .form-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .form-grid mat-form-field { flex: 1 1 calc(50% - 16px); min-width: 250px; }
    .form-grid .full-width { flex-basis: 100%; }
    .field-required ::ng-deep .mat-mdc-form-field-label { font-weight: 500; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding: 20px 24px; background: #f9fafb; border-top: 1px solid rgba(0,0,0,0.04); }
    .submit-btn { padding: 8px 28px !important; }
  `],
})
export class MaterialFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  materialId = '';
  submitting = false;
  statuses = MATERIAL_STATUSES;
  categories: Category[] = [];
  projects: Project[] = [];

  constructor(
    private fb: FormBuilder,
    private service: MaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      serialNumber: [''],
      quantity: [1, [Validators.required, Validators.min(0)]],
      status: ['disponible'],
      category: ['', Validators.required],
      project: [''],
      purchaseDate: [''],
      purchasePrice: [null],
      location: [''],
      condition: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProjects();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && this.router.url.endsWith('/edit')) {
        this.isEdit = true;
        this.materialId = id;
        this.loadMaterial();
      }
    });
  }

  loadMaterial() {
    this.service.getById(this.materialId).subscribe({
      next: (res) => {
        const m = res.data;
        this.form.patchValue({
          name: m.name,
          description: m.description,
          serialNumber: m.serialNumber,
          quantity: m.quantity,
          status: m.status,
          category: m.category?._id,
          project: m.project?._id || '',
          purchaseDate: m.purchaseDate ? new Date(m.purchaseDate) : null,
          purchasePrice: m.purchasePrice,
          location: m.location,
          condition: m.condition,
          notes: m.notes,
        });
      },
    });
  }

  getLabel(status: MaterialStatus): string {
    return STATUS_LABELS[status];
  }

  loadCategories() {
    this.service.getCategories().subscribe({
      next: (res) => this.categories = res.data,
    });
  }

  loadProjects() {
    this.service.getProjects().subscribe({
      next: (res) => this.projects = res.data,
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    if (!data.project) delete data.project;

    const obs = this.isEdit
      ? this.service.update(this.materialId, data)
      : this.service.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Matériel mis à jour' : 'Matériel créé',
          'Fermer', { duration: 3000 }
        );
        this.router.navigate(['/materials']);
      },
      error: () => this.submitting = false,
    });
  }
}
