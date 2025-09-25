import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { mockBackendInterceptor } from './services/mock-backend.interceptor';
import { ENABLE_MOCKS } from './services/mock-config';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Set to true to have mocks enabled by default; you can override at runtime via MockConfigService
    { provide: ENABLE_MOCKS, useValue: true },
    provideHttpClient(withInterceptors([mockBackendInterceptor]))
  ]
};
