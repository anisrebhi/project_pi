import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../../../core/services/event.service';
import { EventInput } from '../../../../core/models/event.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { dateRangeValidator, futureDateValidator } from '../../../../shared/validators/date.validators';
import { fromDatetimeLocalValue, nowAsDatetimeLocal, toDatetimeLocalValue } from '../../../../shared/utils/date-utils';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css',
})
export class EventFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  eventId: string | null = null;
  isEditMode = false;

  loading = false;
  loadingEvent = false;
  serverError = '';

  readonly minDateTime = nowAsDatetimeLocal();

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
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
  ) {}

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    if (this.isEditMode) {
      this.loadEvent(this.eventId!);
    }

    // Free events have no price
    this.f.type.valueChanges.subscribe((type) => {
      if (type === 'free') {
        this.f.price.setValue(0);
        this.f.price.clearValidators();
      } else {
        this.f.price.setValidators([Validators.required, Validators.min(0.01)]);
      }
      this.f.price.updateValueAndValidity();
    });
  }

  private loadEvent(id: string): void {
    this.loadingEvent = true;
    this.eventService.getById(id).subscribe({
      next: (res) => {
        const event = res.data;
        this.form.patchValue({
          title: event.title,
          description: event.description || '',
          category: event.category || 'conference',
          address: event.location?.address || '',
          startDate: toDatetimeLocalValue(event.startDate),
          endDate: toDatetimeLocalValue(event.endDate),
          capacity: event.capacity,
          type: event.type,
          price: event.price,
        });
        this.loadingEvent = false;
      },
      error: (err) => {
        this.loadingEvent = false;
        this.serverError = err?.error?.message || "Impossible de charger cet événement.";
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
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
      ? this.eventService.update(this.eventId!, payload)
      : this.eventService.create(payload);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.toast.success(this.isEditMode ? 'Événement mis à jour avec succès.' : 'Événement créé avec succès.');
        this.router.navigateByUrl('/admin/events');
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err?.error?.message || "Une erreur est survenue. Vérifiez les informations saisies.";
      },
    });
  }
}
