import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Centralized handling of authentication errors: a 401 from our own API means
 * the token is missing/expired/invalid, so we clear the session and send the
 * user back to the login page (keeping the originally requested URL for
 * redirect-back). Third-party requests (e.g. geocoding) are left untouched.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.startsWith(environment.apiUrl)) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { redirect: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
