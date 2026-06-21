import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaterialService } from '../../services/material.service';
import { Material, MaterialStatus, MATERIAL_STATUSES, STATUS_LABELS, Category } from '../../models/material.model';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatMenuModule, MatCardModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="list-header animate-in">
      <div class="list-header-left">
        <h1>Matériels</h1>
        <span class="total-badge">{{ total }} matériel(s)</span>
      </div>
      <button mat-raised-button color="primary" routerLink="/materials/new">
        <mat-icon>add</mat-icon> Nouveau matériel
      </button>
    </div>

    <div class="stats-row animate-in animate-in-delay-1">
      <div class="stat-card stat-all">
        <div class="stat-icon"><mat-icon>inventory_2</mat-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
      <div class="stat-card stat-available" *ngFor="let s of statuses">
        <div class="stat-icon"><mat-icon>circle</mat-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ getStatusCount(s) }}</span>
          <span class="stat-label">{{ getLabel(s) }}</span>
        </div>
      </div>
    </div>

    <div class="filters-section animate-in animate-in-delay-2">
      <div class="search-wrap">
        <mat-icon class="search-icon">search</mat-icon>
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Rechercher par nom, description ou série...">
        <button *ngIf="search" class="search-clear" (click)="search=''; onSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="filter-chips">
        <div class="filter-chip-group">
          <button class="chip" [class.active]="!statusFilter" (click)="statusFilter=''; load()">Tous</button>
          <button class="chip" *ngFor="let s of statuses" [class.active]="statusFilter===s" (click)="statusFilter=s; load()">
            <span [class]="'status-' + s" style="padding:2px 8px;font-size:0.75rem">{{ getLabel(s) }}</span>
          </button>
        </div>
        <mat-form-field appearance="outline" class="category-select">
          <mat-label>Catégorie</mat-label>
          <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="load()">
            <mat-option value="">Toutes</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c._id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    <div *ngIf="loading" class="text-center mt-2"><mat-spinner diameter="40"></mat-spinner></div>

    <div class="table-card animate-in animate-in-delay-3" *ngIf="!loading">
      <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSort()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
          <td mat-cell *matCellDef="let m">
            <a class="material-link" [routerLink]="['/materials', m._id]">{{ m.name }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="serialNumber">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Série</th>
          <td mat-cell *matCellDef="let m">{{ m.serialNumber || '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Qté</th>
          <td mat-cell *matCellDef="let m"><span class="qty-badge">{{ m.quantity }}</span></td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
          <td mat-cell *matCellDef="let m">
            <span [class]="'status-' + m.status">{{ getLabel(m.status) }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Catégorie</th>
          <td mat-cell *matCellDef="let m">
            <span class="category-tag" *ngIf="m.category">{{ m.category.name }}</span>
            <span *ngIf="!m.category">-</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef>Emplacement</th>
          <td mat-cell *matCellDef="let m">{{ m.location || '-' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let m">
            <button mat-icon-button [matMenuTriggerFor]="menu" class="action-btn">
              <mat-icon>more_horiz</mat-icon>
            </button>
            <mat-menu #menu="matMenu" xPosition="before">
              <button mat-menu-item [routerLink]="['/materials', m._id]">
                <mat-icon>visibility</mat-icon> Voir
              </button>
              <button mat-menu-item [routerLink]="['/materials', m._id, 'edit']">
                <mat-icon>edit</mat-icon> Modifier
              </button>
              <button mat-menu-item (click)="deleteMaterial(m)">
                <mat-icon color="warn">delete</mat-icon> Supprimer
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
      </table>

      <mat-paginator [length]="total" [pageSize]="limit" [pageIndex]="page - 1"
        [pageSizeOptions]="[5, 10, 25, 50]" (page)="onPage($event)" showFirstLastButtons>
      </mat-paginator>
    </div>

    <div *ngIf="!loading && dataSource.data.length === 0" class="empty-state">
      <mat-icon class="empty-icon">inventory_2</mat-icon>
      <h3>Aucun matériel trouvé</h3>
      <p>Commencez par en ajouter un nouveau.</p>
      <button mat-raised-button color="primary" routerLink="/materials/new">
        <mat-icon>add</mat-icon> Nouveau matériel
      </button>
    </div>
  `,
  styles: [`
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .list-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .total-badge { display: inline-block; font-size: 0.8rem; color: var(--text-secondary); background: var(--bg); padding: 4px 12px; border-radius: 20px; margin-top: 4px; }
    .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-card { display: flex; align-items: center; gap: 12px; background: #fff; padding: 14px 20px; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.04); flex: 1; min-width: 140px; }
    .stat-card .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-card .stat-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-all .stat-icon { background: #eef2ff; color: var(--primary); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.3rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
    .filters-section { background: #fff; border-radius: var(--radius); padding: 16px 20px; box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.04); margin-bottom: 20px; }
    .search-wrap { display: flex; align-items: center; background: var(--bg); border-radius: 10px; padding: 0 14px; margin-bottom: 14px; }
    .search-icon { color: var(--text-secondary); font-size: 20px; }
    .search-input { flex: 1; border: none; background: transparent; padding: 12px 10px; font-size: 0.9rem; font-family: 'Inter', sans-serif; outline: none; }
    .search-clear { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); padding: 4px; border-radius: 6px; }
    .search-clear:hover { background: #e5e7eb; }
    .search-clear mat-icon { font-size: 18px; }
    .filter-chips { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-chip-group { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
    .chip { padding: 6px 14px; border-radius: 20px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.8rem; font-family: 'Inter',sans-serif; cursor: pointer; transition: all var(--transition); color: var(--text-secondary); }
    .chip:hover { border-color: var(--primary); color: var(--primary); }
    .chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }
    .chip.active span { background: transparent !important; color: #fff !important; }
    .category-select { width: 180px; margin-bottom: -1.25em !important; }
    .table-card { background: #fff; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.04); overflow: hidden; }
    .material-link { text-decoration: none; font-weight: 600; color: var(--primary); }
    .material-link:hover { text-decoration: underline; }
    .qty-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; border-radius: 8px; background: var(--bg); font-weight: 600; font-size: 0.8rem; padding: 0 8px; }
    .category-tag { padding: 3px 10px; border-radius: 6px; background: #f3f4f6; font-size: 0.8rem; color: var(--text-secondary); }
    .action-btn { width: 32px !important; height: 32px !important; line-height: 32px !important; }
    .action-btn mat-icon { font-size: 18px; }
    .table-row { transition: background var(--transition); }
    .table-row:hover { background: #f8f9ff !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
    .empty-icon { font-size: 60px; width: 60px; height: 60px; color: #d1d5db; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px; font-weight: 600; color: var(--text); }
    .empty-state p { margin: 0 0 20px; color: var(--text-secondary); }
  `],
})
export class MaterialListComponent implements OnInit {
  displayedColumns = ['name', 'serialNumber', 'quantity', 'status', 'category', 'location', 'actions'];
  dataSource = new MatTableDataSource<Material>([]);
  statuses = MATERIAL_STATUSES;
  labels = STATUS_LABELS;
  categories: Category[] = [];
  statusSummary: Record<string, number> = {};

  search = '';
  statusFilter = '';
  categoryFilter = '';
  sortField = 'createdAt';
  sortOrder = 'desc';
  page = 1;
  limit = 10;
  total = 0;
  loading = false;

  constructor(private service: MaterialService) {}

  ngOnInit() {
    this.loadCategories();
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, sortBy: this.sortField, order: this.sortOrder };
    if (this.search) params.search = this.search;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.categoryFilter) params.category = this.categoryFilter;
    this.service.getAll(params).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        if (res.pagination) {
          this.total = res.pagination.total;
          this.page = res.pagination.currentPage;
          this.limit = res.pagination.limit;
        }
        this.statusSummary = {};
        for (const m of res.data) {
          this.statusSummary[m.status] = (this.statusSummary[m.status] || 0) + 1;
        }
        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }

  loadCategories() {
    this.service.getCategories().subscribe({
      next: (res) => this.categories = res.data,
    });
  }

  onSearch() {
    this.page = 1;
    this.load();
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.limit = e.pageSize;
    this.load();
  }

  onSort() {
    this.page = 1;
    this.load();
  }

  getLabel(status: MaterialStatus): string {
    return STATUS_LABELS[status];
  }

  getStatusCount(status: MaterialStatus): number {
    return this.statusSummary[status] ?? 0;
  }

  deleteMaterial(m: Material) {
    if (confirm(`Supprimer "${m.name}" ?`)) {
      this.service.delete(m._id).subscribe(() => this.load());
    }
  }
}
