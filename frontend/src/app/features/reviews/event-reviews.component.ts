import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../core/services/review.service';
import { AuthService }   from '../../core/services/auth.service';
import { Review }        from '../../core/models/lot2.models';

@Component({
  selector: 'app-event-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
<<<<<<< HEAD
  templateUrl: './event-reviews.component.html',
  styleUrls: ['./event-reviews.component.css'],
=======
<<<<<<< HEAD
  templateUrl: './event-reviews.component.html',
  styleUrls: ['./event-reviews.component.css'],
=======
  template: `
<div class="reviews-section">
  <div class="reviews-header">
    <h2>⭐ Avis et Évaluations</h2>
    <div class="avg-badge" *ngIf="total() > 0">
      <span class="avg-score">{{ avgRating() }}</span>
      <div class="avg-detail">
        <div class="stars-display">{{ starString(avgRating()) }}</div>
        <span class="total-label">{{ total() }} avis</span>
      </div>
    </div>
  </div>

  <!-- Write a review -->
  <div class="write-review" *ngIf="canReview && auth.isAuthenticated()">
    <h3>{{ myReview() ? 'Modifier mon avis' : 'Laisser un avis' }}</h3>
    <div class="star-picker">
      <span *ngFor="let s of [1,2,3,4,5]"
            class="star" [class.active]="newRating() >= s"
            (click)="newRating.set(s)"
            (mouseenter)="hoverRating.set(s)"
            (mouseleave)="hoverRating.set(0)"
            [class.hover]="hoverRating() >= s">★</span>
    </div>
    <textarea [(ngModel)]="newComment" rows="3" placeholder="Partagez votre expérience…" class="review-textarea"></textarea>
    <button class="btn btn-primary" (click)="submitReview()" [disabled]="newRating() === 0 || submitting()">
      {{ submitting() ? 'Envoi…' : (myReview() ? 'Mettre à jour' : 'Publier') }}
    </button>
    <p class="review-error" *ngIf="submitError()">{{ submitError() }}</p>
  </div>

  <!-- Reviews list -->
  <div *ngIf="loading()" class="loading-mini"><div class="spinner-sm"></div></div>

  <div *ngIf="!loading() && total() === 0" class="empty-reviews">
    <p>Aucun avis pour le moment. Soyez le premier !</p>
  </div>

  <div class="reviews-list" *ngIf="!loading()">
    <div *ngFor="let review of reviews()" class="review-item">
      <div class="review-top">
        <div class="reviewer-avatar">{{ getInitial(review.user?.fullName) }}</div>
        <div class="reviewer-info">
          <strong>{{ review.user?.fullName || 'Participant' }}</strong>
          <span class="review-date">{{ review.createdAt | date:'dd/MM/yyyy' }}</span>
        </div>
        <div class="review-stars">{{ starString(review.rating) }}</div>
        <button *ngIf="canDelete(review)" class="delete-btn" (click)="deleteReview(review._id)">🗑</button>
      </div>
      <p class="review-comment" *ngIf="review.comment">{{ review.comment }}</p>
    </div>
  </div>
</div>
  `,
  styles: [`
    .reviews-section { background:#fff; border-radius:16px; padding:1.5rem; border:1px solid #e2e8f0; margin-top:1.5rem; }
    .reviews-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
    .reviews-header h2 { font-size:1.25rem; font-weight:700; color:#1e293b; margin:0; }
    .avg-badge { display:flex; align-items:center; gap:.75rem; background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:.5rem 1rem; }
    .avg-score { font-size:2rem; font-weight:800; color:#d97706; line-height:1; }
    .stars-display { color:#f59e0b; font-size:1.1rem; letter-spacing:2px; }
    .total-label { font-size:.8rem; color:#92400e; }
    .write-review { background:#f8fafc; border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; }
    .write-review h3 { font-size:1rem; font-weight:600; margin:0 0 .75rem; color:#1e293b; }
    .star-picker { display:flex; gap:.25rem; margin-bottom:.75rem; cursor:pointer; }
    .star { font-size:2rem; color:#d1d5db; transition:color .15s; }
    .star.active,.star.hover { color:#f59e0b; }
    .review-textarea { width:100%; border:1.5px solid #e2e8f0; border-radius:8px; padding:.75rem; font-size:.9rem; resize:vertical; font-family:inherit; box-sizing:border-box; }
    .review-textarea:focus { outline:none; border-color:#6366f1; }
    .review-error { color:#dc2626; font-size:.85rem; margin-top:.5rem; }
    .loading-mini { display:flex; justify-content:center; padding:2rem; }
    .spinner-sm { width:28px; height:28px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-reviews { text-align:center; color:#94a3b8; padding:2rem; }
    .reviews-list { display:flex; flex-direction:column; gap:1rem; }
    .review-item { border:1px solid #f1f5f9; border-radius:12px; padding:1rem; }
    .review-top { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .reviewer-avatar { width:36px; height:36px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.9rem; flex-shrink:0; }
    .reviewer-info { flex:1; }
    .reviewer-info strong { display:block; font-size:.9rem; color:#1e293b; }
    .review-date { font-size:.75rem; color:#94a3b8; }
    .review-stars { color:#f59e0b; font-size:1rem; letter-spacing:1px; }
    .review-comment { color:#475569; font-size:.9rem; margin:0; line-height:1.5; }
    .delete-btn { background:none; border:none; cursor:pointer; color:#ef4444; font-size:1rem; margin-left:auto; }
    .btn { padding:.5rem 1.2rem; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-size:.875rem; margin-top:.75rem; }
    .btn-primary { background:#6366f1; color:#fff; } .btn-primary:hover:not(:disabled) { background:#4f46e5; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
  `],
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
})
export class EventReviewsComponent implements OnInit {
  @Input() eventId!: string;
  @Input() canReview = false;   // true only when event is past and user has confirmed reservation
  @Input() isEventPast = false;

  reviews    = signal<Review[]>([]);
  total      = signal(0);
  avgRating  = signal(0);
  loading    = signal(true);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  myReview   = signal<Review | null>(null);
  newRating  = signal(0);
  hoverRating = signal(0);
  newComment  = '';

  constructor(
    private reviewService: ReviewService,
    public  auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.reviewService.getEventReviews(this.eventId).subscribe({
      next: (res) => {
        this.reviews.set(res.data?.reviews || []);
        this.total.set(res.data?.total || 0);
        this.avgRating.set(res.data?.avgRating || 0);
        // Find current user's review
        const me = this.auth.currentUser()!;
        if (me) {
          const mine = this.reviews().find(r => r.user?._id === me._id);
          if (mine) {
            this.myReview.set(mine);
            this.newRating.set(mine.rating);
            this.newComment = mine.comment || '';
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitReview(): void {
    if (this.newRating() === 0) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.reviewService.createReview({
      eventId: this.eventId,
      rating:  this.newRating(),
      comment: this.newComment,
    }).subscribe({
      next: () => { this.submitting.set(false); this.loadReviews(); },
      error: (err) => {
        this.submitError.set(err.error?.message || 'Erreur lors de l\'envoi.');
        this.submitting.set(false);
      },
    });
  }

  deleteReview(id: string): void {
    this.reviewService.deleteReview(id).subscribe({ next: () => this.loadReviews() });
  }

  canDelete(review: Review): boolean {
    const me = this.auth.currentUser();
    if (!me) return false;
<<<<<<< HEAD
    return review.user._id === me._id || me.role === 'ADMIN';
=======
<<<<<<< HEAD
    return review.user._id === me._id || me.role === 'ADMIN';
=======
    return review.user?._id === me._id || me.role === 'ADMIN';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  }

  starString(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

<<<<<<< HEAD
  /** Hide entire section when no reviews and nothing actionable for the user */
  get showSection(): boolean {
    return this.loading() || this.total() > 0 || (this.canReview && this.auth.isAuthenticated());
  }

  getInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  scrollToForm(): void {
    const el = document.querySelector('.write-review');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
=======
  getInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
}
