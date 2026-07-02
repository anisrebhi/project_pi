import { Component, Input, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe }   from '@angular/common';
import { RouterModule }             from '@angular/router';
import { RecommendationService }    from '../../core/services/recommendation.service';

@Component({
  selector: 'app-similar-events',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
<section class="similar-section" *ngIf="events().length > 0">
  <div class="similar-header">
    <span class="material-icons">link</span>
    <h2>Événements similaires</h2>
  </div>
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
      <div class="sc-body">
        <h3 class="sc-title">{{ event.title }}</h3>
        <p class="sc-date"><span class="material-icons">calendar_today</span> {{ event.startDate | date:'dd MMM yyyy' }}</p>
        <p class="sc-place" *ngIf="event.location?.address"><span class="material-icons">place</span> {{ event.location.address }}</p>
        <a [routerLink]="['/events', event._id]" class="sc-btn">Voir l'événement</a>
      </div>
    </div>
  </div>
</section>
  `,
  styles: [`
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
    :host-context(.dark) .sc-img { background: var(--gray-800); }
    .sc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
    .similar-card:hover .sc-img img { transform: scale(1.05); }
    .sc-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }
    .sc-placeholder .material-icons { font-size: 2rem; color: var(--color-muted); }
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
  events = signal<any[]>([]);

  constructor(private recoService: RecommendationService) {}

  ngOnInit(): void {
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
      next: (res) => this.events.set(res.data?.events || []),
    });
  }
}
