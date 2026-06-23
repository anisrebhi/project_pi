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
  <h2>🔗 Événements similaires</h2>
  <div class="similar-grid">
    <a *ngFor="let event of events()" [routerLink]="['/events', event._id]" class="similar-card">
      <div class="sc-img">
        <img *ngIf="event.images?.[0]" [src]="event.images[0]" [alt]="event.title" loading="lazy" />
        <div *ngIf="!event.images?.[0]" class="sc-placeholder">🎫</div>
      </div>
      <div class="sc-body">
        <h3 class="sc-title">{{ event.title }}</h3>
        <p class="sc-date">📅 {{ event.startDate | date:'dd MMM yyyy':'':'fr' }}</p>
        <p class="sc-place" *ngIf="event.location?.address">📍 {{ event.location.address }}</p>
      </div>
    </a>
  </div>
</section>
  `,
  styles: [`
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
