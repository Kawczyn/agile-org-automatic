import { Injectable, InjectionToken, inject, signal } from '@angular/core';

// Global flag token: can be overridden in app.config.ts
export const ENABLE_MOCKS = new InjectionToken<boolean>('ENABLE_MOCKS', {
  providedIn: 'root',
  factory: () => false, // default: mocks OFF unless overridden
});

const LS_KEY = 'ENABLE_MOCKS';

@Injectable({ providedIn: 'root' })
export class MockConfigService {
  private readonly defaultEnabled = inject(ENABLE_MOCKS);

  readonly enabled = signal<boolean>(this.getInitial());

  setEnabled(on: boolean): void {
    localStorage.setItem(LS_KEY, on ? 'true' : 'false');
    this.enabled.set(on);
  }

  private getInitial(): boolean {
    const ls = localStorage.getItem(LS_KEY);
    if (ls === 'true') return true;
    if (ls === 'false') return false;
    return this.defaultEnabled;
  }
}
