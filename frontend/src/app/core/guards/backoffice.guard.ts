import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects all back-office routes.
 * Only ADMIN and ORGANIZER roles are allowed.
 * Participants are redirected to /unauthorized.
 */
export const backofficeGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  const role = auth.currentUser()?.role;
  if (role === 'ADMIN' || role === 'ORGANIZER') {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};

/**
 * Protects routes accessible only by ADMIN (not ORGANIZER).
 */
export const adminOnlyGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  if (auth.currentUser()?.role === 'ADMIN') return true;
  return router.createUrlTree(['/unauthorized']);
};

/**
 * Ensures only PARTICIPANT (front-office users) can access certain routes.
 * Admins/Organizers are redirected to back-office.
 */
export const participantGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  }

  return true; // All authenticated users can access FO pages
};
