import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { MatButtonModule }   from '@angular/material/button';
import { MatChipsModule }    from '@angular/material/chips';
import { MatIconModule }     from '@angular/material/icon';
import { MatMenuModule }     from '@angular/material/menu';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EventService } from '../../../../core/services/event.service';
import { EventModel, EventQueryParams, computeAvailableSpots, computeIsFull, getEventImageUrl } from '../../../../core/models/event.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FILTER_CATEGORIES, getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatChipsModule, MatIconModule, MatMenuModule, MatTooltipModule, MatProgressBarModule,
  ],
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
  readonly limit = 9;

  filters = this.fb.group({
    search:   [''],
    category: [''],
    type:     [''],
  });

  readonly categories = FILTER_CATEGORIES;

  getCategoryEmoji = getCategoryEmoji;
  getCategoryLabel = getCategoryLabel;
  getEventImageUrl = getEventImageUrl;
  computeAvailableSpots = computeAvailableSpots;
  computeIsFull = computeIsFull;

  constructor(
    private eventService: EventService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private router: Router,
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
    const params: EventQueryParams = { page: this.page, limit: this.limit, sortBy: 'startDate', order: 'desc' };
    if (search)    params.search   = search;
    if (category)  params.category = category as EventQueryParams['category'];
    if (type)      params.type     = type as EventQueryParams['type'];

    this.eventService.list(params).subscribe({
      next: (res) => {
        this.events = res.data;
        this.pagination = res.pagination ?? null;
        this.loading = false;
        if (this.events.length === 0 && !search && !category && !type) {
          this.router.navigateByUrl('/backoffice/events/new');
        }
      },
      error: (err) => { this.loading = false; this.errorMessage = err?.error?.message || 'Impossible de charger les événements.'; },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.page = page;
    this.fetchEvents();
  }

  get pages(): number[] {
    if (!this.pagination) return [];
    const total = this.pagination.totalPages;
    const cur   = this.pagination.currentPage;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
    return range;
  }

  isPast(event: EventModel): boolean { return new Date(event.endDate || event.startDate).getTime() <= Date.now(); }

  fillPct(event: EventModel): number {
    const count = event._bookedTickets ?? event.participantCount ?? event.participants?.length ?? 0;
    if (!event.capacity) return 0;
    return Math.min(100, Math.round((count / event.capacity) * 100));
  }

  async deleteEvent(event: EventModel): Promise<void> {
    const confirmed = await this.confirmDialog.ask({
      title: 'Supprimer cet événement ?',
      message: `"${event.title}" sera désactivé et ne sera plus visible par les utilisateurs.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!confirmed) return;

    this.eventService.delete(event._id).subscribe({
      next: () => { this.toast.success('Événement supprimé.'); this.fetchEvents(); },
      error: (err) => { this.toast.error(err?.error?.message || 'Impossible de supprimer cet événement.'); },
    });
  }
}
