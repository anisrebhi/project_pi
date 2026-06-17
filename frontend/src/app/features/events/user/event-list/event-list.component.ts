import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { EventService } from '../../../../core/services/event.service';
import { EventModel, EventQueryParams } from '../../../../core/models/event.model';
import { Pagination } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-user-event-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css',
})
export class UserEventListComponent implements OnInit {
  private fb = inject(FormBuilder);

  events: EventModel[] = [];
  pagination: Pagination | null = null;
  loading = true;
  errorMessage = '';

  page = 1;
  readonly limit = 9;

  filters = this.fb.group({
    search: [''],
    category: [''],
  });

  readonly categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'conference', label: 'Conférence' },
    { value: 'workshop', label: 'Atelier' },
    { value: 'meeting', label: 'Réunion' },
    { value: 'sport', label: 'Sport' },
    { value: 'other', label: 'Autre' },
  ];

  constructor(private eventService: EventService) {}

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

    const { search, category } = this.filters.getRawValue();
    const params: EventQueryParams = { page: this.page, limit: this.limit };
    if (search) params.search = search;
    if (category) params.category = category as EventQueryParams['category'];

    // Only future, non-full, active events are relevant to participants.
    this.eventService.listUpcoming(params).subscribe({
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

  spotsLeft(event: EventModel): number {
    if (event.availableSpots !== undefined) return event.availableSpots;
    return event.capacity - (event.participantCount ?? event.participants?.length ?? 0);
  }
}
