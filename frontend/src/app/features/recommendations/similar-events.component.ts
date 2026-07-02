<<<<<<< HEAD
import { Component, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
=======
import { Component, Input, OnInit, signal } from '@angular/core';
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
import { CommonModule, DatePipe }   from '@angular/common';
import { RouterModule }             from '@angular/router';
import { RecommendationService }    from '../../core/services/recommendation.service';

@Component({
  selector: 'app-similar-events',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
<section class="similar-section" *ngIf="events().length > 0">
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  <div class="similar-header">
    <span class="material-icons">link</span>
    <h2>Événements similaires</h2>
  </div>
<<<<<<< HEAD
  <div class="similar-grid">
    <div *ngFor="let event of events()" class="similar-card">
      <a [routerLink]="['/events', event._id]" class="sc-img-link">
        <div class="sc-img">
          <img *ngIf="event.images?.[0]?.url" [src]="event.images[0]?.url" [alt]="event.title" loading="lazy" />
          <div *ngIf="!event.images?.[0]?.url" class="sc-placeholder">
            <span class="material-icons">event</span>
          </div>
        </div>
      </a>
=======
=======
  <h2>🔗 Événements similaires</h2>
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  <div class="similar-grid">
    <a *ngFor="let event of events()" [routerLink]="['/events', event._id]" class="similar-card">
      <div class="sc-img">
        <img *ngIf="event.images?.[0]" [src]="event.images[0]" [alt]="event.title" loading="lazy" />
<<<<<<< HEAD
        <div *ngIf="!event.images?.[0]" class="sc-placeholder">
          <span class="material-icons">event</span>
        </div>
      </div>
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      <div class="sc-body">
        <h3 class="sc-title">{{ event.title }}</h3>
        <p class="sc-date"><span class="material-icons">calendar_today</span> {{ event.startDate | date:'dd MMM yyyy' }}</p>
        <p class="sc-place" *ngIf="event.location?.address"><span class="material-icons">place</span> {{ event.location.address }}</p>
<<<<<<< HEAD
        <a [routerLink]="['/events', event._id]" class="sc-btn">Voir l'événement</a>
      </div>
    </div>
=======
=======
        <div *ngIf="!event.images?.[0]" class="sc-placeholder">🎫</div>
      </div>
      <div class="sc-body">
        <h3 class="sc-title">{{ event.title }}</h3>
        <p class="sc-date">📅 {{ event.startDate | date:'dd MMM yyyy':'':'fr' }}</p>
        <p class="sc-place" *ngIf="event.location?.address">📍 {{ event.location.address }}</p>
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
      </div>
    </a>
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  </div>
</section>
  `,
  styles: [`
<<<<<<< HEAD
    .similar-section { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); border: 1px solid var(--color-line); margin-top: var(--space-6); box-shadow: var(--shadow-card); }
    :host-context(.dark) .similar-section { background: var(--dark-surface); border-color: var(--dark-line); }
    .similar-header { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
    .similar-header .material-icons { color: var(--color-primary); font-size: 20px; }
    .similar-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--color-ink); margin: 0; }
    .similar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    @media (max-width: 1000px) { .similar-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .similar-grid { grid-template-columns: 1fr; } }
    .similar-card { background: var(--color-bg-subtle); border-radius: var(--radius-lg); border: 1px solid var(--color-line); color: inherit; overflow: hidden; transition: all .2s var(--ease-out); display: flex; flex-direction: column; }
    :host-context(.dark) .similar-card { background: var(--dark-surface-2); border-color: var(--dark-line); }
    .similar-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-pop); border-color: var(--brand-300); }
    :host-context(.dark) .similar-card:hover { border-color: rgba(99,102,241,.3); }
    .sc-img-link { display: block; text-decoration: none; }
    .sc-img { aspect-ratio: 16/10; overflow: hidden; background: var(--gray-100); }
=======
<<<<<<< HEAD
    .similar-section { margin: 2rem 0; }
    .similar-header { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
    .similar-header .material-icons { color: var(--color-primary); font-size: 20px; }
    .similar-header h2 { font-size: 1.1rem; font-weight: 700; color: var(--color-ink); margin: 0; }
    .similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .similar-card { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-line); text-decoration: none; color: inherit; overflow: hidden; transition: all .2s var(--ease-out); display: flex; flex-direction: column; }
    .similar-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-pop); border-color: var(--brand-300); }
    :host-context(.dark) .similar-card:hover { border-color: rgba(99,102,241,.3); }
    .sc-img { aspect-ratio: 4/3; overflow: hidden; background: var(--gray-100); }
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    :host-context(.dark) .sc-img { background: var(--gray-800); }
    .sc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
    .similar-card:hover .sc-img img { transform: scale(1.05); }
    .sc-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }
    .sc-placeholder .material-icons { font-size: 2rem; color: var(--color-muted); }
<<<<<<< HEAD
    .sc-body { padding: .75rem 1rem 1rem; display: flex; flex-direction: column; gap: .4rem; flex: 1; }
    .sc-title { font-size: .9rem; font-weight: 700; color: var(--color-ink); margin: 0; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sc-date, .sc-place { display: flex; align-items: center; gap: 4px; font-size: .78rem; color: var(--color-muted); margin: 0; }
    .sc-date .material-icons, .sc-place .material-icons { font-size: 14px !important; }
    .sc-btn { display: inline-flex; align-items: center; justify-content: center; margin-top: auto; padding: .45rem .85rem; font-size: .78rem; font-weight: 600; border-radius: var(--radius-md); background: var(--color-primary); color: #fff; text-decoration: none; transition: background .2s; }
    .sc-btn:hover { background: var(--brand-600); }
  `],
})
export class SimilarEventsComponent implements OnInit, OnChanges {
  @Input() eventId!: string;
  @Input() category?: string | null;
  @Input() excludeTitle?: string | null;
=======
    .sc-body { padding: .75rem; }
    .sc-title { font-size: .85rem; font-weight: 700; color: var(--color-ink); margin: 0 0 .5rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sc-date, .sc-place { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: var(--color-muted); margin: .25rem 0; }
    .sc-date .material-icons, .sc-place .material-icons { font-size: 13px !important; }
=======
    .similar-section { margin:2.5rem 0; }
    .similar-section h2 { font-size:1.2rem; font-weight:700; color:#1e293b; margin-bottom:1rem; }
    .similar-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1rem; }
    .similar-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; overflow:hidden; transition:all .2s; display:flex; flex-direction:column; }
    .similar-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(99,102,241,.12); }
    .sc-img { aspect-ratio:4/3; overflow:hidden; background:#f1f5f9; }
    .sc-img img { width:100%; height:100%; object-fit:cover; transition:transform .3s; }
    .similar-card:hover .sc-img img { transform:scale(1.05); }
    .sc-placeholder { display:flex; align-items:center; justify-content:center; height:100%; font-size:2rem; }
    .sc-body { padding:.875rem; }
    .sc-title { font-size:.875rem; font-weight:700; color:#1e293b; margin:0 0 .35rem; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .sc-date,.sc-place { font-size:.75rem; color:#64748b; margin:.2rem 0; }
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  `],
})
export class SimilarEventsComponent implements OnInit {
  @Input() eventId!: string;
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  events = signal<any[]>([]);

  constructor(private recoService: RecommendationService) {}

  ngOnInit(): void {
<<<<<<< HEAD
    this.loadEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] || changes['category'] || changes['excludeTitle']) {
      this.loadEvents();
    }
  }

  private loadEvents(): void {
    if (!this.eventId) {
      this.events.set([]);
      return;
    }

    this.recoService.getSimilarEvents(this.eventId, {
      category: this.category ?? undefined,
      excludeTitle: this.excludeTitle ?? undefined,
    }).subscribe({
=======
    this.recoService.getSimilarEvents(this.eventId).subscribe({
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      next: (res) => this.events.set(res.data?.events || []),
    });
  }
}
