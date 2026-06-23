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
import { WaitlistListComponent } from './features/waitlist/waitlist-list.component';

import { NotFoundComponent }        from './features/misc/not-found/not-found.component';
import { MyCertificatesComponent }   from './features/certificates/my-certificates.component';
import { VerifyCertificateComponent } from './features/certificates/verify-certificate.component';
import { UnauthorizedComponent } from './features/misc/unauthorized/unauthorized.component';
import { HomeComponent } from './features/misc/home/home.component';

export const routes: Routes = [
  // ─── Public / guest-only routes (no shell) ───────────────────────────────
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // ─── App shell (navbar + router-outlet) ──────────────────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // ── Page d'accueil — publique, contenu adapté si connecté ───────────
      { path: '', pathMatch: 'full', component: HomeComponent },

      // ── Module Événement — Interface Administrateur (ADMIN + ORGANIZER) ──
      {
        path: 'admin/events',
        canActivate: [authGuard, roleGuard(['ADMIN', 'ORGANIZER'])],
        children: [
          { path: '', component: AdminEventListComponent },
          { path: 'new', component: EventFormComponent },
          { path: ':id/edit', component: EventFormComponent },
        ],
      },

      // ── Module Réservation — Interface Administrateur ────────────────────
      {
        path: 'admin/reservations',
        canActivate: [authGuard, roleGuard(['ADMIN'])],
        children: [{ path: '', component: AdminReservationListComponent }],
      },

      // ── Module Événement — Interface Utilisateur ──────────────────────────
      {
        path: 'events',
        canActivate: [authGuard],
        children: [
          { path: '', component: UserEventListComponent },
          { path: ':id', component: EventDetailComponent },
        ],
      },

      // ── Liste d'attente — Interface Utilisateur ───────────────────────────
      {
        path: 'my-waitlist',
        canActivate: [authGuard],
        component: WaitlistListComponent,
      },

      // ── Module Réservation — Interface Utilisateur ────────────────────────
      {
        path: 'my-reservations',
        canActivate: [authGuard],
        children: [
          { path: '', component: UserReservationListComponent },
          { path: ':id', component: ReservationDetailComponent },
        ],
      },
    ],
  },

  // ─── Lot-2: Public certificate verification ──────────────────────────────
  { path: 'verify-certificate/:code', component: VerifyCertificateComponent },

  // ─── Fallback ─────────────────────────────────────────────────────────
  { path: '**', component: NotFoundComponent },
];
