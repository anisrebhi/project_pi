import {
  ApplicationConfig, LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter }       from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE }     from '@angular/material/core';
import { registerLocaleData }  from '@angular/common';
import localeFr                from '@angular/common/locales/fr';

import { routes }              from './app.routes';
import { authInterceptor }     from './core/interceptors/auth.interceptor';
import { errorInterceptor }    from './core/interceptors/error.interceptor';

// Register French locale so date/number pipes work with 'fr-FR'
registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    { provide: LOCALE_ID,       useValue: 'fr-FR' },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
  ],
};
