import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-fo-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<header class="fo-nav">
  <div class="fo-nav-inner">
    <!-- Brand -->
    <a class="fo-brand" routerLink="/">
      <div class="fo-brand-icon">EP</div>
      <span class="fo-brand-name">Event<strong>Pass</strong></span>
    </a>

    <!-- Desktop links -->
    <nav class="fo-links" [class.open]="mobileOpen()">
      <a routerLink="/events" routerLinkActive="fo-link-active" [routerLinkActiveOptions]="{exact:false}" class="fo-link" (click)="close()" *ngIf="!auth.isAuthenticated() || !isParticipant">
        <span class="material-icons">explore</span> Événements
      </a>
      <ng-container *ngIf="auth.isAuthenticated() && isStaff">
        <a routerLink="/my-reservations" routerLinkActive="fo-link-active" [routerLinkActiveOptions]="{exact:false}" class="fo-link" (click)="close()">
          <span class="material-icons">confirmation_number</span> Mes réservations
        </a>
        <a routerLink="/my-certificates" routerLinkActive="fo-link-active" class="fo-link" (click)="close()">
          <span class="material-icons">workspace_premium</span> Certificats
        </a>
      </ng-container>
    </nav>

    <!-- Right actions -->
    <div class="fo-nav-right">
      <!-- Back-office link for admin/organizer -->
      <a *ngIf="isStaff" routerLink="/backoffice" class="btn-bo-link">
        <span class="material-icons">admin_panel_settings</span>
        <span class="btn-bo-label">Back Office</span>
      </a>

      <button class="fo-theme-btn" (click)="toggleTheme()" [title]="isDark ? 'Mode clair' : 'Mode sombre'">
        <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <ng-container *ngIf="auth.isAuthenticated(); else guestBtns">
        <div class="fo-user-menu" (click)="toggleUserMenu()">
          <div class="fo-avatar">{{ initial }}</div>
          <span class="fo-user-name">{{ userFirstName }}</span>
          <span class="material-icons fo-chevron">expand_more</span>

          <div class="fo-dropdown" *ngIf="userMenuOpen()">
            <div class="fo-dropdown-header">
              <strong>{{ auth.currentUser()?.fullName }}</strong>
              <span class="fo-role-pill">{{ roleLabel }}</span>
            </div>
            <a routerLink="/profile" class="fo-dropdown-item" (click)="userMenuOpen.set(false)">
              <span class="material-icons">person</span> Mon profil
            </a>
            <a routerLink="/my-reservations" class="fo-dropdown-item" (click)="userMenuOpen.set(false)">
              <span class="material-icons">confirmation_number</span> Mes réservations
            </a>
            <a routerLink="/my-certificates" class="fo-dropdown-item" (click)="userMenuOpen.set(false)">
              <span class="material-icons">workspace_premium</span> Certificats
            </a>
            <div class="fo-dropdown-divider"></div>
            <button class="fo-dropdown-item danger" (click)="logout()">
              <span class="material-icons">logout</span> Déconnexion
            </button>
          </div>
        </div>
      </ng-container>

      <ng-template #guestBtns>
        <a routerLink="/login" class="btn btn-ghost btn-sm">Se connecter</a>
        <a routerLink="/register" class="btn btn-primary btn-sm">S'inscrire</a>
      </ng-template>

      <!-- Mobile hamburger -->
      <button class="fo-hamburger" (click)="toggleMobileMenu()">
        <span class="material-icons">{{ mobileOpen() ? 'close' : 'menu' }}</span>
      </button>
    </div>
  </div>

  <!-- Mobile menu backdrop -->
  <div class="fo-mobile-backdrop" *ngIf="mobileOpen()" (click)="close()"></div>
</header>
  `,
  styles: [`
    .fo-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      background: rgba(255,255,255,.95); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-line);
      height: 68px; display: flex; align-items: center;
    }
    .fo-nav-inner {
      max-width: var(--max-w); margin: 0 auto; padding: 0 var(--space-6);
      display: flex; align-items: center; gap: var(--space-6); width: 100%;
    }
    .fo-brand { display:flex; align-items:center; gap:var(--space-3); text-decoration:none; flex-shrink:0; }
    .fo-brand-icon {
      width:36px; height:36px; border-radius:10px;
      background: linear-gradient(135deg, var(--color-primary), var(--brand-400));
      color:#fff; font-size:.85rem; font-weight:900;
      display:flex; align-items:center; justify-content:center; letter-spacing:-.5px;
    }
    .fo-brand-name { font-size:1.1rem; font-weight:600; color:var(--color-ink); }
    .fo-brand-name strong { color:var(--color-primary); }
    .fo-links { display:flex; align-items:center; gap:var(--space-1); flex:1; }
    .fo-link {
      display:flex; align-items:center; gap:6px; padding:.5rem .875rem;
      border-radius:var(--radius-md); font-size:.875rem; font-weight:500;
      color:var(--color-muted); text-decoration:none;
      transition: all var(--duration-fast);
    }
    .fo-link:hover { background:var(--gray-100); color:var(--color-ink); }
    .fo-link .material-icons { font-size:18px; }
    .fo-link-active { background:var(--brand-50) !important; color:var(--color-primary) !important; font-weight:600; }
    .fo-nav-right { display:flex; align-items:center; gap:var(--space-3); margin-left:auto; }
    .btn-bo-link {
      display:flex; align-items:center; gap:6px;
      padding:.4rem .875rem; border-radius:var(--radius-md);
      background:linear-gradient(135deg,#0f172a,#1e293b);
      color:#e2e8f0; font-size:.78rem; font-weight:700;
      text-decoration:none; transition:all var(--duration-base);
      border:1px solid #334155;
    }
    .btn-bo-link:hover { background:#1e293b; color:#fff; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.2); }
    .btn-bo-link .material-icons { font-size:16px; }
    .btn-bo-label { display:none; }
    @media(min-width:768px) { .btn-bo-label { display:inline; } }
    .fo-user-menu { position:relative; display:flex; align-items:center; gap:8px; cursor:pointer; padding:.4rem .875rem; border-radius:var(--radius-md); transition:background var(--duration-fast); }
    .fo-user-menu:hover { background:var(--gray-100); }
    .fo-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--color-primary),var(--brand-400)); color:#fff; font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; }
    .fo-user-name { font-size:.875rem; font-weight:600; color:var(--color-ink); }
    .fo-chevron { font-size:18px; color:var(--color-muted); }
    .fo-dropdown {
      position:absolute; top:calc(100% + 8px); right:0; min-width:220px;
      background:var(--color-surface); border:1px solid var(--color-line);
      border-radius:var(--radius-lg); box-shadow:var(--shadow-xl);
      padding:var(--space-2); z-index:300; animation:fadeIn .15s;
    }
    .fo-dropdown-header { padding:var(--space-3) var(--space-3) var(--space-2); border-bottom:1px solid var(--color-line); margin-bottom:var(--space-2); }
    .fo-dropdown-header strong { display:block; font-size:.875rem; color:var(--color-ink); margin-bottom:4px; }
    .fo-role-pill { font-size:.7rem; background:var(--brand-50); color:var(--color-primary); padding:.15rem .5rem; border-radius:var(--radius-full); font-weight:700; }
    .fo-dropdown-item { display:flex; align-items:center; gap:var(--space-3); padding:.6rem var(--space-3); border-radius:var(--radius-md); font-size:.875rem; color:var(--color-ink); text-decoration:none; transition:background var(--duration-fast); width:100%; border:none; background:none; cursor:pointer; font-family:inherit; }
    .fo-dropdown-item:hover { background:var(--gray-50); }
    .fo-dropdown-item.danger { color:var(--color-danger); }
    .fo-dropdown-item.danger:hover { background:var(--color-danger-bg); }
    .fo-dropdown-item .material-icons { font-size:18px; color:var(--color-muted); }
    .fo-dropdown-item.danger .material-icons { color:var(--color-danger); }
    .fo-dropdown-divider { height:1px; background:var(--color-line); margin:var(--space-2) 0; }
    .fo-theme-btn { background:none; border:none; cursor:pointer; color:var(--color-muted); padding:.4rem; border-radius:var(--radius-sm); transition:all var(--duration-fast); display:flex; align-items:center; }
    .fo-theme-btn:hover { background:var(--gray-100); color:var(--color-ink); }
    .fo-theme-btn .material-icons { font-size:20px; }
    .fo-hamburger { display:none; background:none; border:none; cursor:pointer; color:var(--color-ink); padding:.25rem; }
    .fo-hamburger .material-icons { font-size:24px; }
    .fo-mobile-backdrop { display:none; }
    @media(max-width:768px) {
      .fo-links { display:none; position:fixed; top:68px; left:0; right:0; bottom:0; background:rgba(255,255,255,.98); flex-direction:column; align-items:flex-start; padding:var(--space-6); gap:var(--space-2); z-index:199; backdrop-filter:blur(10px); }
      .fo-links.open { display:flex; }
      .fo-link { width:100%; padding:var(--space-4); font-size:1rem; }
      .fo-hamburger { display:flex; }
      .fo-mobile-backdrop { display:block; }
      .fo-user-name { display:none; }
      .fo-chevron { display:none; }
    }
  `],
})
export class FoNavbarComponent {
  mobileOpen  = signal(false);
  userMenuOpen = signal(false);

  constructor(public auth: AuthService, private router: Router, public theme: ThemeService) {}

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: HTMLElement): void {
    if (!target.closest('.fo-user-menu')) this.userMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.close(); this.userMenuOpen.set(false); }

  close(): void { this.mobileOpen.set(false); }

  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }

  toggleMobileMenu(): void { this.mobileOpen.update(v => !v); }

  logout(): void {
    this.auth.logout();
    this.userMenuOpen.set(false);
    this.router.navigate(['/login']);
  }

  get initial(): string {
    return this.auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() ?? '?';
  }
  get userFirstName(): string {
    const fullName = this.auth.currentUser()?.fullName;
    return fullName ? fullName.split(' ')[0] : 'Utilisateur';
  }
  get roleLabel(): string {
    const map: Record<string, string> = { ADMIN: 'Administrateur', ORGANIZER: 'Organisateur', PARTICIPANT: 'Participant' };
    return map[this.auth.currentUser()?.role ?? ''] ?? '';
  }
  get isParticipant(): boolean { return this.auth.currentUser()?.role === 'PARTICIPANT'; }
  get isStaff(): boolean {
    const r = this.auth.currentUser()?.role;
    return r === 'ADMIN' || r === 'ORGANIZER';
  }

  get isDark(): boolean { return this.theme.isDark(); }

  toggleTheme(): void { this.theme.toggle(); }
}
