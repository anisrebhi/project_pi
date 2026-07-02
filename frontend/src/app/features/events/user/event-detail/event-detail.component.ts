import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { EventService }          from '../../../../core/services/event.service';
import { ReservationService }    from '../../../../core/services/reservation.service';
import { PromoCodeService, PromoCodeValidation } from '../../../../core/services/promo-code.service';
import { AuthService }           from '../../../../core/services/auth.service';
import { ToastService }          from '../../../../shared/components/toast/toast.service';

import {
  EventModel, computeAvailableSpots, computeIsFull,
  getEventImageUrl, TicketType,
} from '../../../../core/models/event.model';

import { getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';
import { ManageCertificatesComponent }        from '../../../certificates/manage-certificates.component';
import { EventReviewsComponent }              from '../../../reviews/event-reviews.component';
import { EventGalleryComponent }              from '../../../photos/event-gallery.component';
import { SimilarEventsComponent }             from '../../../recommendations/similar-events.component';
import { EventChatComponent }                 from '../../../chat/event-chat.component';

const defaultIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41], iconAnchor:  [12, 41],
  popupAnchor: [1, -34], shadowSize: [41, 41],
});

type SidebarMode =
  | 'loading'
  | 'reserve'
  | 'full'
  | 'success'
  | 'past';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    EventReviewsComponent, EventGalleryComponent,
    SimilarEventsComponent, EventChatComponent,
    ManageCertificatesComponent,
  ],
  templateUrl: './event-detail.component.html',
  styleUrl:    './event-detail.component.css',
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb                 = inject(FormBuilder);
  private route              = inject(ActivatedRoute);
  private router             = inject(Router);
  private eventService       = inject(EventService);
  private reservationService = inject(ReservationService);
  private promoCodeService   = inject(PromoCodeService);
  auth                       = inject(AuthService);
  private toast              = inject(ToastService);

  @ViewChild('mapDiv') mapDivRef!: ElementRef<HTMLDivElement>;

  event:            EventModel | null = null;
  loading           = true;
  errorMessage      = '';
  reserving         = false;
  reservationError  = '';
  reservationSuccess = false;

  private map: L.Map | null = null;

  getCategoryEmoji = getCategoryEmoji;
  getCategoryLabel = getCategoryLabel;
  getEventImageUrl = getEventImageUrl;

  form = this.fb.group({
    numberOfTickets: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    ticketType:      [''],
    promoCode:       [''],
  });

  appliedPromo:     PromoCodeValidation | null = null;
  promoCheckLoading = false;
  promoError        = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigateByUrl('/events'); return; }

    this.eventService.getById(id).subscribe({
      next: (res) => {
        this.event   = res.data;
        this.loading = false;

        this.form.get('numberOfTickets')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.maxTickets),
        ]);
        this.form.get('numberOfTickets')?.setValue(1, { emitEvent: false });
        this.form.get('numberOfTickets')?.updateValueAndValidity();

        if (this.hasTicketTypes) {
          this.form.get('ticketType')?.setValidators([Validators.required]);
          this.form.get('ticketType')?.setValue(this.event!.ticketTypes![0].name);
          this.form.get('ticketType')?.updateValueAndValidity();
        }

        setTimeout(() => this.initMap(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger cet événement.';
      },
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMap(): void {
    const lat = this.event?.location?.latitude;
    const lng = this.event?.location?.longitude;
    if (!lat || !lng || !this.mapDivRef?.nativeElement || this.map) return;

    this.map = L.map(this.mapDivRef.nativeElement, {
      center: [lat, lng], zoom: 15,
      scrollWheelZoom: false, dragging: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);
    L.marker([lat, lng], { icon: defaultIcon })
      .addTo(this.map).bindPopup(this.event!.title).openPopup();
    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  get spotsLeft(): number { return this.event ? computeAvailableSpots(this.event) : 0; }
  get isFull():    boolean { return this.event ? computeIsFull(this.event) : false; }
  get isPast():    boolean {
    return this.event ? new Date(this.event.startDate).getTime() <= Date.now() : false;
  }
  get canReserve(): boolean { return !this.isPast && !this.isFull; }

  get maxTickets(): number {
    return Math.max(1, Math.min(20, this.spotsLeft));
  }

  get hasTicketTypes(): boolean {
    return !!(this.event?.ticketTypes && this.event.ticketTypes.length > 0);
  }

  get selectedTicketType(): TicketType | null {
    if (!this.hasTicketTypes) return null;
    const name = this.form.get('ticketType')?.value;
    return this.event!.ticketTypes!.find((t) => t.name === name) || null;
  }

  get unitPrice(): number {
    if (!this.event) return 0;
    if (!this.hasTicketTypes) return this.event.price;
    const tt = this.selectedTicketType;
    if (!tt) return 0;
    return this.isEarlyBirdActive(tt) ? (tt.earlyBird?.price ?? tt.price) : tt.price;
  }

  get totalPrice(): number {
    const gross    = this.unitPrice * (Number(this.form.get('numberOfTickets')?.value) || 0);
    const discount = this.appliedPromo ? this.computeDiscount(gross) : 0;
    return Math.max(0, gross - discount);
  }

  isEarlyBirdActive(tt: TicketType): boolean {
    return !!(tt.earlyBird?.enabled && tt.earlyBird.deadline
      && new Date(tt.earlyBird.deadline).getTime() > Date.now());
  }

  private computeDiscount(amount: number): number {
    if (!this.appliedPromo) return 0;
    return this.appliedPromo.discountType === 'percentage'
      ? Math.round(amount * this.appliedPromo.discountValue) / 100
      : Math.min(amount, this.appliedPromo.discountValue);
  }

  fillPct(): number {
    if (!this.event?.capacity) return 0;
    const booked = this.event._bookedTickets ?? this.event.participantCount ?? this.event.participants?.length ?? 0;
    const remaining = Math.max(0, this.event.capacity - booked);
    return Math.round((remaining / this.event.capacity) * 100);
  }

  get sidebarMode(): SidebarMode {
    if (this.loading)                            return 'loading';
    if (this.reservationSuccess)                 return 'success';
    if (this.isPast)                             return 'past';
    if (this.canReserve)                         return 'reserve';
    if (this.isFull)                             return 'full';
    return 'reserve';
  }

  // ── Ticket qty helpers ──────────────────────────────────────────────────────
  decrementTickets(): void {
    const ctrl = this.form.get('numberOfTickets');
    if (!ctrl) return;
    const val = Math.max(1, (ctrl.value ?? 1) - 1);
    ctrl.setValue(val);
  }
  incrementTickets(): void {
    const ctrl = this.form.get('numberOfTickets');
    if (!ctrl) return;
    const val = Math.min(this.maxTickets, (ctrl.value ?? 1) + 1);
    ctrl.setValue(val);
  }

  // ── Promo codes ─────────────────────────────────────────────────────────────
  applyPromoCode(): void {
    const code = this.form.get('promoCode')?.value?.trim();
    if (!code || !this.event) return;
    this.promoCheckLoading = true;
    this.promoError = '';
    this.promoCodeService.validate(code, this.event._id).subscribe({
      next: (res) => {
        this.promoCheckLoading = false;
        this.appliedPromo = res.data;
        this.toast.success('Code promo appliqué ✓');
      },
      error: (err) => {
        this.promoCheckLoading = false;
        this.appliedPromo = null;
        this.promoError = err?.error?.message || 'Code promo invalide.';
      },
    });
  }

  removePromoCode(): void {
    this.appliedPromo = null;
    this.promoError   = '';
    this.form.get('promoCode')?.setValue('');
  }

  // ── Reservation ─────────────────────────────────────────────────────────────
  private loadCurrentEvent(): void {
    if (!this.event) return;
    const id = this.event._id;
    this.eventService.getById(id).subscribe({
      next: (res) => { this.event = res.data; },
    });
  }

  reserve(): void {
    if (!this.event || !this.canReserve) return;

    const raw     = Number(this.form.get('numberOfTickets')?.value);
    const clamped = Math.min(Math.max(Math.round(raw) || 1, 1), this.maxTickets);
    if (clamped !== raw) this.form.get('numberOfTickets')?.setValue(clamped);

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.reserving       = true;
    this.reservationError = '';

    this.reservationService.create({
      eventId:         this.event._id,
      numberOfTickets: clamped,
      ticketType:      this.hasTicketTypes
        ? ((this.form.get('ticketType')?.value || undefined) as any)
        : undefined,
      promoCode:       this.appliedPromo ? this.appliedPromo.code : undefined,
    }).subscribe({
      next: (res) => {
        this.reserving          = false;
        this.reservationSuccess = true;
        this.toast.success('Réservation confirmée ! Un email avec votre QR code a été envoyé.');
        this.loadCurrentEvent();
        setTimeout(() => this.router.navigateByUrl(`/my-reservations/${res.data._id}`), 1500);
      },
      error: (err) => {
        this.reserving = false;
        this.reservationError = this.extractErrorMessage(err) || 'Impossible de créer la réservation.';
      },
    });
  }

  private extractErrorMessage(err: any): string | null {
    const fieldErrors = err?.error?.errors;
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors.map((e: any) => e.message).join(' ');
    }
    return err?.error?.message ?? null;
  }

  // ── Organizer helpers ───────────────────────────────────────────────────────
  get organizerName(): string | null {
    const org = this.event?.organizer;
    if (!org) return null;
    if (typeof org === 'object' && 'fullName' in org) return org.fullName;
    return null;
  }
  get organizerEmail(): string | null {
    const org = this.event?.organizer;
    if (!org) return null;
    if (typeof org === 'object' && 'email' in org) return org.email;
    return null;
  }

  get locationAddress(): string | null {
    return this.event?.location?.address ?? null;
  }

  // ── Lot-2 helpers ────────────────────────────────────────────────────────────
  get isEventPast(): boolean {
    if (!this.event) return false;
    return new Date((this.event as any).endDate) < new Date();
  }

  get isOrganizer(): boolean {
    const me = this.auth.currentUser();
    if (!me || !this.event) return false;
    const organizer = (this.event as any).organizer;
    const orgId     = organizer?._id || organizer;
    return me._id === orgId || me.role === 'ADMIN';
  }

  get hasConfirmedReservation(): boolean {
    return !!(this.event as any)?._hasReservation;
  }
}
