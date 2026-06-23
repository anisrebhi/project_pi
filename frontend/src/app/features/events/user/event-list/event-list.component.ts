import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { EventService }  from '../../../../core/services/event.service';
import { EventModel, EventQueryParams, computeAvailableSpots, computeIsFull, getEventImageUrl } from '../../../../core/models/event.model';
import { Pagination }    from '../../../../core/models/api-response.model';
import { FILTER_CATEGORIES, getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';

@Component({
  selector: 'app-user-event-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-list.component.html',
  styleUrl:    './event-list.component.css',
})
export class UserEventListComponent implements OnInit {
  private fb = inject(FormBuilder);

  events: EventModel[]    = [];
  pagination: Pagination | null = null;
  loading      = true;
  errorMessage = '';

  page = 1;
  readonly limit = 9;

  filters = this.fb.group({ search: [''], category: [''] });
  readonly categories = FILTER_CATEGORIES;

  getCategoryEmoji   = getCategoryEmoji;
  getCategoryLabel   = getCategoryLabel;
  getEventImageUrl   = getEventImageUrl;
  computeAvailableSpots = computeAvailableSpots;
  computeIsFull      = computeIsFull;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.fetchEvents();
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => { this.page = 1; this.fetchEvents(); });
  }

  fetchEvents(): void {
    this.loading = true;
    this.errorMessage = '';
    const { search, category } = this.filters.getRawValue();
    const params: EventQueryParams = { page: this.page, limit: this.limit };
    if (search)   params.search   = search;
    if (category) params.category = category as EventQueryParams['category'];

    this.eventService.listUpcoming(params).subscribe({
      next: (res) => { this.events = res.data; this.pagination = res.pagination ?? null; this.loading = false; },
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
    const total = this.pagination.totalPages, cur = this.pagination.currentPage;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
    return range;
  }

  fillPct(event: EventModel): number {
    const count = event.participantCount ?? event.participants?.length ?? 0;
    return event.capacity ? Math.min(100, Math.round((count / event.capacity) * 100)) : 0;
  }
}
