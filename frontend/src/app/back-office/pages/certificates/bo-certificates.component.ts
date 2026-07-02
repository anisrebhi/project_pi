/**
 * @file back-office/pages/certificates/bo-certificates.component.ts
 *
 * FLUX COMPLET :
 * ① Sélectionner un événement
 * ② Cliquer "Voir les participants" → tableau des participants confirmés s'affiche
 *    avec leur statut (certificat déjà créé ou non) + cases à cocher pour sélection
 * ③ Cliquer "Initialiser les certificats" → POST avec les IDs sélectionnés
 * ④ La liste des certificats se met à jour automatiquement (sans rechargement)
 * ⑤ Toutes les autres actions (valider, envoyer, télécharger, supprimer) disponibles
 */
import {
  Component, OnInit, OnDestroy, signal, computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule }          from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';

import { environment }                    from '../../../../environments/environment';
import { AuthService }                    from '../../../core/services/auth.service';
import { CertificateService }            from '../../../core/services/certificate.service';
import { Certificate, ConfirmedParticipant } from '../../../core/models/lot2.models';

type ViewMode = 'certs' | 'participants';
interface Toast { msg: string; type: 'success' | 'error' | 'info' }

@Component({
  selector: 'app-bo-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, RouterModule],
  templateUrl: './bo-certificates.component.html',
  styleUrls:  ['./bo-certificates.component.css'],
})
export class BoCertificatesComponent implements OnInit, OnDestroy {

  // ── State global ────────────────────────────────────────────────────────────
  events       = signal<any[]>([]);
  loadingEvts  = signal(false);
  eventsError  = signal<string | null>(null);

  // ── Vue active : 'participants' ou 'certs' ──────────────────────────────────
  viewMode = signal<ViewMode>('certs');

  // ── Vue : Participants confirmés ────────────────────────────────────────────
  participants      = signal<ConfirmedParticipant[]>([]);
  loadingParts      = signal(false);
  partsError        = signal<string | null>(null);
  partsStats        = signal<{ total: number; withCert: number; withoutCert: number } | null>(null);
  selectedUserIds   = signal<Set<string>>(new Set());
  searchParts       = '';

  // ── Vue : Certificats ───────────────────────────────────────────────────────
  certs        = signal<Certificate[]>([]);
  stats        = signal<any | null>(null);
  loading      = signal(false);
  searchCerts  = '';
  statusFilter = '';

  // ── Actions ─────────────────────────────────────────────────────────────────
  initializing = signal(false);
  forceInit    = false;
  bulkActing   = signal<'validate' | 'send' | null>(null);
  acting       = signal<string | null>(null);
  deleting     = signal<string | null>(null);

  // ── Feedback ────────────────────────────────────────────────────────────────
  toast  = signal<Toast | null>(null);
  errMsg = signal<string | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  selectedEventId = '';

  // ── Event search ────────────────────────────────────────────────────────────
  eventSearchCtrl = new FormControl('');
  eventSearch     = signal<string>('');

  readonly filteredEvents = computed(() => {
    const q = this.eventSearch().toLowerCase().trim();
    if (!q) return this.events();
    return this.events().filter(e => {
      const title     = (e.title                  || '').toLowerCase();
      const category  = (e.category                || '').toLowerCase();
      const location  = (e.location?.address       || '').toLowerCase();
      const organizer = (e.organizer?.fullName     || '').toLowerCase();
      return title.includes(q) || category.includes(q) || location.includes(q) || organizer.includes(q);
    });
  });

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly filteredParticipants = computed(() => {
    const q = this.searchParts.toLowerCase().trim();
    return q
      ? this.participants().filter(p =>
          p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      : this.participants();
  });

  readonly filteredCerts = computed(() => {
    const q  = this.searchCerts.toLowerCase().trim();
    const st = this.statusFilter;
    return this.certs().filter(c => {
      const nameOk = !q || this.certName(c).toLowerCase().includes(q) || this.certEmail(c).toLowerCase().includes(q);
      const statOk = !st || c.status === st;
      return nameOk && statOk;
    });
  });

  readonly allSelected = computed(() => {
    const eligible = this.filteredParticipants().filter(p => !p.hasCertificate);
    return eligible.length > 0 && eligible.every(p => this.selectedUserIds().has(p.userId));
  });

  readonly selectedCount    = computed(() => this.selectedUserIds().size);
  readonly hasPending       = computed(() => this.certs().some(c => c.status === 'pending'));
  readonly hasValidated     = computed(() => this.certs().some(c => c.status === 'validated'));
  readonly currentUser      = computed(() => this.authService.currentUser());
  readonly isAdmin          = computed(() => this.currentUser()?.role === 'ADMIN');

  private destroy$   = new Subject<void>();
  private toastTimer: any;

  constructor(
    private http: HttpClient,
    private certService: CertificateService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadEvents();

    this.eventSearchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(value => {
      const term = (value || '').toLowerCase().trim();
      this.eventSearch.set(value || '');

      // Auto-select if a single event matches and nothing is selected
      if (term) {
        const matches = this.events().filter(e =>
          (e.title              || '').toLowerCase().includes(term) ||
          (e.category           || '').toLowerCase().includes(term) ||
          (e.location?.address  || '').toLowerCase().includes(term) ||
          (e.organizer?.fullName|| '').toLowerCase().includes(term)
        );
        if (matches.length === 1 && !this.selectedEventId) {
          this.selectedEventId = matches[0]._id;
          this.onEventChange();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ── Load events ─────────────────────────────────────────────────────────────

  loadEvents(): void {
    this.loadingEvts.set(true);
    this.eventsError.set(null);
    this.events.set([]);

    this.http
      .get<any>(`${environment.apiUrl}/events?limit=100&sortBy=startDate&order=desc`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          this.loadingEvts.set(false);
          let list: any[] = [];
          if      (Array.isArray(r?.data))         list = r.data;
          else if (Array.isArray(r?.data?.events)) list = r.data.events;
          else if (Array.isArray(r?.events))       list = r.events;
          else if (Array.isArray(r))               list = r;
          this.events.set(list);
          if (!list.length) this.eventsError.set('Aucun événement trouvé dans la base de données.');
        },
        error: (err: HttpErrorResponse) => {
          this.loadingEvts.set(false);
          this.eventsError.set(this.buildNetworkError(err));
        },
      });
  }

  onEventChange(): void {
    this.searchCerts  = '';
    this.searchParts  = '';
    this.statusFilter = '';
    this.forceInit    = false;
    this.certs.set([]);
    this.stats.set(null);
    this.participants.set([]);
    this.partsStats.set(null);
    this.partsError.set(null);
    this.selectedUserIds.set(new Set());
    this.errMsg.set(null);
    this.viewMode.set('certs');
    if (this.selectedEventId) this.loadCerts();
  }

  // ── Vue participants ─────────────────────────────────────────────────────────

  /** Charge et affiche les participants confirmés */
  showParticipants(): void {
    if (!this.selectedEventId) return;
    this.viewMode.set('participants');
    this.loadParticipants();
  }

  loadParticipants(): void {
    this.loadingParts.set(true);
    this.partsError.set(null);

    this.certService
      .getConfirmedParticipants(this.selectedEventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          const parts = r.data?.participants || [];
          this.participants.set(parts);
          this.partsStats.set({
            total:       r.data?.total       || 0,
            withCert:    r.data?.withCert    || 0,
            withoutCert: r.data?.withoutCert || 0,
          });
          this.loadingParts.set(false);

          // Pré-sélectionner tous les participants SANS certificat
          const preSelected = new Set<string>(
            parts.filter((p: ConfirmedParticipant) => !p.hasCertificate).map((p: ConfirmedParticipant) => p.userId)
          );
          this.selectedUserIds.set(preSelected);

          if (!parts.length) {
            this.partsError.set('Aucun participant inscrit pour cet événement.');
          }
        },
        error: (e: any) => {
          this.loadingParts.set(false);
          this.partsError.set(e.userMessage || 'Erreur lors du chargement des participants.');
        },
      });
  }

  backToCerts(): void {
    this.viewMode.set('certs');
    if (this.selectedEventId) this.loadCerts();
  }

  // ── Sélection participants ───────────────────────────────────────────────────

  toggleUser(userId: string): void {
    const s = new Set(this.selectedUserIds());
    if (s.has(userId)) s.delete(userId);
    else               s.add(userId);
    this.selectedUserIds.set(s);
  }

  isSelected(userId: string): boolean { return this.selectedUserIds().has(userId); }

  toggleAll(): void {
    const eligible = this.filteredParticipants().filter(p => !p.hasCertificate);
    const s        = new Set(this.selectedUserIds());
    const allSel   = eligible.every(p => s.has(p.userId));
    eligible.forEach(p => allSel ? s.delete(p.userId) : s.add(p.userId));
    this.selectedUserIds.set(s);
  }

  selectAll():    void { const s = new Set<string>(); this.participants().filter(p => !p.hasCertificate).forEach(p => s.add(p.userId)); this.selectedUserIds.set(s); }
  deselectAll():  void { this.selectedUserIds.set(new Set()); }

  // ── Initialize ───────────────────────────────────────────────────────────────

  /** Initialise les certificats pour les participants sélectionnés */
  initialize(): void {
    if (!this.selectedEventId) return;
    if (this.selectedCount() === 0) {
      this.showErr('Sélectionnez au moins un participant.');
      return;
    }

    this.initializing.set(true);
    this.errMsg.set(null);

    // Envoie les IDs des participants sélectionnés
    const userIds = Array.from(this.selectedUserIds());

    this.certService
      .initializeForEvent(this.selectedEventId, this.forceInit, userIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.initializing.set(false);
          const { created = 0, skipped = 0 } = r.data || {};
          this.showToast(
            `✅ ${created} certificat(s) créé(s)${skipped ? `, ${skipped} déjà existant(s)` : ''}.`,
            'success'
          );
          // Rafraîchir les deux vues
          this.loadParticipants();
          this.loadCerts();
          // Basculer sur la vue certificats après 1.5s pour voir le résultat
          setTimeout(() => this.viewMode.set('certs'), 1500);
        },
        error: (e: any) => {
          this.initializing.set(false);
          const msg: string = e.userMessage || e.message || 'Erreur lors de l\'initialisation.';
          if (msg.includes('force=true') || msg.includes('fin de l\'événement')) {
            this.forceInit = true;
            this.showErr(msg + '\n→ "Forcer" activé automatiquement. Cliquez à nouveau sur Initialiser.');
          } else {
            this.showErr(msg);
          }
        },
      });
  }

  /** Initialise TOUS les participants confirmés sans sélection */
  initializeAll(): void {
    this.selectAll();
    setTimeout(() => this.initialize(), 50);
  }

  // ── Load certs ───────────────────────────────────────────────────────────────

  loadCerts(): void {
    if (!this.selectedEventId) return;
    this.loading.set(true);

    this.certService
      .getEventCertificates(this.selectedEventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.certs.set(r.data?.certificates || []);
          this.stats.set(r.data?.stats || null);
          this.loading.set(false);
        },
        error: (e: any) => {
          this.loading.set(false);
          this.showErr(e.userMessage || 'Erreur lors du chargement des certificats.');
        },
      });
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────────

  bulkValidate(): void {
    if (!this.selectedEventId) return;
    this.bulkActing.set('validate');
    this.certService.bulkValidate(this.selectedEventId).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.bulkActing.set(null); this.showToast(`✅ ${r.data?.validated ?? 0} validé(s).`, 'success'); this.loadCerts(); },
      error: (e: any) => { this.bulkActing.set(null); this.showErr(e.userMessage || 'Erreur validation groupée.'); },
    });
  }

  bulkSend(): void {
    if (!this.selectedEventId) return;
    this.bulkActing.set('send');
    this.certService.bulkSend(this.selectedEventId).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.bulkActing.set(null);
        const s = r.data?.sent ?? 0, e = r.data?.errors ?? 0;
        this.showToast(`📧 ${s} envoyé(s)${e ? `, ${e} erreur(s)` : ''}.`, e ? 'info' : 'success');
        this.loadCerts();
      },
      error: (e: any) => { this.bulkActing.set(null); this.showErr(e.userMessage || 'Erreur envoi groupé.'); },
    });
  }

  // ── Row actions certs ────────────────────────────────────────────────────────

  validate(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.validate(cert._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.acting.set(null); this.showToast('✅ Certificat validé.', 'success'); this.loadCerts(); },
      error: (e: any) => { this.acting.set(null); this.showErr(e.userMessage || 'Erreur validation.'); },
    });
  }

  send(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.sendByEmail(cert._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.acting.set(null); this.showToast('📧 Email envoyé.', 'success'); this.loadCerts(); },
      error: (e: any) => { this.acting.set(null); this.showErr(e.userMessage || 'Erreur envoi.'); },
    });
  }

  download(cert: Certificate): void {
    this.acting.set(cert._id);
    this.certService.downloadCertificate(cert._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), {
          href: url, download: `certificat-${this.certName(cert).replace(/[^a-z0-9]/gi, '_')}.pdf`,
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.acting.set(null); this.loadCerts();
      },
      error: (e: any) => { this.acting.set(null); this.showErr(e.userMessage || 'Erreur téléchargement.'); },
    });
  }

  preview(cert: Certificate): void {
    this.acting.set(cert._id + '_preview');
    this.certService.downloadCertificate(cert._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        this.acting.set(null);
      },
      error: (e: any) => { this.acting.set(null); this.showErr(e.userMessage || 'Erreur aperçu.'); },
    });
  }

  confirmDelete(cert: Certificate): void {
    if (!confirm(`Supprimer le certificat de ${this.certName(cert)} ?\nCette action est irréversible.`)) return;
    this.deleting.set(cert._id);
    this.certService.delete(cert._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.deleting.set(null); this.showToast('🗑️ Certificat supprimé.', 'info'); this.loadCerts(); },
      error: (e: any) => { this.deleting.set(null); this.showErr(e.userMessage || 'Erreur suppression.'); },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  selectedEvent(): any { return this.events().find(e => e._id === this.selectedEventId) || null; }
  isEventFinished(): boolean { const ev = this.selectedEvent(); return ev ? new Date(ev.endDate) <= new Date() : false; }

  certName(cert: Certificate): string  { const u = cert.user; return typeof u === 'object' && u ? (u.fullName || u.email) : '—'; }
  certEmail(cert: Certificate): string { const u = cert.user; return typeof u === 'object' && u ? u.email : '—'; }
  certInitial(cert: Certificate): string { return this.certName(cert).charAt(0).toUpperCase(); }

  partInitial(p: ConfirmedParticipant): string { return (p.fullName || '?').charAt(0).toUpperCase(); }

  lastDate(cert: Certificate): string {
    const d = cert.downloadedAt || cert.emailSentAt || cert.validatedAt;
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  }

  statusLabel(s: string): string {
    return ({pending:'En attente',validated:'Validé',sent:'Envoyé',downloaded:'Téléchargé'} as any)[s] || s;
  }
  statusIcon(s: string): string {
    return ({pending:'hourglass_empty',validated:'verified',sent:'mark_email_read',downloaded:'download_done'} as any)[s] || 'help';
  }
  isActing(cert: Certificate): boolean { return this.acting() === cert._id || this.acting() === cert._id + '_preview'; }
  isDeleting(cert: Certificate): boolean { return this.deleting() === cert._id; }
  trackById(_: number, item: any): string { return item._id || item.userId; }

  clearSearchEvent(): void {
    this.eventSearchCtrl.setValue('', { emitEvent: true });
    this.eventSearch.set('');
  }

  private buildNetworkError(err: HttpErrorResponse): string {
    if (err.status === 0) return '⚠️ Serveur inaccessible.\nVérifiez que le backend est démarré : cd backend && npm run dev';
    if (err.status === 400) return `Paramètres invalides (400) : ${err.error?.message || ''}`;
    if (err.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
    if (err.status === 503) return 'MongoDB indisponible (503). Démarrez MongoDB.';
    if (err.status >= 500) return `Erreur serveur (${err.status}) : ${err.error?.message || ''}`;
    return `Erreur ${err.status} : ${err.error?.message || err.message}`;
  }

  // ── Toasts ───────────────────────────────────────────────────────────────────

  private showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ msg, type });
    this.errMsg.set(null);
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }

  private showErr(msg: string): void {
    clearTimeout(this.toastTimer);
    this.errMsg.set(msg);
    this.toast.set(null);
    this.toastTimer = setTimeout(() => this.errMsg.set(null), 9000);
  }
}
