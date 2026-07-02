<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
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
<<<<<<< HEAD
=======
=======
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
<<<<<<< HEAD
    { provide: LOCALE_ID,       useValue: 'fr-FR' },
=======
<<<<<<< HEAD
    { provide: LOCALE_ID,       useValue: 'fr-FR' },
=======
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
  ],
};
