import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe }    from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { RouterLink }                from '@angular/router';
import { HttpClient, HttpParams }    from '@angular/common/http';
import { environment }               from '../../../../environments/environment';
import { CertificateService }        from '../../../core/services/certificate.service';

@Component({
  selector: 'app-bo-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './bo-participants.component.html',
  styleUrls: ['./bo-participants.component.css'],
})
export class BoParticipantsComponent implements OnInit {
  // ── Global users tab ──────────────────────────────────────────────────────
  users      = signal<any[]>([]);
  loading    = signal(true);
  total      = signal(0);
  page       = signal(1);
  totalPages = signal(1);
  search     = '';
  limit      = 20;

  // ── Event participants tab ─────────────────────────────────────────────────
  activeTab        = signal<'all' | 'event'>('all');
  events           = signal<any[]>([]);
  selectedEventId  = '';
  eventParticipants = signal<any[]>([]);
  eventLoading     = signal(false);

  // ── Certificate generation per participant ────────────────────────────────
  certGenerating   = signal<string | null>(null);   // userId being processed
  certStatuses     = signal<Record<string, string>>({}); // userId → cert status
  toast            = signal<{ msg: string; type: 'success'|'error'|'info' } | null>(null);

  constructor(private http: HttpClient, private certService: CertificateService) {}

  ngOnInit(): void {
    this.load();
    this.loadEvents();
  }

  // ── All participants ───────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page',  this.page())
      .set('limit', this.limit)
      .set('role',  'PARTICIPANT');
    if (this.search) params = params.set('search', this.search);
    this.http.get<any>(`${environment.apiUrl}/users`, { params }).subscribe({
      next: (r) => {
        this.users.set(r.data || []);
        this.total.set(r.pagination?.total || 0);
        this.totalPages.set(r.pagination?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  // ── Events list ───────────────────────────────────────────────────────────
  loadEvents(): void {
    this.http.get<any>(`${environment.apiUrl}/events?limit=100&sortBy=startDate&order=desc`).subscribe({
      next: (r) => this.events.set(r.data || []),
    });
  }

  // ── Event participants + certificate status ────────────────────────────────
  loadEventParticipants(): void {
    if (!this.selectedEventId) { this.eventParticipants.set([]); return; }
    this.eventLoading.set(true);

    // Load participants + their certificate statuses in parallel
    Promise.all([
      this.http.get<any>(`${environment.apiUrl}/events/${this.selectedEventId}/participants?limit=200`).toPromise(),
      this.certService.getEventCertificates(this.selectedEventId).toPromise(),
    ]).then(([participantsRes, certsRes]) => {
      const participants = participantsRes?.data?.participants || participantsRes?.data || [];
      const certs        = certsRes?.data?.certificates || [];

      // Build userId → cert status map
      const statusMap: Record<string, string> = {};
      for (const c of certs) {
        const uid = typeof c.user === 'string' ? c.user : c.user?._id;
        if (uid) statusMap[uid] = c.status;
      }
      this.certStatuses.set(statusMap);
      this.eventParticipants.set(participants);
      this.eventLoading.set(false);
    }).catch(() => this.eventLoading.set(false));
  }

  onEventChange(): void {
    this.eventParticipants.set([]);
    this.certStatuses.set({});
    if (this.selectedEventId) this.loadEventParticipants();
  }

  // ── Generate certificate for ONE participant ───────────────────────────────
  generateCert(participant: any): void {
    const userId = participant._id || participant.user?._id;
    if (!userId || !this.selectedEventId) return;

    this.certGenerating.set(userId);
    this.certService.generateForOne(this.selectedEventId, userId).subscribe({
      next: (res) => {
        this.certGenerating.set(null);
        const alreadyExisted = res.data?.alreadyExisted;
        this.showToast(
          alreadyExisted
            ? 'Le certificat existait déjà — statut inchangé.'
            : '✅ Certificat généré et validé.',
          alreadyExisted ? 'info' : 'success'
        );
        // Update local cert status map
        this.certStatuses.update(m => ({
          ...m,
          [userId]: res.data?.certificate?.status || 'validated',
        }));
      },
      error: (e) => {
        this.certGenerating.set(null);
        this.showToast(e?.error?.message || 'Erreur lors de la génération.', 'error');
      },
    });
  }

  certStatusOf(participant: any): string {
    const uid = participant._id || participant.user?._id;
    return this.certStatuses()[uid] || '';
  }

  certLabel(status: string): string {
    return ({ pending: 'En attente', validated: 'Validé', sent: 'Envoyé', downloaded: 'Téléchargé' } as any)[status] || '';
  }

  certIcon(status: string): string {
    return ({ pending: 'hourglass_empty', validated: 'verified', sent: 'mark_email_read', downloaded: 'download_done' } as any)[status] || '';
  }

  participantName(p: any): string { return p.fullName || p.user?.fullName || '—'; }
  participantEmail(p: any): string { return p.email  || p.user?.email  || '—'; }
  participantInitial(p: any): string { return this.participantName(p).charAt(0).toUpperCase(); }

  private showToast(msg: string, type: 'success'|'error'|'info'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
