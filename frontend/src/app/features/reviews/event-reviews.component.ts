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
  templateUrl: './event-reviews.component.html',
  styleUrls: ['./event-reviews.component.css'],
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
    return review.user._id === me._id || me.role === 'ADMIN';
  }

  starString(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
