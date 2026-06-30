import { Component, OnInit, OnDestroy, AfterViewInit, inject, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EventService }     from '../../../../core/services/event.service';
import { AuthService }      from '../../../../core/services/auth.service';
import { ToastService }     from '../../../../shared/components/toast/toast.service';
import { GeocodingService } from '../../../../shared/services/geocoding.service';
import { EventInput, TICKET_TYPE_NAMES, TicketTypeName } from '../../../../core/models/event.model';
import { FORM_CATEGORIES }  from '../../../../core/utils/category.utils';
import { dateRangeValidator, futureDateValidator } from '../../../../shared/validators/date.validators';
import { fromDatetimeLocalValue, nowAsDatetimeLocal, toDatetimeLocalValue } from '../../../../shared/utils/date-utils';

// Default marker icon — fixes a known Leaflet/Angular CLI bundling issue
// where the built-in marker images aren't resolved automatically.
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [36.8065, 10.1815]; // Tunis

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './event-form.component.html',
  styleUrl:    './event-form.component.css',
})
export class EventFormComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  @ViewChild('mapDiv') mapDivRef!: ElementRef<HTMLDivElement>;

  eventId: string | null = null;
  isEditMode = false;
  loading      = false;
  loadingEvent = false;
  serverError  = '';

  readonly minDateTime    = nowAsDatetimeLocal();
  readonly formCategories = FORM_CATEGORIES;
  readonly ticketTypeNames = TICKET_TYPE_NAMES;

  // Image preview
  imagePreviewUrl: string | null = null;
  imageUrlInput = '';

  // Leaflet map
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  locatingMe = false;
  geocodingAddress = false;

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(2000)]],
    category:    ['conference'],
    address:     [''],
    latitude:    [null as number | null],
    longitude:   [null as number | null],
    startDate:   ['', [Validators.required, futureDateValidator]],
    endDate:     ['', [Validators.required]],
    capacity:    [50, [Validators.required, Validators.min(1), Validators.max(100000)]],
    type:        ['free' as 'free' | 'paid', [Validators.required]],
    price:       [0, [Validators.min(0)]],
    maxTicketsPerUser: [20, [Validators.required, Validators.min(1), Validators.max(20)]],
    ticketTypes: this.fb.array([]),
  }, { validators: dateRangeValidator });

  get ticketTypesArray(): FormArray {
    return this.form.get('ticketTypes') as FormArray;
  }

  private buildTicketTypeGroup(tt?: { name: TicketTypeName; price: number; quantity?: number | null; earlyBird?: { enabled: boolean; price?: number | null; deadline?: string | null } }): FormGroup {
    return this.fb.group({
      name:               [tt?.name ?? this.ticketTypeNames[0], [Validators.required]],
      price:               [tt?.price ?? 0, [Validators.required, Validators.min(0)]],
      quantity:            [tt?.quantity ?? null],
      earlyBirdEnabled:    [tt?.earlyBird?.enabled ?? false],
      earlyBirdPrice:      [tt?.earlyBird?.price ?? null],
      earlyBirdDeadline:   [tt?.earlyBird?.deadline ? toDatetimeLocalValue(tt.earlyBird.deadline) : ''],
    });
  }

  addTicketType(): void {
    this.ticketTypesArray.push(this.buildTicketTypeGroup());
  }

  removeTicketType(index: number): void {
    this.ticketTypesArray.removeAt(index);
  }

  constructor(
    private eventService: EventService,
    public  auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private geocoding: GeocodingService,
    private ngZone: NgZone,
  ) {}

  get f() { return this.form.controls; }
  get isAdmin(): boolean { return this.auth.currentUser()?.role === 'ADMIN'; }

  ngOnInit(): void {
    this.eventId    = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    if (this.isEditMode) this.loadEvent(this.eventId!);

    this.f['type'].valueChanges.subscribe(type => {
      if (type === 'free') { this.f['price'].setValue(0); this.f['price'].clearValidators(); }
      else { this.f['price'].setValidators([Validators.required, Validators.min(0.01)]); }
      this.f['price'].updateValueAndValidity();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  // ── Leaflet map ──────────────────────────────────────────────────────────
  private initMap(): void {
    if (!this.mapDivRef?.nativeElement || this.map) return;

    const lat = this.f['latitude'].value ?? DEFAULT_CENTER[0];
    const lng = this.f['longitude'].value ?? DEFAULT_CENTER[1];
    const hasInitialPosition = this.f['latitude'].value != null && this.f['longitude'].value != null;

    this.map = L.map(this.mapDivRef.nativeElement, {
      center: [lat, lng],
      zoom: hasInitialPosition ? 14 : 12,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (hasInitialPosition) {
      this.placeMarker(lat, lng, false);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => this.setMapPosition(e.latlng.lat, e.latlng.lng, true));
    });

    // Leaflet sometimes needs a nudge to compute its size correctly inside
    // a container that wasn't visible/sized at creation time.
    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private placeMarker(lat: number, lng: number, pan: boolean): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.ngZone.run(() => this.setMapPosition(pos.lat, pos.lng, false));
      });
    }

    if (pan) this.map.panTo([lat, lng]);
  }

  /** Updates the form + marker, and (optionally) reverse-geocodes the address. */
  private setMapPosition(lat: number, lng: number, reverseGeocode: boolean): void {
    this.f['latitude'].setValue(lat);
    this.f['longitude'].setValue(lng);
    this.placeMarker(lat, lng, false);

    if (!reverseGeocode) return;

    this.geocodingAddress = true;
    this.geocoding.reverse(lat, lng).subscribe({
      next: (address) => {
        this.geocodingAddress = false;
        if (address) this.f['address'].setValue(address);
      },
      error: () => { this.geocodingAddress = false; },
    });
  }

  /** "Use my current location" button */
  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    this.locatingMe = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.locatingMe = false;
          const { latitude, longitude } = position.coords;
          this.map?.setView([latitude, longitude], 15);
          this.setMapPosition(latitude, longitude, true);
          this.toast.success('Position actuelle détectée ✓');
        });
      },
      (error) => {
        this.ngZone.run(() => {
          this.locatingMe = false;
          const message = error.code === error.PERMISSION_DENIED
            ? "Accès à la position refusé. Autorisez la géolocalisation dans votre navigateur."
            : "Impossible de récupérer votre position actuelle.";
          this.toast.error(message);
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  /** "Locate" button next to the address field — forward geocoding */
  centerMapOnAddress(): void {
    const address = this.f['address'].value;
    if (!address) return;

    this.geocodingAddress = true;
    this.geocoding.search(address).subscribe({
      next: (result) => {
        this.geocodingAddress = false;
        if (!result) { this.toast.error('Adresse introuvable.'); return; }
        this.map?.setView([result.latitude, result.longitude], 15);
        this.setMapPosition(result.latitude, result.longitude, false);
        this.f['address'].setValue(result.address);
      },
      error: () => { this.geocodingAddress = false; this.toast.error("Erreur lors de la recherche de l'adresse."); },
    });
  }

  // ── Image ──────────────────────────────────────────────────────────────────
  onImageUrlChange(): void {
    const url = this.imageUrlInput.trim();
    this.imagePreviewUrl = url || null;
  }

  removeImage(): void { this.imagePreviewUrl = null; this.imageUrlInput = ''; }

  // ── Load for edit ─────────────────────────────────────────────────────────
  private loadEvent(id: string): void {
    this.loadingEvent = true;
    this.eventService.getById(id).subscribe({
      next: (res) => {
        const e = res.data;
        this.form.patchValue({
          title:       e.title,
          description: e.description || '',
          category:    e.category || 'conference',
          address:     e.location?.address || '',
          latitude:    e.location?.latitude ?? null,
          longitude:   e.location?.longitude ?? null,
          startDate:   toDatetimeLocalValue(e.startDate),
          endDate:     toDatetimeLocalValue(e.endDate),
          capacity:    e.capacity,
          type:        e.type,
          price:       e.price,
          maxTicketsPerUser: e.maxTicketsPerUser ?? 20,
        });

        this.ticketTypesArray.clear();
        (e.ticketTypes || []).forEach((tt) => this.ticketTypesArray.push(this.buildTicketTypeGroup(tt)));

        if (e.images?.[0]?.url) {
          this.imagePreviewUrl = e.images[0].url;
          this.imageUrlInput   = e.images[0].url;
        }
        this.loadingEvent = false;

        // Center map on the loaded position once it's ready
        if (e.location?.latitude && e.location?.longitude) {
          setTimeout(() => {
            this.map?.setView([e.location!.latitude!, e.location!.longitude!], 14);
            this.placeMarker(e.location!.latitude!, e.location!.longitude!, false);
          }, 200);
        }
      },
      error: (err) => { this.loadingEvent = false; this.serverError = err?.error?.message || 'Impossible de charger cet événement.'; },
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.serverError = '';
    const raw = this.form.getRawValue();

    const ticketTypesPayload = raw.type === 'paid'
      ? this.ticketTypesArray.controls.map((c) => {
          const v = c.getRawValue();
          return {
            name: v.name,
            price: Number(v.price),
            quantity: v.quantity === null || v.quantity === '' ? null : Number(v.quantity),
            earlyBird: {
              enabled: !!v.earlyBirdEnabled,
              price: v.earlyBirdEnabled ? Number(v.earlyBirdPrice) : null,
              deadline: v.earlyBirdEnabled && v.earlyBirdDeadline ? fromDatetimeLocalValue(v.earlyBirdDeadline) : null,
            },
          };
        })
      : [];

    const payload: EventInput = {
      title:       raw.title!,
      description: raw.description || undefined,
      category:    raw.category as EventInput['category'],
      location:    { address: raw.address || '', latitude: raw.latitude, longitude: raw.longitude },
      startDate:   fromDatetimeLocalValue(raw.startDate!),
      endDate:     fromDatetimeLocalValue(raw.endDate!),
      capacity:    Number(raw.capacity),
      type:        raw.type as EventInput['type'],
      price:       raw.type === 'paid' ? Number(raw.price) : 0,
      maxTicketsPerUser: Number(raw.maxTicketsPerUser) || 20,
      ticketTypes: ticketTypesPayload,
      images:      this.imagePreviewUrl ? [{ url: this.imagePreviewUrl }] : undefined,
    };

    const req = this.isEditMode ? this.eventService.update(this.eventId!, payload) : this.eventService.create(payload);
    req.subscribe({
      next: () => {
        this.loading = false;
        this.toast.success(this.isEditMode ? 'Événement mis à jour ✓' : 'Événement créé avec succès ✓');
        this.router.navigateByUrl('/backoffice/events');
      },
      error: (err) => { this.loading = false; this.serverError = err?.error?.message || 'Une erreur est survenue.'; },
    });
  }
}
