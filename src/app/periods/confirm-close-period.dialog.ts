import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-close-period-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Zamknąć bieżący okres?</h2>
    <div mat-dialog-content>
      <p>Operacja zamknie aktualny okres i wygeneruje nowy. Czy chcesz kontynuować?</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Anuluj</button>
      <button mat-raised-button color="primary" (click)="confirm()">Potwierdź</button>
    </div>
  `,
})
export class ConfirmClosePeriodDialogComponent {
  constructor(
    private readonly ref: MatDialogRef<ConfirmClosePeriodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cancel() { this.ref.close(false); }
  confirm() { this.ref.close(true); }
}
