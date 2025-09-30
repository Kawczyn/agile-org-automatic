import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PeriodsEventsService {
  // Incremented each time nowy okres zostanie wygenerowany
  readonly lastGeneration = signal<number>(0);

  notifyGenerated(): void {
    this.lastGeneration.update(v => v + 1);
  }
}
