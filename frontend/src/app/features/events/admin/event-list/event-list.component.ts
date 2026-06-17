import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { EventService } from '../../../../core/services/event.service';
import { EventModel, EventQueryParams } from '../../../../core/models/event.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css',
})
export class AdminEventListComponent implements OnInit {
  private fb = inject(FormBuilder);

  events: EventModel[] = [];
  pagination: Pagination | null = null;
  loading = true;
  errorMessage = '';

  page = 1;
  readonly limit = 10;

  filters = this.fb.group({
    search: [''],
    category: [''],
    type: [''],
  });

  readonly categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'conference', label: 'Conférence' },
    { value: 'workshop', label: 'Atelier' },
    { value: 'meeting', label: 'Réunion' },
    { value: 'sport', label: 'Sport' },
    { value: 'other', label: 'Autre' },
  ];

  constructor(
    private eventService: EventService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.fetchEvents();

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.fetchEvents();
    });
  }

  fetchEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    const { search, category, type } = this.filters.getRawValue();
    const params: EventQueryParams = {
      page: this.page,
      limit: this.limit,
      sortBy: 'startDate',
      order: 'desc',
    };
    if (search) params.search = search;
    if (category) params.category = category as EventQueryParams['category'];
    if (type) params.type = type as EventQueryParams['type'];

    this.eventService.list(params).subscribe({
      next: (res) => {
        this.events = res.data;
        this.pagination = res.pagination ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les événements.';
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.page = page;
    this.fetchEvents();
  }

  isPast(event: EventModel): boolean {
    return new Date(event.startDate).getTime() <= Date.now();
  }

  async deleteEvent(event: EventModel): Promise<void> {
    const confirmed = await this.confirmDialog.ask({
      title: 'Supprimer cet événement ?',
      message: `"${event.title}" sera désactivé et ne sera plus visible par les utilisateurs. Cette action est réversible côté base de données mais pas depuis cette interface.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;

    this.eventService.delete(event._id).subscribe({
      next: () => {
        this.toast.success('Événement supprimé.');
        this.fetchEvents();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Impossible de supprimer cet événement.');
      },
    });
  }
}
