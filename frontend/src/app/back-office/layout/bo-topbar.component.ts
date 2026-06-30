import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-bo-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<header class="bo-topbar">
  <div class="bo-topbar-left">
    <button class="bo-menu-btn" (click)="toggleSidebar.emit()">
      <span class="material-icons">menu</span>
    </button>
    <div class="bo-breadcrumb">
      <span class="material-icons bo-bc-icon">home</span>
      <span class="bo-bc-sep">/</span>
      <span class="bo-bc-page">{{ pageTitle }}</span>
    </div>
  </div>
  <div class="bo-topbar-right">
    <a routerLink="/" class="bo-topbar-fo-link">
      <span class="material-icons">open_in_new</span>
      <span>Front Office</span>
    </a>
    <div class="bo-topbar-user">
      <div class="bo-topbar-avatar">{{ initial }}</div>
      <div class="bo-topbar-info">
        <span class="bo-topbar-name">{{ auth.currentUser()?.fullName }}</span>
        <span class="bo-topbar-role">{{ roleLabel }}</span>
      </div>
      <button class="bo-topbar-theme" (click)="toggleTheme()" [title]="isDark ? 'Mode clair' : 'Mode sombre'">
        <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      <button class="bo-topbar-logout" (click)="logout()" title="Déconnexion">
        <span class="material-icons">logout</span>
      </button>
    </div>
  </div>
</header>
  `,
  styles: [`
    .bo-topbar {
      height:64px; display:flex; align-items:center; justify-content:space-between;
      padding:0 var(--space-6); background:var(--color-surface);
      border-bottom:1px solid var(--color-line); position:sticky; top:0; z-index:100;
      box-shadow:var(--shadow-xs);
    }
    .bo-topbar-left { display:flex; align-items:center; gap:var(--space-4); }
    .bo-menu-btn { background:none; border:none; cursor:pointer; color:var(--color-muted); padding:.25rem; border-radius:var(--radius-sm); }
    .bo-menu-btn:hover { background:var(--gray-100); color:var(--color-ink); }
    .bo-menu-btn .material-icons { font-size:22px; display:block; }
    .bo-breadcrumb { display:flex; align-items:center; gap:var(--space-2); font-size:.875rem; color:var(--color-muted); }
    .bo-bc-icon { font-size:16px; }
    .bo-bc-sep { color:var(--gray-300); }
    .bo-bc-page { color:var(--color-ink); font-weight:600; }
    .bo-topbar-right { display:flex; align-items:center; gap:var(--space-4); }
    .bo-topbar-fo-link { display:flex; align-items:center; gap:6px; font-size:.8rem; font-weight:600; color:var(--color-primary); text-decoration:none; padding:.4rem .875rem; border-radius:var(--radius-md); border:1.5px solid var(--brand-200); transition:all var(--duration-fast); }
    .bo-topbar-fo-link:hover { background:var(--brand-50); }
    .bo-topbar-fo-link .material-icons { font-size:16px; }
    .bo-topbar-user { display:flex; align-items:center; gap:var(--space-3); }
    .bo-topbar-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--color-primary),var(--brand-400)); color:#fff; font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; }
    .bo-topbar-info { display:flex; flex-direction:column; }
    .bo-topbar-name { font-size:.8rem; font-weight:700; color:var(--color-ink); line-height:1.2; }
    .bo-topbar-role { font-size:.7rem; color:var(--color-muted); }
    .bo-topbar-theme { background:none; border:none; cursor:pointer; color:var(--color-muted); padding:.4rem; border-radius:var(--radius-sm); transition:all var(--duration-fast); display:flex; align-items:center; }
    .bo-topbar-theme:hover { background:var(--gray-100); color:var(--color-ink); }
    .bo-topbar-theme .material-icons { font-size:20px; display:block; }
    .bo-topbar-logout { background:none; border:none; cursor:pointer; color:var(--color-muted); padding:.4rem; border-radius:var(--radius-sm); transition:all var(--duration-fast); }
    .bo-topbar-logout:hover { background:var(--color-danger-bg); color:var(--color-danger); }
    .bo-topbar-logout .material-icons { font-size:18px; display:block; }
    @media(max-width:640px) { .bo-topbar-info,.bo-topbar-fo-link span:not(.material-icons) { display:none; } }
  `],
})
export class BoTopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  pageTitle = 'Tableau de bord';

  private pageTitles: Record<string, string> = {
    '/backoffice':              'Tableau de bord',
    '/backoffice/events':       'Gestion des événements',
    '/backoffice/reservations': 'Gestion des réservations',
    '/backoffice/certificates': 'Gestion des certificats',
    '/backoffice/participants': 'Participants',
    '/backoffice/users':        'Gestion des utilisateurs',
    '/backoffice/reclamations': 'Réclamations',
  };

  constructor(public auth: AuthService, private router: Router, public theme: ThemeService) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const base = '/' + e.urlAfterRedirects.split('/').slice(1, 3).join('/');
      this.pageTitle = this.pageTitles[base] || 'Back Office';
    });
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/login']); }

  get isDark(): boolean { return this.theme.isDark(); }

  toggleTheme(): void { this.theme.toggle(); }

  get initial(): string { return this.auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() ?? '?'; }
  get roleLabel(): string {
    const map: Record<string, string> = { ADMIN: 'Administrateur', ORGANIZER: 'Organisateur' };
    return map[this.auth.currentUser()?.role ?? ''] ?? '';
  }
}
