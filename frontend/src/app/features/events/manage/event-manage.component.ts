import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { EventService } from '../../../core/services/event.service';
import { EventModel, EventInput, EventQueryParams } from '../../../core/models/event.model';
import { Pagination } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { dateRangeValidator, futureDateValidator } from '../../../shared/validators/date.validators';
import {
  fromDatetimeLocalValue,
  nowAsDatetimeLocal,
  toDatetimeLocalValue,
} from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-event-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-manage.component.html',
  styleUrl: './event-manage.component.css',
})
export class EventManageComponent implements OnInit {
  private fb = inject(FormBuilder);

  // ── List state ──────────────────────────────────────────────────────────
  events: EventModel[] = [];
  pagination: Pagination | null = null;
  loading = true;
  listError = '';
  page = 1;
  readonly limit = 10;

  // ── Modal state ─────────────────────────────────────────────────────────
  modalOpen = false;
  isEditMode = false;
  editingId: string | null = null;
  submitting = false;
  loadingEvent = false;
  serverError = '';

  // ── Delete state ─────────────────────────────────────────────────────────
  deletingId: string | null = null;
  confirmDeleteId: string | null = null;

  readonly minDateTime = nowAsDatetimeLocal();

  readonly categories = [
    { value: '', label: 'Toutes' },
    { value: 'conference', label: 'Conférence' },
    { value: 'workshop', label: 'Atelier' },
    { value: 'meeting', label: 'Réunion' },
    { value: 'sport', label: 'Sport' },
    { value: 'other', label: 'Autre' },
  ];

  readonly formCategories = this.categories.filter((c) => c.value !== '');

  // ── Filters form ─────────────────────────────────────────────────────────
  filters = this.fb.group({
    search: [''],
    category: [''],
    type: [''],
  });

  // ── Event form ───────────────────────────────────────────────────────────
  form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(2000)]],
      category: ['conference'],
      address: [''],
      startDate: ['', [Validators.required, futureDateValidator]],
      endDate: ['', [Validators.required]],
      capacity: [50, [Validators.required, Validators.min(1), Validators.max(100000)]],
      type: ['free' as 'free' | 'paid', [Validators.required]],
      price: [0, [Validators.min(0)]],
    },
    { validators: dateRangeValidator },
  );

  constructor(
    private eventService: EventService,
    private toast: ToastService,
  ) {}

  get f() {
    return this.form.controls;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fetchEvents();

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page = 1;
      this.fetchEvents();
    });

    // Free events have no price
    this.f['type'].valueChanges.subscribe((type) => {
      if (type === 'free') {
        this.f['price'].setValue(0);
        this.f['price'].clearValidators();
      } else {
        this.f['price'].setValidators([Validators.required, Validators.min(0.01)]);
      }
      this.f['price'].updateValueAndValidity();
    });
  }

  // ── List ──────────────────────────────────────────────────────────────────
  fetchEvents(): void {
    this.loading = true;
    this.listError = '';

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
        this.listError = err?.error?.message || 'Impossible de charger les événements.';
      },
    });
  }

  goToPage(p: number): void {
    if (p < 1 || (this.pagination && p > this.pagination.totalPages)) return;
    this.page = p;
    this.fetchEvents();
  }

  isPast(event: EventModel): boolean {
    return new Date(event.startDate).getTime() <= Date.now();
  }

  spotsLeft(event: EventModel): number {
    if (event.availableSpots !== undefined) return event.availableSpots;
    return event.capacity - (event.participantCount ?? event.participants?.length ?? 0);
  }

  // ── Modal — Create ────────────────────────────────────────────────────────
  openCreate(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.serverError = '';
    this.form.reset({
      title: '',
      description: '',
      category: 'conference',
      address: '',
      startDate: '',
      endDate: '',
      capacity: 50,
      type: 'free',
      price: 0,
    });
    this.modalOpen = true;
  }

  // ── Modal — Edit ──────────────────────────────────────────────────────────
  openEdit(event: EventModel): void {
    this.isEditMode = true;
    this.editingId = event._id;
    this.serverError = '';
    this.loadingEvent = true;
    this.modalOpen = true;

    this.eventService.getById(event._id).subscribe({
      next: (res) => {
        const e = res.data;
        this.form.patchValue({
          title: e.title,
          description: e.description || '',
          category: e.category || 'conference',
          address: e.location?.address || '',
          startDate: toDatetimeLocalValue(e.startDate),
          endDate: toDatetimeLocalValue(e.endDate),
          capacity: e.capacity,
          type: e.type,
          price: e.price,
        });
        this.loadingEvent = false;
      },
      error: (err) => {
        this.loadingEvent = false;
        this.serverError = err?.error?.message || 'Impossible de charger cet événement.';
      },
    });
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.serverError = '';

    const raw = this.form.getRawValue();
    const payload: EventInput = {
      title: raw.title!,
      description: raw.description || undefined,
      category: raw.category as EventInput['category'],
      location: { address: raw.address || '' },
      startDate: fromDatetimeLocalValue(raw.startDate!),
      endDate: fromDatetimeLocalValue(raw.endDate!),
      capacity: Number(raw.capacity),
      type: raw.type as EventInput['type'],
      price: raw.type === 'paid' ? Number(raw.price) : 0,
    };

    const request = this.isEditMode
      ? this.eventService.update(this.editingId!, payload)
      : this.eventService.create(payload);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success(
          this.isEditMode ? 'Événement mis à jour.' : 'Événement créé avec succès.',
        );
        this.modalOpen = false;
        this.fetchEvents();
      },
      error: (err) => {
        this.submitting = false;
        this.serverError = err?.error?.message || 'Une erreur est survenue.';
      },
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  askDelete(event: EventModel): void {
    this.confirmDeleteId = event._id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(event: EventModel): void {
    this.deletingId = event._id;
    this.confirmDeleteId = null;

    this.eventService.delete(event._id).subscribe({
      next: () => {
        this.deletingId = null;
        this.toast.success('Événement supprimé.');
        this.fetchEvents();
      },
      error: (err) => {
        this.deletingId = null;
        this.toast.error(err?.error?.message || 'Impossible de supprimer cet événement.');
      },
    });
  }
}
