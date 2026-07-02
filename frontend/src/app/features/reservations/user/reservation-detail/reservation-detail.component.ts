import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ReservationService } from '../../../../core/services/reservation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Reservation, ReservationEvent, ReservationUser } from '../../../../core/models/reservation.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.css',
})
export class ReservationDetailComponent implements OnInit {
  reservation: Reservation | null = null;
  loading = true;
  errorMessage = '';
  downloading = false;
  cancelling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private auth: AuthService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const userId = this.auth.currentUser()?._id;

    if (!id || !userId) {
      this.router.navigateByUrl('/my-reservations');
      return;
    }

    // Reservations have no direct "get by id" endpoint (by design — see
    // backend security rules), so the detail view is resolved from the
    // user's own reservation list.
    this.reservationService.listForUser(userId, { limit: 100 }).subscribe({
      next: (res) => {
        this.reservation = res.data.reservations.find((r) => r._id === id) ?? null;
        this.loading = false;
        if (!this.reservation) {
          this.errorMessage = 'Réservation introuvable.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger cette réservation.';
      },
    });
  }

  get event(): ReservationEvent | null {
    return (this.reservation?.event as ReservationEvent) ?? null;
  }

  get user(): ReservationUser | null {
    return (this.reservation?.user as ReservationUser) ?? null;
  }

  downloadTicket(): void {
    if (!this.reservation) return;
    this.downloading = true;

    this.reservationService.downloadTicket(this.reservation._id).subscribe({
      next: (blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `billet-${this.reservation!._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.downloading = false;
        this.toast.error(err?.error?.message || 'Impossible de télécharger le billet PDF.');
      },
    });
  }

  async cancelReservation(): Promise<void> {
    if (!this.reservation) return;

    const confirmed = await this.confirmDialog.ask({
      title: 'Annuler votre réservation ?',
      message: `Votre réservation pour "${this.event?.title}" sera annulée. Cette action est irréversible.`,
      confirmLabel: 'Annuler la réservation',
      danger: true,
    });
    if (!confirmed) return;

    this.cancelling = true;
    this.reservationService.cancel(this.reservation._id).subscribe({
      next: (res) => {
        this.cancelling = false;
        this.reservation = res.data;
        this.toast.success('Réservation annulée.');
      },
      error: (err) => {
        this.cancelling = false;
        this.toast.error(err?.error?.message || "Impossible d'annuler cette réservation.");
      },
    });
  }
}
