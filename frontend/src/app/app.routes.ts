import { Routes } from '@angular/router';
import { authGuard }       from './core/guards/auth.guard';
import { guestGuard }      from './core/guards/guest.guard';
import { backofficeGuard, adminOnlyGuard } from './core/guards/backoffice.guard';

// ── Auth ──────────────────────────────────────────────────────────────────────
import { LoginComponent }    from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// ── Public / misc ─────────────────────────────────────────────────────────────
import { NotFoundComponent }          from './features/misc/not-found/not-found.component';
import { UnauthorizedComponent }      from './features/misc/unauthorized/unauthorized.component';
import { VerifyCertificateComponent } from './features/certificates/verify-certificate.component';

// ── Front Office ─────────────────────────────────────────────────────────────
import { FoLayoutComponent }         from './front-office/layout/fo-layout.component';
import { HomeComponent }             from './features/misc/home/home.component';
import { UserEventListComponent }    from './features/events/user/event-list/event-list.component';
import { EventDetailComponent }      from './features/events/user/event-detail/event-detail.component';
import { UserReservationListComponent } from './features/reservations/user/reservation-list/reservation-list.component';
import { ReservationDetailComponent }  from './features/reservations/user/reservation-detail/reservation-detail.component';
import { MyCertificatesComponent }   from './features/certificates/my-certificates.component';

// ── Back Office ───────────────────────────────────────────────────────────────
import { BoLayoutComponent }         from './back-office/layout/bo-layout.component';
import { BoDashboardComponent }      from './back-office/pages/dashboard/bo-dashboard.component';
import { AdminEventListComponent }   from './features/events/admin/event-list/event-list.component';
import { EventFormComponent }        from './features/events/admin/event-form/event-form.component';
import { AdminEventDetailComponent } from './features/events/admin/event-detail/event-detail.component';
import { AdminReservationListComponent } from './features/reservations/admin/reservation-list/reservation-list.component';
import { BoParticipantsComponent }   from './back-office/pages/participants/bo-participants.component';
import { BoCertificatesComponent }   from './back-office/pages/certificates/bo-certificates.component';
import { BoUsersComponent }          from './back-office/pages/users/bo-users.component';

export const routes: Routes = [
  // ── Auth ────────────────────────────────────────────────────────────────
  { path: 'login',    component: LoginComponent,    canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  // ── Public pages ─────────────────────────────────────────────────────────
  { path: 'unauthorized',               component: UnauthorizedComponent },
  { path: 'verify-certificate/:code',   component: VerifyCertificateComponent },

  // ═══════════════════════════════════════════════════════════════════════════
  //  FRONT OFFICE — Public + Authenticated Participants
  // ═══════════════════════════════════════════════════════════════════════════
  {
    path: '',
    component: FoLayoutComponent,
    children: [
      // Public
      { path: '',       pathMatch: 'full', component: HomeComponent },
      { path: 'events', children: [
          { path: '',    component: UserEventListComponent },
          { path: ':id', component: EventDetailComponent },
        ],
      },

      // Authenticated (all roles)
      { path: 'my-reservations', canActivate: [authGuard], children: [
          { path: '',    component: UserReservationListComponent },
          { path: ':id', component: ReservationDetailComponent },
        ],
      },
      { path: 'my-certificates', canActivate: [authGuard], component: MyCertificatesComponent },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BACK OFFICE — Admin + Organizer ONLY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    path: 'backoffice',
    component: BoLayoutComponent,
    canActivate: [backofficeGuard],
    children: [
      { path: '',              component: BoDashboardComponent },
      { path: 'events',        children: [
          { path: '',          component: AdminEventListComponent },
          { path: 'new',       component: EventFormComponent },
          { path: ':id/edit',  component: EventFormComponent },
          { path: ':id',       component: AdminEventDetailComponent },
        ],
      },
      { path: 'reservations',  component: AdminReservationListComponent },
      { path: 'participants',  component: BoParticipantsComponent },
      { path: 'certificates',  component: BoCertificatesComponent },
      { path: 'users',         canActivate: [adminOnlyGuard], component: BoUsersComponent },
    ],
  },

  // ── Legacy redirect: /admin/events → /backoffice/events ──────────────────
  { path: 'admin/events',        redirectTo: '/backoffice/events',       pathMatch: 'prefix' },
  { path: 'admin/reservations',  redirectTo: '/backoffice/reservations',  pathMatch: 'prefix' },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', component: NotFoundComponent },
];
