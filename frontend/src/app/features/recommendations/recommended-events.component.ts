import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecommendationService } from '../../core/services/recommendation.service';
import { AuthService }           from '../../core/services/auth.service';

@Component({
  selector: 'app-recommended-events',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './recommended-events.component.html',
  styleUrl: './recommended-events.component.css',
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
