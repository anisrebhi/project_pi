import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RecommendedEventsComponent } from '../../recommendations/recommended-events.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RecommendedEventsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Auto-redirect staff to back office
    const role = this.auth.currentUser()?.role;
    if (role === 'ADMIN' || role === 'ORGANIZER') {
      this.router.navigate(['/backoffice']);
    }
  }

  get isAdmin(): boolean { return this.auth.currentUser()?.role === 'ADMIN'; }
  get isStaff(): boolean {
    const r = this.auth.currentUser()?.role;
    return r === 'ADMIN' || r === 'ORGANIZER';
  }
}
