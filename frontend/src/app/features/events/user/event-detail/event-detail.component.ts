import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../../../core/services/event.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { EventModel } from '../../../../core/models/event.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements OnInit {
  private fb = inject(FormBuilder);

  event: EventModel | null = null;
  loading = true;
  errorMessage = '';

  reserving = false;
  reservationError = '';
  reservationSuccess = false;

  form = this.fb.group({
    numberOfTickets: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private reservationService: ReservationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/events');
      return;
    }

    this.eventService.getById(id).subscribe({
      next: (res) => {
        this.event = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger cet événement.';
      },
    });
  }

  get isPast(): boolean {
    if (!this.event) return false;
    return new Date(this.event.startDate).getTime() <= Date.now();
  }

  get spotsLeft(): number {
    if (!this.event) return 0;
    if (this.event.availableSpots !== undefined) return this.event.availableSpots;
    return this.event.capacity - (this.event.participantCount ?? this.event.participants?.length ?? 0);
  }

  get isFull(): boolean {
    return this.spotsLeft <= 0;
  }

  get canReserve(): boolean {
    return !this.isPast && !this.isFull;
  }

  get totalPrice(): number {
    if (!this.event) return 0;
    const tickets = Number(this.form.get('numberOfTickets')?.value) || 0;
    return this.event.price * tickets;
  }

  reserve(): void {
    if (!this.event || this.form.invalid || !this.canReserve) {
      this.form.markAllAsTouched();
      return;
    }

    this.reserving = true;
    this.reservationError = '';

    this.reservationService
      .create({
        eventId: this.event._id,
        numberOfTickets: Number(this.form.get('numberOfTickets')?.value),
      })
      .subscribe({
        next: (res) => {
          this.reserving = false;
          this.reservationSuccess = true;
          this.toast.success('Réservation confirmée ! Un email de confirmation avec votre QR code vous a été envoyé.');
          // Brief pause so the success state is visible before navigating.
          setTimeout(() => this.router.navigateByUrl(`/my-reservations/${res.data._id}`), 1200);
        },
        error: (err) => {
          this.reserving = false;
          this.reservationError = err?.error?.message || 'Impossible de créer la réservation.';
        },
      });
  }
}
