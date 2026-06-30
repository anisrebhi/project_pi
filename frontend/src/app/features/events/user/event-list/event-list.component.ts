<<<<<<< HEAD
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { EventService }  from '../../../../core/services/event.service';
import {
  EventModel, EventQueryParams,
  computeAvailableSpots, computeIsFull,
  getEventImageUrl, EventOrganizer,
} from '../../../../core/models/event.model';
import { Pagination }    from '../../../../core/models/api-response.model';
import {
  FILTER_CATEGORIES,
  getCategoryEmoji, getCategoryLabel,
  getCategoryColor, getCategoryGradient,
  getCategoryMeta,
} from '../../../../core/utils/category.utils';
=======
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { EventService }  from '../../../../core/services/event.service';
import { EventModel, EventQueryParams, computeAvailableSpots, computeIsFull, getEventImageUrl } from '../../../../core/models/event.model';
import { Pagination }    from '../../../../core/models/api-response.model';
import { FILTER_CATEGORIES, getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

@Component({
  selector: 'app-user-event-list',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './event-list.component.html',
  styleUrl:    './event-list.component.css',
})
export class UserEventListComponent implements OnInit, OnDestroy {
  private fb       = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  events:     EventModel[]    = [];
=======
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-list.component.html',
  styleUrl:    './event-list.component.css',
})
export class UserEventListComponent implements OnInit {
  private fb = inject(FormBuilder);

  events: EventModel[]    = [];
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  pagination: Pagination | null = null;
  loading      = true;
  errorMessage = '';

  page = 1;
  readonly limit = 9;

<<<<<<< HEAD
  filters = this.fb.group({
    search:   [''],
    category: [''],
    type:     [''],
    sortBy:   ['startDate'],
  });

  readonly categories = FILTER_CATEGORIES;

  // Expose utility functions to template
  getCategoryEmoji      = getCategoryEmoji;
  getCategoryLabel      = getCategoryLabel;
  getCategoryColor      = getCategoryColor;
  getCategoryGradient   = getCategoryGradient;
  getEventImageUrl      = getEventImageUrl;
  computeAvailableSpots = computeAvailableSpots;
  computeIsFull         = computeIsFull;

  getCategorySvg(cat: string): string {
    return getCategoryMeta(cat).svgIcon;
  }

  asOrganizer(org: any): EventOrganizer {
    return typeof org === 'string'
      ? { _id: org, fullName: '', email: '' }
      : (org as EventOrganizer);
  }

  resetFilters(): void {
    this.filters.reset({ search: '', category: '', type: '', sortBy: 'startDate' });
  }

  get pageNumbers(): number[] { return this.pages; }
=======
  filters = this.fb.group({ search: [''], category: [''] });
  readonly categories = FILTER_CATEGORIES;

  getCategoryEmoji   = getCategoryEmoji;
  getCategoryLabel   = getCategoryLabel;
  getEventImageUrl   = getEventImageUrl;
  computeAvailableSpots = computeAvailableSpots;
  computeIsFull      = computeIsFull;
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.fetchEvents();
<<<<<<< HEAD
    this.filters.valueChanges
      .pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.fetchEvents(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
=======
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => { this.page = 1; this.fetchEvents(); });
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  }

  fetchEvents(): void {
    this.loading = true;
    this.errorMessage = '';
<<<<<<< HEAD

    const { search, category, type, sortBy } = this.filters.getRawValue();
    const params: EventQueryParams = {
      page:  this.page,
      limit: this.limit,
      order: 'asc',
    };
    if (search)   params.search   = search!;
    if (category) params.category = category as EventQueryParams['category'];
    if (type)     params.type     = type as EventQueryParams['type'];
    if (sortBy)   params.sortBy   = sortBy!;

    // Use list() (not listUpcoming) so ALL events are visible regardless of date.
    // Events with startDate in the past are still valuable (for history).
    this.eventService.list(params).subscribe({
      next: (res) => {
        this.events     = res.data;
        this.pagination = res.pagination ?? null;
        this.loading    = false;
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err?.userMessage
          || err?.error?.message
          || 'Impossible de charger les événements.';
      },
=======
    const { search, category } = this.filters.getRawValue();
    const params: EventQueryParams = { page: this.page, limit: this.limit };
    if (search)   params.search   = search;
    if (category) params.category = category as EventQueryParams['category'];

    this.eventService.listUpcoming(params).subscribe({
      next: (res) => { this.events = res.data; this.pagination = res.pagination ?? null; this.loading = false; },
      error: (err) => { this.loading = false; this.errorMessage = err?.error?.message || 'Impossible de charger les événements.'; },
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.page = page;
<<<<<<< HEAD
    window.scrollTo({ top: 0, behavior: 'smooth' });
=======
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    this.fetchEvents();
  }

  get pages(): number[] {
    if (!this.pagination) return [];
<<<<<<< HEAD
    const total = this.pagination.totalPages;
    const cur   = this.pagination.currentPage;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) {
      range.push(i);
    }
=======
    const total = this.pagination.totalPages, cur = this.pagination.currentPage;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    return range;
  }

  fillPct(event: EventModel): number {
    const count = event.participantCount ?? event.participants?.length ?? 0;
    return event.capacity ? Math.min(100, Math.round((count / event.capacity) * 100)) : 0;
  }
}
