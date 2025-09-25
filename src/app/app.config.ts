import { ApplicationConfig, Provider, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from './services/api-tokens';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { DictionariesService } from './services/dictionaries.service';
import { PeriodsService } from './services/periods.service';
import { MockDictionariesService } from './services/mocks/dictionaries.mock.service';
import { MockPeriodsService } from './services/mocks/periods.mock.service';

function isMockMode(): boolean {
  return environment.mock === true;
}

const mockProviders: Provider[] = [
  { provide: DictionariesService, useClass: MockDictionariesService },
  { provide: PeriodsService, useClass: MockPeriodsService },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    ...(isMockMode() ? mockProviders : [])
  ]
};
