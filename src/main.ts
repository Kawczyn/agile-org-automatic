import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch(() => {
    // Błąd bootstrap (wyciszony zgodnie z usunięciem logów). Można dodać tu globalną obsługę jeśli potrzebna.
  });
