import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationSnackComponent, NotificationKind } from './notification.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);

  show(message: string, kind: NotificationKind = 'info', duration = 4000) {
    this.snack.openFromComponent(NotificationSnackComponent, {
      data: { message, kind },
      duration,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: ['app-snack', 'snack-' + kind]
    });
  }
  success(msg: string, duration = 3000) { this.show(msg, 'success', duration); }
  error(msg: string, duration = 6000) { this.show(msg, 'error', duration); }
  warn(msg: string, duration = 5000) { this.show(msg, 'warn', duration); }
  info(msg: string, duration = 4000) { this.show(msg, 'info', duration); }
}