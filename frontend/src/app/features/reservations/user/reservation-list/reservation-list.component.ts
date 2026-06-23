import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { ReservationService } from '../../../../core/services/reservation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Reservation, ReservationEvent, ReservationQueryParams } from '../../../../core/models/reservation.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';

@Component({
  selector: 'app-user-reservation-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.css',
})
export class UserReservationListComponent implements OnInit {
  private fb = inject(FormBuilder);

  reservations: Reservation[] = [];
  pagination: Pagination | null = null;
  loading = true;
  errorMessage = '';

  page = 1;
  readonly limit = 10;

  filters = this.fb.group({
    status: [''],
  });

  constructor(
    private reservationService: ReservationService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.fetchReservations();

    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => {
      this.page = 1;
      this.fetchReservations();
    });
  }

  fetchReservations(): void {
    const userId = this.auth.currentUser()?._id;
    if (!userId) return;

    this.loading = true;
    this.errorMessage = '';

    const { status } = this.filters.getRawValue();
    const params: ReservationQueryParams = { page: this.page, limit: this.limit };
    if (status) params.status = status as ReservationQueryParams['status'];

    this.reservationService.listForUser(userId, params).subscribe({
      next: (res) => {
        this.reservations = res.data.reservations;
        this.pagination = res.pagination ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger vos réservations.';
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) return;
    this.page = page;
    this.fetchReservations();
  }

  asEvent(r: Reservation): ReservationEvent {
    return r.event as ReservationEvent;
  }

  getCategoryEmoji = getCategoryEmoji;
  getCategoryLabel = getCategoryLabel;
}
