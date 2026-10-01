import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeIt from '@angular/common/locales/it';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideHttpClient(),
    provideRouter(routes)
  ]
};
