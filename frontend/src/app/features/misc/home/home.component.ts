<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
=======
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
import { AuthService } from '../../../core/services/auth.service';
import { RecommendedEventsComponent } from '../../recommendations/recommended-events.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RecommendedEventsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
<<<<<<< HEAD
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
=======
export class HomeComponent {
  constructor(public auth: AuthService) {}

  get isAdmin(): boolean { return this.auth.currentUser()?.role === 'ADMIN'; }

  /** Replace broken logo with an inline SVG fallback */
  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'hero-logo-fallback';
    fallback.innerHTML = `
      <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="6" width="34" height="28" rx="4" fill="#4b3fe4"/>
        <path d="M1 18 Q7 18 7 14 Q7 10 1 10" stroke="#fff" stroke-width="1.5" fill="none"/>
        <path d="M35 18 Q29 18 29 14 Q29 10 35 10" stroke="#fff" stroke-width="1.5" fill="none"/>
        <path d="M1 22 Q7 22 7 26 Q7 30 1 30" stroke="#fff" stroke-width="1.5" fill="none"/>
        <path d="M35 22 Q29 22 29 26 Q29 30 35 30" stroke="#fff" stroke-width="1.5" fill="none"/>
        <line x1="12" y1="14" x2="24" y2="14" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 2"/>
        <line x1="12" y1="20" x2="24" y2="20" stroke="#fff" stroke-width="1.5"/>
        <line x1="12" y1="26" x2="24" y2="26" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 2"/>
        <text x="44" y="27" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="800" fill="#1a1a2e">Event</text>
        <text x="100" y="27" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="800" fill="#4b3fe4">Pass</text>
      </svg>`;
    img.parentElement?.appendChild(fallback);
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  }
}
