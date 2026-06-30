import { Component, Input, OnInit, signal } from '@angular/core';
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
    <a *ngFor="let event of events()" [routerLink]="['/events', event._id]" class="similar-card">
      <div class="sc-img">
        <img *ngIf="event.images?.[0]" [src]="event.images[0]" [alt]="event.title" loading="lazy" />
        <div *ngIf="!event.images?.[0]" class="sc-placeholder">
          <span class="material-icons">event</span>
        </div>
      </div>
      <div class="sc-body">
        <h3 class="sc-title">{{ event.title }}</h3>
        <p class="sc-date"><span class="material-icons">calendar_today</span> {{ event.startDate | date:'dd MMM yyyy' }}</p>
        <p class="sc-place" *ngIf="event.location?.address"><span class="material-icons">place</span> {{ event.location.address }}</p>
      </div>
    </a>
  </div>
</section>
  `,
  styles: [`
    .similar-section { margin: 2rem 0; }
    .similar-header { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
    .similar-header .material-icons { color: var(--color-primary); font-size: 20px; }
    .similar-header h2 { font-size: 1.1rem; font-weight: 700; color: var(--color-ink); margin: 0; }
    .similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .similar-card { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-line); text-decoration: none; color: inherit; overflow: hidden; transition: all .2s var(--ease-out); display: flex; flex-direction: column; }
    .similar-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-pop); border-color: var(--brand-300); }
    :host-context(.dark) .similar-card:hover { border-color: rgba(99,102,241,.3); }
    .sc-img { aspect-ratio: 4/3; overflow: hidden; background: var(--gray-100); }
    :host-context(.dark) .sc-img { background: var(--gray-800); }
    .sc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
    .similar-card:hover .sc-img img { transform: scale(1.05); }
    .sc-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; }
    .sc-placeholder .material-icons { font-size: 2rem; color: var(--color-muted); }
    .sc-body { padding: .75rem; }
    .sc-title { font-size: .85rem; font-weight: 700; color: var(--color-ink); margin: 0 0 .5rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sc-date, .sc-place { display: flex; align-items: center; gap: 4px; font-size: .75rem; color: var(--color-muted); margin: .25rem 0; }
    .sc-date .material-icons, .sc-place .material-icons { font-size: 13px !important; }
  `],
})
export class SimilarEventsComponent implements OnInit {
  @Input() eventId!: string;
  events = signal<any[]>([]);

  constructor(private recoService: RecommendationService) {}

  ngOnInit(): void {
    this.recoService.getSimilarEvents(this.eventId).subscribe({
      next: (res) => this.events.set(res.data?.events || []),
    });
  }
}
