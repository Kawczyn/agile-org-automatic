import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

export type NotificationKind = 'success' | 'error' | 'warn' | 'info';

export interface NotificationData {
  message: string;
  kind?: NotificationKind;
  action?: string;
}

@Component({
  selector: 'app-notification-snack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification" [class.success]="data.kind==='success'" [class.error]="data.kind==='error'" [class.warn]="data.kind==='warn'" [class.info]="!data.kind || data.kind==='info'">
      <span class="icon" *ngIf="data.kind as k">{{ iconFor(k) }}</span>
      <span class="text">{{ data.message }}</span>
    </div>
  `,
  styles: [`
    .notification { display: flex; align-items: center; gap: 8px; font-size: 14px; line-height:1.3; }
    .icon { font-weight: 600; }
    /* Kolory nadpisywane globalnie w styles.scss przez .app-snack */
  `]
})
export class NotificationSnackComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: NotificationData) {}

  iconFor(kind: NotificationKind): string {
    switch(kind) {
      case 'success': return '✓';
      case 'error': return '⛔';
      case 'warn': return '⚠';
      case 'info': default: return 'ℹ';
    }
  }
}
