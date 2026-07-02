import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  badge?: string;
}

@Component({
  selector: 'app-bo-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<aside class="bo-sidebar" [class.collapsed]="collapsed">
  <!-- Logo -->
  <div class="bo-sidebar-brand">
    <div class="bo-logo-icon">EP</div>
    <span class="bo-logo-text" *ngIf="!collapsed">
      Event<strong>Pass</strong>
      <small>Back Office</small>
    </span>
  </div>

  <!-- Nav -->
  <nav class="bo-nav">
    <div class="bo-nav-label" *ngIf="!collapsed">Navigation</div>

    <ng-container *ngFor="let item of navItems">
      <a *ngIf="canSee(item)"
         [routerLink]="item.route"
         routerLinkActive="bo-nav-active"
         [routerLinkActiveOptions]="{exact: item.route === '/backoffice'}"
         class="bo-nav-item"
         [title]="collapsed ? item.label : ''">
        <span class="material-icons bo-nav-icon">{{ item.icon }}</span>
        <span class="bo-nav-label-text" *ngIf="!collapsed">{{ item.label }}</span>
        <span class="bo-nav-badge" *ngIf="item.badge && !collapsed">{{ item.badge }}</span>
      </a>
    </ng-container>
  </nav>

  <!-- Footer links -->
  <div class="bo-sidebar-footer">
    <a routerLink="/" class="bo-footer-link" [title]="collapsed ? 'Front Office' : ''">
      <span class="material-icons">open_in_new</span>
      <span *ngIf="!collapsed">Front Office</span>
    </a>
    <button class="bo-collapse-btn" (click)="toggleCollapse.emit()" [title]="collapsed ? 'Agrandir' : 'Réduire'">
      <span class="material-icons">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
    </button>
  </div>
</aside>
  `,
  styles: [`
    :host { display:block; }
    .bo-sidebar {
      width:260px; min-height:100vh;
      background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);
      display:flex; flex-direction:column; flex-shrink:0;
      transition:width var(--duration-base) var(--ease-out);
      position:sticky; top:0; height:100vh; overflow:hidden;
    }
    .bo-sidebar.collapsed { width:72px; }

    .bo-sidebar-brand {
      display:flex; align-items:center; gap:var(--space-3);
      padding:var(--space-5) var(--space-4); border-bottom:1px solid #1e293b;
      min-height:68px; flex-shrink:0;
    }
    .bo-logo-icon {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      background:linear-gradient(135deg,var(--color-primary),var(--brand-400));
      color:#fff; font-weight:900; font-size:.85rem;
      display:flex; align-items:center; justify-content:center;
    }
    .bo-logo-text { font-size:1rem; font-weight:600; color:#f1f5f9; line-height:1.2; white-space:nowrap; overflow:hidden; }
    .bo-logo-text strong { color:var(--brand-400); }
    .bo-logo-text small { display:block; font-size:.65rem; color:#64748b; font-weight:500; text-transform:uppercase; letter-spacing:.1em; margin-top:2px; }

    .bo-nav { flex:1; padding:var(--space-4) var(--space-3); overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
    .bo-nav-label { font-size:.65rem; text-transform:uppercase; letter-spacing:.1em; color:#475569; font-weight:700; padding:var(--space-4) var(--space-3) var(--space-2); }

    .bo-nav-item {
      display:flex; align-items:center; gap:var(--space-3);
      padding:.7rem var(--space-3); border-radius:var(--radius-md);
      color:#94a3b8; text-decoration:none; font-size:.875rem; font-weight:500;
      transition:all var(--duration-fast); white-space:nowrap;
    }
    .bo-nav-item:hover { background:rgba(255,255,255,.06); color:#e2e8f0; }
    .bo-nav-active { background:rgba(99,102,241,.2) !important; color:var(--brand-400) !important; font-weight:600; }
    .bo-nav-icon { font-size:20px; flex-shrink:0; }
    .bo-nav-label-text { flex:1; }
    .bo-nav-badge { background:var(--color-primary); color:#fff; font-size:.65rem; font-weight:700; padding:.1rem .45rem; border-radius:var(--radius-full); }

    .bo-sidebar-footer {
      padding:var(--space-3); border-top:1px solid #1e293b;
      display:flex; align-items:center; justify-content:space-between; gap:var(--space-2);
    }
    .bo-footer-link {
      display:flex; align-items:center; gap:var(--space-2);
      color:#475569; text-decoration:none; font-size:.8rem;
      transition:color var(--duration-fast); padding:.5rem;
      border-radius:var(--radius-sm); flex:1;
    }
    .bo-footer-link:hover { color:#94a3b8; }
    .bo-footer-link .material-icons { font-size:18px; }
    .bo-collapse-btn {
      background:rgba(255,255,255,.05); border:none; color:#475569;
      border-radius:var(--radius-sm); padding:.5rem; cursor:pointer;
      transition:all var(--duration-fast); flex-shrink:0;
    }
    .bo-collapse-btn:hover { background:rgba(255,255,255,.1); color:#94a3b8; }
    .bo-collapse-btn .material-icons { font-size:18px; display:block; }
  `],
})
export class BoSidebarComponent {
  @Input()  collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard',           route: '/backoffice',                roles: ['ADMIN','ORGANIZER'] },
    { label: 'Événements',      icon: 'event',               route: '/backoffice/events',          roles: ['ADMIN','ORGANIZER'] },
    { label: 'Réservations',    icon: 'confirmation_number', route: '/backoffice/reservations',    roles: ['ADMIN','ORGANIZER'] },
    { label: 'Certificats',     icon: 'workspace_premium',   route: '/backoffice/certificates',    roles: ['ADMIN','ORGANIZER'] },
    { label: 'Participants',    icon: 'people',              route: '/backoffice/participants',    roles: ['ADMIN','ORGANIZER'] },
    { label: 'Utilisateurs',    icon: 'manage_accounts',     route: '/backoffice/users',           roles: ['ADMIN'] },
  ];

  constructor(public auth: AuthService) {}

  canSee(item: NavItem): boolean {
    const role = this.auth.currentUser()?.role;
    return !!role && (item.roles as string[]).includes(role);
  }
}
