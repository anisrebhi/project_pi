import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="bo-page">
  <div class="bo-welcome">
    <div class="bo-welcome-text">
      <h1>Bonjour, {{ firstNameDisplay }}</h1>
      <p>{{ today }} — Vue d'ensemble de votre plateforme</p>
    </div>
    <a routerLink="/backoffice/events/new" class="btn btn-primary">
      <span class="material-icons">add</span>
      Nouvel événement
    </a>
  </div>

  <div class="bo-stats-grid stagger">
    <div class="bo-stat-card">
      <div class="bo-stat-icon stat-icon-events">
        <span class="material-icons">event</span>
      </div>
      <div class="bo-stat-body">
        <div class="bo-stat-val">{{ stats().events }}</div>
        <div class="bo-stat-lbl">Événements</div>
        <div class="bo-stat-sub">{{ stats().activeEvents }} actifs</div>
      </div>
    </div>
    <div class="bo-stat-card">
      <div class="bo-stat-icon stat-icon-users">
        <span class="material-icons">people</span>
      </div>
      <div class="bo-stat-body">
        <div class="bo-stat-val">{{ stats().users }}</div>
        <div class="bo-stat-lbl">Utilisateurs</div>
        <div class="bo-stat-sub">Tous rôles</div>
      </div>
    </div>
    <div class="bo-stat-card">
      <div class="bo-stat-icon stat-icon-reservations">
        <span class="material-icons">confirmation_number</span>
      </div>
      <div class="bo-stat-body">
        <div class="bo-stat-val">{{ stats().reservations }}</div>
        <div class="bo-stat-lbl">Réservations</div>
        <div class="bo-stat-sub">{{ stats().confirmedReservations }} confirmées</div>
      </div>
    </div>
    <div class="bo-stat-card">
      <div class="bo-stat-icon stat-icon-certificates">
        <span class="material-icons">workspace_premium</span>
      </div>
      <div class="bo-stat-body">
        <div class="bo-stat-val">{{ stats().certificates }}</div>
        <div class="bo-stat-lbl">Certificats</div>
        <div class="bo-stat-sub">{{ stats().sentCertificates }} envoyés</div>
      </div>
    </div>
  </div>

  <div class="bo-section mt-8">
    <h2 class="bo-section-title">Actions rapides</h2>
    <div class="bo-quick-grid stagger">
      <a routerLink="/backoffice/events/new" class="bo-quick-card quick-card-events">
        <span class="material-icons bo-quick-icon">add_circle</span>
        <span>Créer un événement</span>
      </a>
      <a routerLink="/backoffice/reservations" class="bo-quick-card quick-card-reservations">
        <span class="material-icons bo-quick-icon">checklist</span>
        <span>Voir les réservations</span>
      </a>
      <a routerLink="/backoffice/certificates" class="bo-quick-card quick-card-certificates">
        <span class="material-icons bo-quick-icon">verified</span>
        <span>Gérer les certificats</span>
      </a>
      <a routerLink="/backoffice/participants" class="bo-quick-card quick-card-participants">
        <span class="material-icons bo-quick-icon">people</span>
        <span>Participants</span>
      </a>
      <a *ngIf="isAdmin" routerLink="/backoffice/users" class="bo-quick-card quick-card-users">
        <span class="material-icons bo-quick-icon">manage_accounts</span>
        <span>Utilisateurs</span>
      </a>
    </div>
  </div>

  <div class="bo-section mt-8" *ngIf="recentEvents().length > 0">
    <div class="bo-section-header">
      <h2 class="bo-section-title">Événements récents</h2>
      <a routerLink="/backoffice/events" class="btn btn-secondary btn-sm">Voir tous</a>
    </div>
    <div class="bo-table-card">
      <table>
        <thead><tr>
          <th>Titre</th><th>Date</th><th>Catégorie</th><th>Capacité</th><th>Statut</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let e of recentEvents()">
            <td><a [routerLink]="['/backoffice/events', e._id, 'edit']" class="event-link">{{ e.title }}</a></td>
            <td class="text-sm muted">{{ e.startDate | date:'dd/MM/yyyy' }}</td>
            <td><span class="chip">{{ e.category }}</span></td>
            <td class="text-sm">{{ e.participantCount || 0 }} / {{ e.capacity }}</td>
            <td><span class="status-badge" [class]="e.isActive ? 'status-confirmed' : 'status-cancelled'">{{ e.isActive ? 'Actif' : 'Inactif' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  styles: [`
    .bo-page { max-width: 1200px; }
    .bo-welcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
      padding: var(--space-8);
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-line);
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
    }
    .bo-welcome::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, var(--brand-50) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    :host-context(.dark) .bo-welcome::before {
      background: radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%);
    }
    .bo-welcome-text { position: relative; z-index: 1; }
    .bo-welcome h1 {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-ink);
      margin-bottom: 4px;
    }
    .bo-welcome p {
      color: var(--color-muted);
      font-size: .9rem;
      margin: 0;
    }

    .bo-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: var(--space-5);
    }
    .bo-stat-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-line);
      padding: var(--space-6);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-card);
      transition: all var(--duration-base) var(--ease-out);
      position: relative;
      overflow: hidden;
    }
    .bo-stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }
    .bo-stat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--brand-200);
    }
    .bo-stat-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bo-stat-icon .material-icons { font-size: 24px; }
    .stat-icon-events { background: #ede9fe; } .stat-icon-events .material-icons { color: #6366f1; }
    .stat-icon-users { background: #d1fae5; } .stat-icon-users .material-icons { color: #10b981; }
    .stat-icon-reservations { background: #fef3c7; } .stat-icon-reservations .material-icons { color: #f59e0b; }
    .stat-icon-certificates { background: #ede9fe; } .stat-icon-certificates .material-icons { color: #8b5cf6; }
    :host-context(.dark) .stat-icon-events { background: rgba(99,102,241,.15); }
    :host-context(.dark) .stat-icon-users { background: rgba(16,185,129,.15); }
    :host-context(.dark) .stat-icon-reservations { background: rgba(245,158,11,.15); }
    :host-context(.dark) .stat-icon-certificates { background: rgba(139,92,246,.15); }

    .bo-stat-card:nth-child(1)::after { background: #6366f1; }
    .bo-stat-card:nth-child(2)::after { background: #10b981; }
    .bo-stat-card:nth-child(3)::after { background: #f59e0b; }
    .bo-stat-card:nth-child(4)::after { background: #8b5cf6; }

    .bo-stat-val { font-size: 1.75rem; font-weight: 800; color: var(--color-ink); line-height: 1; }
    .bo-stat-lbl { font-size: .8rem; font-weight: 600; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
    .bo-stat-sub { font-size: .75rem; color: var(--gray-400); margin-top: 4px; }

    .bo-section { width: 100%; }
    .bo-section-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-ink);
      margin-bottom: var(--space-4);
    }
    .bo-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }

    .bo-quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--space-4);
    }
    .bo-quick-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-6) var(--space-4);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-line);
      text-decoration: none;
      color: var(--color-ink);
      font-size: .875rem;
      font-weight: 600;
      transition: all var(--duration-base) var(--ease-out);
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
    }
    .bo-quick-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      opacity: 0;
      transition: opacity var(--duration-base);
    }
    .bo-quick-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--brand-200);
    }
    .bo-quick-card:hover::after { opacity: 1; }
    .quick-card-events::after { background: #6366f1; }
    .quick-card-reservations::after { background: #10b981; }
    .quick-card-certificates::after { background: #8b5cf6; }
    .quick-card-participants::after { background: #0ea5e9; }
    .quick-card-users::after { background: #ef4444; }

    .quick-card-events .bo-quick-icon { color: #6366f1; }
    .quick-card-reservations .bo-quick-icon { color: #10b981; }
    .quick-card-certificates .bo-quick-icon { color: #8b5cf6; }
    .quick-card-participants .bo-quick-icon { color: #0ea5e9; }
    .quick-card-users .bo-quick-icon { color: #ef4444; }

    .bo-quick-icon { font-size: 2rem; }

    .bo-table-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-line);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .event-link {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
      transition: color var(--duration-fast);
    }
    .event-link:hover { color: var(--color-primary-dark); }

    @media (max-width: 768px) {
      .bo-welcome { padding: var(--space-6); }
      .bo-stats-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .bo-stats-grid { grid-template-columns: 1fr; }
      .bo-quick-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class BoDashboardComponent implements OnInit {
  stats = signal({ events: 0, activeEvents: 0, users: 0, reservations: 0, confirmedReservations: 0, certificates: 0, sentCertificates: 0 });
  recentEvents = signal<any[]>([]);
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  constructor(public auth: AuthService, private http: HttpClient) {}

  get firstNameDisplay(): string {
    const fullName = this.auth.currentUser()?.fullName;
    return fullName ? fullName.split(' ')[0] : 'Utilisateur';
  }

  get isAdmin(): boolean { return this.auth.currentUser()?.role === 'ADMIN'; }

  ngOnInit(): void { this.loadStats(); this.loadRecentEvents(); }

  loadStats(): void {
    this.http.get<any>(`${environment.apiUrl}/events?limit=1`).subscribe({
      next: (r) => this.stats.update(s => ({ ...s, events: r.pagination?.total || 0 })),
    });
    this.http.get<any>(`${environment.apiUrl}/reservations?limit=1`).subscribe({
      next: (r) => this.stats.update(s => ({ ...s, reservations: r.pagination?.total || 0 })),
    });
    if (this.isAdmin) {
      this.http.get<any>(`${environment.apiUrl}/users?limit=1`).subscribe({
        next: (r) => this.stats.update(s => ({ ...s, users: r.pagination?.total || 0 })),
      });
    }
  }

  loadRecentEvents(): void {
    this.http.get<any>(`${environment.apiUrl}/events?limit=5&sortBy=createdAt&order=desc`).subscribe({
      next: (r) => this.recentEvents.set(r.data || []),
    });
  }
}
