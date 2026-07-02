import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { ReservationService } from '../../../../core/services/reservation.service';
import { Reservation, ReservationEvent, ReservationQueryParams, ReservationUser } from '../../../../core/models/reservation.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-reservation-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.css',
})
export class AdminReservationListComponent implements OnInit {
  private fb = inject(FormBuilder);

  reservations: Reservation[] = [];
  pagination: Pagination | null = null;
  loading = true;
  errorMessage = '';

  page = 1;
  readonly limit = 15;

  filters = this.fb.group({
    status: [''],
    search: [''],
  });

  constructor(
    private reservationService: ReservationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    this.fetchReservations();

    this.filters.valueChanges.pipe(debounceTime(250)).subscribe(() => {
      this.page = 1;
      this.fetchReservations();
    });
  }

  fetchReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    const { status } = this.filters.getRawValue();
    const params: ReservationQueryParams = { page: this.page, limit: this.limit };
    if (status) params.status = status as ReservationQueryParams['status'];

    this.reservationService.list(params).subscribe({
      next: (res) => {
        this.reservations = res.data;
        this.pagination = res.pagination ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les réservations.';
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.page = page;
    this.fetchReservations();
  }

  /** Client-side text search over the currently loaded page (by user / event). */
  get visibleReservations(): Reservation[] {
    const search = (this.filters.get('search')?.value || '').trim().toLowerCase();
    if (!search) return this.reservations;

    return this.reservations.filter((r) => {
      const user = r.user as ReservationUser;
      const event = r.event as ReservationEvent;
      const haystack = `${user?.fullName ?? ''} ${user?.email ?? ''} ${event?.title ?? ''}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  asUser(r: Reservation): ReservationUser {
    return r.user as ReservationUser;
  }

  asEvent(r: Reservation): ReservationEvent {
    return r.event as ReservationEvent;
  }

  async cancelReservation(reservation: Reservation): Promise<void> {
    const confirmed = await this.confirmDialog.ask({
      title: 'Annuler cette réservation ?',
      message: `La réservation de ${this.asUser(reservation)?.fullName || 'cet utilisateur'} pour "${this.asEvent(reservation)?.title || 'cet événement'}" sera annulée.`,
      confirmLabel: 'Annuler la réservation',
      danger: true,
    });
    if (!confirmed) return;

    this.reservationService.cancel(reservation._id, 'Annulée par un administrateur').subscribe({
      next: () => {
        this.toast.success('Réservation annulée.');
        this.fetchReservations();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || "Impossible d'annuler cette réservation.");
      },
    });
  }
}
