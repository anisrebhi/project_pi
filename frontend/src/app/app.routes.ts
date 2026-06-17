import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

import { AdminEventListComponent } from './features/events/admin/event-list/event-list.component';
import { EventFormComponent } from './features/events/admin/event-form/event-form.component';
import { UserEventListComponent } from './features/events/user/event-list/event-list.component';
import { EventDetailComponent } from './features/events/user/event-detail/event-detail.component';

import { AdminReservationListComponent } from './features/reservations/admin/reservation-list/reservation-list.component';
import { UserReservationListComponent } from './features/reservations/user/reservation-list/reservation-list.component';
import { ReservationDetailComponent } from './features/reservations/user/reservation-detail/reservation-detail.component';

import { NotFoundComponent } from './features/misc/not-found/not-found.component';
import { UnauthorizedComponent } from './features/misc/unauthorized/unauthorized.component';
import { EventManageComponent } from './features/events/manage/event-manage.component';

export const routes: Routes = [
  // ─── Public / guest-only routes (no shell) ───────────────────────────────
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // ─── Authenticated app shell (navbar + router-outlet) ───────────────────
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'events' },

      // ── Module Événement — Interface Administrateur ──────────────────────
      {
        path: 'admin/events',
        canActivate: [roleGuard(['ADMIN'])],
        children: [
          { path: '', component: AdminEventListComponent },
          { path: 'new', component: EventFormComponent },
          { path: ':id/edit', component: EventFormComponent },
        ],
      },

      // ── Module Réservation — Interface Administrateur ────────────────────
      {
        path: 'admin/reservations',
        canActivate: [roleGuard(['ADMIN'])],
        children: [{ path: '', component: AdminReservationListComponent }],
      },

      // ── Gestion Événements — CRUD unifié ─────────────────────────────────
      { path: 'manage/events', component: EventManageComponent },

      // ── Module Événement — Interface Utilisateur ──────────────────────────
      {
        path: 'events',
        children: [
          { path: '', component: UserEventListComponent },
          { path: ':id', component: EventDetailComponent },
        ],
      },

      // ── Module Réservation — Interface Utilisateur ────────────────────────
      {
        path: 'my-reservations',
        children: [
          { path: '', component: UserReservationListComponent },
          { path: ':id', component: ReservationDetailComponent },
        ],
      },
    ],
  },

  // ─── Fallback ─────────────────────────────────────────────────────────
  { path: '**', component: NotFoundComponent },
];
