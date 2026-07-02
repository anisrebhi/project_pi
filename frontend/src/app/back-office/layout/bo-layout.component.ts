import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BoSidebarComponent } from './bo-sidebar.component';
import { BoTopbarComponent }  from './bo-topbar.component';

@Component({
  selector: 'app-bo-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BoSidebarComponent, BoTopbarComponent],
  template: `
<div class="bo-shell" [class.sidebar-collapsed]="collapsed()">
  <app-bo-sidebar [collapsed]="collapsed()" (toggleCollapse)="toggleCollapsed()"></app-bo-sidebar>
  <div class="bo-content">
    <app-bo-topbar (toggleSidebar)="toggleCollapsed()"></app-bo-topbar>
    <main class="bo-main">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
  `,
  styles: [`
    .bo-shell { display:flex; min-height:100vh; background:var(--bo-bg,#f0f4f8); }
    .bo-content { flex:1; display:flex; flex-direction:column; min-width:0; transition:margin-left var(--duration-base); }
    .bo-main { flex:1; padding:var(--space-6); overflow-x:hidden; }
    @media(max-width:1024px) { .bo-main { padding:var(--space-4); } }
  `],
})
export class BoLayoutComponent {
  collapsed = signal(false);

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
  }
}
