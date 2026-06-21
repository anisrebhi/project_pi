import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, CommonModule],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>precision_manufacturing</mat-icon>
            </div>
            <span class="logo-text">GestMat</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/materials" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon>inventory_2</mat-icon>
            <span>Matériels</span>
          </a>
          <a class="nav-item" routerLink="/materials/new" routerLinkActive="active">
            <mat-icon>add_circle</mat-icon>
            <span>Nouveau matériel</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">AD</div>
            <div class="user-text">
              <span class="user-name">Admin</span>
              <span class="user-role">Gestionnaire</span>
            </div>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <h1 class="page-title">Tableau de bord</h1>
          </div>
          <div class="topbar-right">
            <button class="icon-btn" mat-icon-button>
              <mat-icon>notifications</mat-icon>
            </button>
            <button class="icon-btn" mat-icon-button>
              <mat-icon>help_outline</mat-icon>
            </button>
          </div>
        </header>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .sidebar-header {
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-icon mat-icon {
      color: #fff;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .logo-text {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all var(--transition);
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }
    .nav-item.active {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }
    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent), #f59e0b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
    }
    .user-text {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
    }
    .user-role {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px;
      background: #fff;
      border-bottom: 1px solid rgba(0,0,0,0.04);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: var(--text);
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-btn {
      width: 36px !important;
      height: 36px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      border: none;
      background: var(--bg);
      cursor: pointer;
      transition: background var(--transition);
    }
    .icon-btn:hover { background: #e5e7eb; }
    .icon-btn mat-icon { font-size: 20px; color: var(--text-secondary); }

    .content-area {
      flex: 1;
      padding: 24px 32px;
    }
  `],
})
export class AppComponent {}
