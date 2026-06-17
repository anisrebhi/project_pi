import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Centralized handling of authentication errors: a 401 means the token is
 * missing/expired/invalid, so we clear the session and send the user back
 * to the login page (keeping the originally requested URL for redirect-back).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { redirect: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
