import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  mobileOpen = signal(false);

  constructor(public auth: AuthService, private router: Router) {}

  @HostListener('document:keydown.escape')
  closeMobile() { this.mobileOpen.set(false); }

  toggle() { this.mobileOpen.update(v => !v); }

  logout(): void {
    this.auth.logout();
    this.mobileOpen.set(false);
    this.router.navigate(['/login']);
  }

  get userInitial(): string {
    return this.auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() ?? '?';
  }

  get userRole(): string {
    const role = this.auth.currentUser()?.role;
    const map: Record<string, string> = { ADMIN: 'Administrateur', ORGANIZER: 'Organisateur', PARTICIPANT: 'Participant' };
    return role ? (map[role] ?? role) : '';
  }

  get isAdmin(): boolean { return this.auth.currentUser()?.role === 'ADMIN'; }
  get isParticipant(): boolean { return this.auth.currentUser()?.role === 'PARTICIPANT'; }
  get isOrganizerOrAdmin(): boolean { const r = this.auth.currentUser()?.role; return r === 'ADMIN' || r === 'ORGANIZER'; }
}
