import { Component, OnInit, inject, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { EventService }       from '../../../../core/services/event.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { PromoCodeService, PromoCodeValidation } from '../../../../core/services/promo-code.service';
import { WaitlistService }    from '../../../../core/services/waitlist.service';
import { WaitlistEntry }      from '../../../../core/models/waitlist.model';
import { EventModel, computeAvailableSpots, computeIsFull, getEventImageUrl, TicketType } from '../../../../core/models/event.model';
import { ToastService }       from '../../../../shared/components/toast/toast.service';
import { getCategoryEmoji, getCategoryLabel } from '../../../../core/utils/category.utils';
import { AuthService }              from '../../../../core/services/auth.service';
import { CertificateService }        from '../../../../core/services/certificate.service';
import { EventReviewsComponent }    from '../../../reviews/event-reviews.component';
import { EventGalleryComponent }    from '../../../photos/event-gallery.component';
import { SimilarEventsComponent }   from '../../../recommendations/similar-events.component';
import { EventChatComponent }       from '../../../chat/event-chat.component';


const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EventReviewsComponent, EventGalleryComponent, SimilarEventsComponent, EventChatComponent],
  templateUrl: './event-detail.component.html',
  styleUrl:    './event-detail.component.css',
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  @ViewChild('mapDiv') mapDivRef!: ElementRef<HTMLDivElement>;

  event: EventModel | null = null;
  loading      = true;
  errorMessage = '';
  reserving    = false;
  reservationError = '';
  reservationSuccess = false;

  private map: L.Map | null = null;

  getCategoryEmoji = getCategoryEmoji;
  getCategoryLabel = getCategoryLabel;
  getEventImageUrl = getEventImageUrl;

  form = this.fb.group({
    numberOfTickets: [1, [Validators.required, Validators.min(1), Validators.max(1)]],
    ticketType: [''],
    promoCode: [''],
  });

  appliedPromo: PromoCodeValidation | null = null;
  promoCheckLoading = false;
  promoError = '';

  // Waitlist
  waitlistEntry: WaitlistEntry | null = null;
  waitlistPosition: number | null = null;
  waitlistTotal: number | null = null;
  waitlistLoading = false;
  showWaitlistBanner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private reservationService: ReservationService,
    private promoCodeService: PromoCodeService,
    private waitlistService: WaitlistService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigateByUrl('/events'); return; }

    this.eventService.getById(id).subscribe({
      next:  (res) => {
        this.event = res.data;
        this.loading = false;

        // Le nombre de billets démarre toujours à 1, jamais pré-rempli avec
        // une autre valeur (ex. autofill navigateur), et sa borne max suit
        // à la fois les places disponibles ET la limite API (max 20/réservation).
        this.form.get('numberOfTickets')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.maxTickets),
        ]);
        this.form.get('numberOfTickets')?.setValue(1, { emitEvent: false });
        this.form.get('numberOfTickets')?.updateValueAndValidity();

        if (this.hasTicketTypes) {
          this.form.get('ticketType')?.setValidators([Validators.required]);
          this.form.get('ticketType')?.setValue(this.event.ticketTypes![0].name);
          this.form.get('ticketType')?.updateValueAndValidity();
        }

        setTimeout(() => this.initMap(), 0);
        // Check if user is on waitlist
        this.checkWaitlistStatus();
      },
      error: (err) => { this.loading = false; this.errorMessage = err?.error?.message || 'Impossible de charger cet événement.'; },
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
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: false,
      dragging: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    L.marker([lat, lng], { icon: defaultIcon }).addTo(this.map)
      .bindPopup(this.event!.title)
      .openPopup();

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  get spotsLeft(): number { return this.event ? computeAvailableSpots(this.event) : 0; }
  get isFull():    boolean { return this.event ? computeIsFull(this.event) : false; }
  get isPast():    boolean { return this.event ? new Date(this.event.startDate).getTime() <= Date.now() : false; }
  get canReserve():boolean { return !this.isPast && !this.isFull; }

  /** Limite métier imposée par l'API (numberOfTickets doit être entre 1 et 20),
   *  combinée au nombre de places réellement disponibles pour cet événement. */
  get maxTickets(): number {
    return Math.max(1, Math.min(20, this.spotsLeft));
  }

  get totalPrice(): number {
    const gross = this.unitPrice * (Number(this.form.get('numberOfTickets')?.value) || 0);
    const discount = this.appliedPromo ? this.computeDiscount(gross) : 0;
    return Math.max(0, gross - discount);
  }

  get hasTicketTypes(): boolean {
    return !!(this.event?.ticketTypes && this.event.ticketTypes.length > 0);
  }

  get selectedTicketType(): TicketType | null {
    if (!this.hasTicketTypes) return null;
    const name = this.form.get('ticketType')?.value;
    return this.event!.ticketTypes!.find((t) => t.name === name) || null;
  }

  /** Resolves the unit price, accounting for an active Early Bird window. */
  get unitPrice(): number {
    if (!this.event) return 0;
    if (!this.hasTicketTypes) return this.event.price;
    const tt = this.selectedTicketType;
    if (!tt) return 0;
    return this.isEarlyBirdActive(tt) ? (tt.earlyBird?.price ?? tt.price) : tt.price;
  }

  isEarlyBirdActive(tt: TicketType): boolean {
    return !!(tt.earlyBird?.enabled && tt.earlyBird.deadline && new Date(tt.earlyBird.deadline).getTime() > Date.now());
  }

  private computeDiscount(amount: number): number {
    if (!this.appliedPromo) return 0;
    return this.appliedPromo.discountType === 'percentage'
      ? Math.round(amount * this.appliedPromo.discountValue) / 100
      : Math.min(amount, this.appliedPromo.discountValue);
  }

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
    this.promoError = '';
    this.form.get('promoCode')?.setValue('');
  }

  // ─── Waitlist ───────────────────────────────────────────────────────────────

  checkWaitlistStatus(): void {
    if (!this.event) return;
    this.waitlistService.checkPosition(this.event._id).subscribe({
      next: (res) => {
        if (res.data.onWaitlist) {
          this.waitlistEntry   = res.data.entry!;
          this.waitlistPosition = res.data.position!;
          this.waitlistTotal   = res.data.total!;
        }
      },
      error: () => {},
    });
  }

  joinWaitlist(): void {
    if (!this.event) return;
    this.waitlistLoading = true;
    this.waitlistService.join({
      eventId: this.event._id,
      numberOfTickets: Number(this.form.get('numberOfTickets')?.value) || 1,
      ticketType: this.hasTicketTypes ? (this.form.get('ticketType')?.value as any) : undefined,
    }).subscribe({
      next: (res) => {
        this.waitlistLoading = false;
        this.waitlistEntry   = res.data.entry;
        this.waitlistPosition = res.data.position;
        this.toast.success(`Vous êtes en liste d'attente — position #${res.data.position}`);
      },
      error: (err) => {
        this.waitlistLoading = false;
        this.toast.error(err?.error?.message || 'Impossible de rejoindre la liste d\'attente.');
      },
    });
  }

  leaveWaitlist(): void {
    if (!this.event) return;
    this.waitlistLoading = true;
    this.waitlistService.leave(this.event._id).subscribe({
      next: () => {
        this.waitlistLoading = false;
        this.waitlistEntry = null;
        this.waitlistPosition = null;
        this.toast.show('Vous avez quitté la liste d\'attente.', 'info');
      },
      error: (err) => {
        this.waitlistLoading = false;
        this.toast.error(err?.error?.message || 'Erreur.');
      },
    });
  }

  fillPct(): number {
    if (!this.event) return 0;
    const count = this.event.participantCount ?? this.event.participants?.length ?? 0;
    return Math.min(100, Math.round((count / this.event.capacity) * 100));
  }

  reserve(): void {
    if (!this.event || !this.canReserve) return;

    // Sécurité supplémentaire : on s'assure que la valeur réellement envoyée
    // respecte toujours les bornes (1 à maxTickets), même si le champ a été
    // altéré après coup par un autofill du navigateur ou une saisie manuelle
    // hors clavier (flèches, collage, etc.).
    const raw = Number(this.form.get('numberOfTickets')?.value);
    const clamped = Math.min(Math.max(Math.round(raw) || 1, 1), this.maxTickets);
    if (clamped !== raw) {
      this.form.get('numberOfTickets')?.setValue(clamped);
    }

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.reserving = true;
    this.reservationError = '';

    this.reservationService.create({
      eventId: this.event._id,
      numberOfTickets: clamped,
      ticketType: this.hasTicketTypes ? ((this.form.get('ticketType')?.value || undefined) as any) : undefined,
      promoCode: this.appliedPromo ? this.appliedPromo.code : undefined,
    }).subscribe({
      next: (res) => {
        this.reserving = false;
        this.reservationSuccess = true;
        this.toast.success('Réservation confirmée ! Un email avec votre QR code a été envoyé.');
        setTimeout(() => this.router.navigateByUrl(`/my-reservations/${res.data._id}`), 1500);
      },
      error: (err) => {
        this.reserving = false;
        const waitlistAvailable = err?.error?.waitlistAvailable === true;
        if (waitlistAvailable) {
          this.reservationError = 'Cet événement est complet. Vous pouvez rejoindre la liste d\'attente ci-dessous.';
          this.showWaitlistBanner = true;
        } else {
          this.reservationError = this.extractErrorMessage(err) || 'Impossible de créer la réservation.';
        }
      },
    });
  }

  /** Le backend renvoie souvent un message générique ("Validation failed")
   *  accompagné d'un détail par champ dans `errors[]` — on privilégie ce
   *  détail quand il est présent, plus utile pour l'utilisateur. */
  private extractErrorMessage(err: any): string | null {
    const fieldErrors = err?.error?.errors;
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors.map((e: any) => e.message).join(' ');
    }
    return err?.error?.message ?? null;
  }

  // ─── Lot-2 helpers ──────────────────────────────────────────────────────────
  auth = inject(AuthService);
  private certService = inject(CertificateService);
  certGenerating = false;
  certResult = '';

  get isEventPast(): boolean {
    if (!this.event) return false;
    return new Date(this.event.endDate) < new Date();
  }

  get isOrganizer(): boolean {
    const me = this.auth.currentUser();
    if (!me || !this.event) return false;
    const orgId = (this.event.organizer as any)?._id || this.event.organizer;
    return me._id === orgId || me.role === 'ADMIN';
  }

  get hasConfirmedReservation(): boolean {
    return this.auth.isAuthenticated() && !this.isOrganizer;
  }

  triggerCertificates(): void {
    if (!this.event) return;
    this.certGenerating = true;
    this.certResult = '';
    this.certService.generateForEvent(this.event._id).subscribe({
      next: (res) => {
        const d = res.data as any;
        this.certResult = `✅ ${d.generated} certificat(s) généré(s), ${d.skipped} déjà émis.`;
        this.certGenerating = false;
      },
      error: (err) => {
        this.certResult = '❌ ' + (err.error?.message || 'Erreur lors de la génération.');
        this.certGenerating = false;
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOT-2 INTEGRATION PATCH
// Applied below — kept separate so original file is untouched as much as possible.
// The actual template integration is done in event-detail.component.html.
// Additional imports are done via the imports array extension (see below).
// ─────────────────────────────────────────────────────────────────────────────
