import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService } from '../../core/services/recommendation.service';
import { AuthService }           from '../../core/services/auth.service';

@Component({
  selector: 'app-recommended-events',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
<section class="reco-section" *ngIf="auth.isAuthenticated() && events().length > 0">
  <div class="reco-header">
    <h2>✨ Événements recommandés pour vous</h2>
    <p *ngIf="basedOn().length > 0" class="reco-basis">
      Basé sur vos intérêts : <span *ngFor="let cat of basedOn(); let last=last" class="cat-pill">{{ cat }}<span *ngIf="!last">, </span></span>
    </p>
  </div>
  <div class="reco-grid">
    <a *ngFor="let event of events()" [routerLink]="['/events', event._id]" class="reco-card">
      <div class="reco-card__img">
        <img *ngIf="event.images?.[0]" [src]="event.images[0]" [alt]="event.title" loading="lazy" />
        <div *ngIf="!event.images?.[0]" class="reco-card__img-placeholder">🎫</div>
        <span class="reco-badge" *ngIf="event.type === 'free' || event.price === 0">Gratuit</span>
      </div>
      <div class="reco-card__body">
        <span class="reco-category">{{ event.category }}</span>
        <h3 class="reco-title">{{ event.title }}</h3>
        <div class="reco-meta">
          <span>📅 {{ event.startDate | date:'dd MMM yyyy':'':'fr' }}</span>
          <span *ngIf="event.location?.address">📍 {{ event.location.address }}</span>
        </div>
        <div class="reco-footer">
          <span class="reco-price" *ngIf="event.price > 0">{{ event.price }} DT</span>
          <span class="reco-price free" *ngIf="!event.price">Gratuit</span>
          <span class="reco-spots" *ngIf="event.capacity">{{ event.capacity - (event.participants?.length || 0) }} places</span>
        </div>
      </div>
    </a>
  </div>
</section>
  `,
  styles: [`
    .reco-section { margin:2.5rem 0; }
    .reco-header { margin-bottom:1.25rem; }
    .reco-header h2 { font-size:1.35rem; font-weight:700; color:#1e293b; margin:0 0 .35rem; }
    .reco-basis { color:#64748b; font-size:.875rem; margin:0; }
    .cat-pill { font-weight:600; color:#6366f1; }
    .reco-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1.25rem; }
    .reco-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; text-decoration:none; color:inherit; overflow:hidden; transition:transform .2s,box-shadow .2s; display:flex; flex-direction:column; }
    .reco-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(99,102,241,.15); border-color:#a5b4fc; }
    .reco-card__img { aspect-ratio:16/9; position:relative; overflow:hidden; background:#f1f5f9; }
    .reco-card__img img { width:100%; height:100%; object-fit:cover; transition:transform .3s; }
    .reco-card:hover .reco-card__img img { transform:scale(1.05); }
    .reco-card__img-placeholder { display:flex; align-items:center; justify-content:center; height:100%; font-size:2.5rem; }
    .reco-badge { position:absolute; top:.5rem; right:.5rem; background:#10b981; color:#fff; font-size:.7rem; font-weight:700; padding:.2rem .5rem; border-radius:6px; }
    .reco-card__body { padding:1rem; flex:1; display:flex; flex-direction:column; gap:.35rem; }
    .reco-category { font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; color:#6366f1; font-weight:700; }
    .reco-title { font-size:.95rem; font-weight:700; color:#1e293b; margin:0; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .reco-meta { display:flex; flex-direction:column; gap:.2rem; font-size:.78rem; color:#64748b; }
    .reco-footer { display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:.5rem; border-top:1px solid #f1f5f9; }
    .reco-price { font-weight:700; color:#6366f1; font-size:.9rem; }
    .reco-price.free { color:#10b981; }
    .reco-spots { font-size:.75rem; color:#94a3b8; }
    @media(max-width:600px) { .reco-grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); } }
  `],
})
export class RecommendedEventsComponent implements OnInit {
  events  = signal<any[]>([]);
  basedOn = signal<string[]>([]);

  constructor(
    public  auth: AuthService,
    private recoService: RecommendationService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) return;
    this.recoService.getRecommendations().subscribe({
      next: (res) => {
        this.events.set(res.data?.events?.slice(0, 8) || []);
        this.basedOn.set(res.data?.basedOn || []);
      },
    });
  }
}
