import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodsService } from '../services/periods.service';
import { PeriodDto } from '../models/api.models';
import { NotificationService } from '../shared/notification/notification.service';
import { PeriodsEventsService } from '../services/periods-events.service';

interface PeriodRow extends PeriodDto {
  label: string;
}

@Component({
  selector: 'app-periods-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
  <div class="periods-list" *ngIf="!loading(); else loadingTpl">
    <h2>Okresy</h2>
    <table mat-table [dataSource]="rows()" class="mat-elevation-z1 dense-table">
      <!-- Year -->
      <ng-container matColumnDef="year">
        <th mat-header-cell *matHeaderCellDef> Rok </th>
        <td mat-cell *matCellDef="let r"> {{ r.year }} </td>
      </ng-container>
      <!-- Month -->
      <ng-container matColumnDef="month">
        <th mat-header-cell *matHeaderCellDef> Miesiąc </th>
        <td mat-cell *matCellDef="let r"> {{ r.month }} </td>
      </ng-container>
      <!-- Month Name -->
      <ng-container matColumnDef="monthName">
        <th mat-header-cell *matHeaderCellDef> Miesiąc (nazwa) </th>
        <td mat-cell *matCellDef="let r"> {{ monthName(r.month) }} </td>
      </ng-container>
      <!-- Quarter -->
      <ng-container matColumnDef="quarter">
        <th mat-header-cell *matHeaderCellDef> Kwartał </th>
        <td mat-cell *matCellDef="let r"> Q{{ r.quarter }} </td>
      </ng-container>
      <!-- Closed -->
      <ng-container matColumnDef="isClosed">
        <th mat-header-cell *matHeaderCellDef> Status </th>
        <td mat-cell *matCellDef="let r">
          <span [class.closed]="r.isClosed" [class.open]="!r.isClosed">{{ r.isClosed ? 'Zamknięty' : 'Otwarty' }}</span>
        </td>
      </ng-container>
      <!-- Actions -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef> Akcje </th>
        <td mat-cell *matCellDef="let r">
          <button mat-icon-button color="primary" (click)="export(r)" [disabled]="!r.isClosed || exportingId() === r.id" matTooltip="Pobierz plik" aria-label="Pobierz" >
            <mat-icon *ngIf="exportingId() !== r.id">download</mat-icon>
            <mat-progress-spinner *ngIf="exportingId() === r.id" diameter="20" mode="indeterminate"></mat-progress-spinner>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <div *ngIf="rows().length === 0" class="empty">Brak okresów</div>
  </div>
  <ng-template #loadingTpl>
    <div class="loading-wrapper"><mat-progress-spinner mode="indeterminate"></mat-progress-spinner></div>
  </ng-template>
  `,
  styles: [`
    .periods-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
    h2 { margin: 0 0 4px; font-size: 18px; font-weight: 500; }
    table { width: 100%; }
    .empty { padding: 24px; text-align: center; color: #666; }
    .loading-wrapper { padding: 48px; display:flex; justify-content:center; }
    .closed { color: #2e7d32; font-weight: 500; }
    .open { color: #d32f2f; font-weight: 500; }
    .mat-mdc-progress-spinner { --mdc-circular-progress-active-indicator-color: var(--mdc-theme-primary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodsListComponent {
  private readonly periods = inject(PeriodsService);
  private readonly events = inject(PeriodsEventsService);
  private readonly notify = inject(NotificationService);

  displayedColumns = ['year', 'month', 'monthName', 'quarter', 'isClosed', 'actions'];
  rows = signal<PeriodDto[]>([]);
  loading = signal<boolean>(true);
  exportingId = signal<string | null>(null);

  constructor() {
    this.load();
    effect(() => {
      // Reaguj na zmianę licznika generacji
      this.events.lastGeneration();
      // Po każdej zmianie przeładuj listę
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.periods.getPeriods().subscribe({
      next: data => {
        const sorted = (data ?? []).slice().sort((a,b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });
        this.rows.set(sorted);
        this.loading.set(false);
      },
      error: err => { this.notify.error(String(err?.message || err)); this.loading.set(false); }
    });
  }

  export(p: PeriodDto) {
    if (!p.isClosed) return;
    this.exportingId.set(p.id);
    this.periods.exportPeriod(p.id).subscribe({
      next: resp => {
        try {
          const blob = resp.body as Blob;
          const cd = resp.headers.get('Content-Disposition') || resp.headers.get('content-disposition');
          let fileName = '';
          if (cd) {
            const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
            if (match) {
              fileName = decodeURIComponent(match[1] || match[2] || '').trim();
            }
          }
          if (!fileName) {
            fileName = `okres-${p.year}-${String(p.month).padStart(2,'0')}.xlsx`;
          } else if (!/\.xlsx$/i.test(fileName)) {
            fileName = fileName + '.xlsx';
          }
          const xlsxBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(xlsxBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          this.notify.success('Pobrano plik Excel');
        } catch (e) {
          this.notify.error('Nie udało się pobrać pliku');
        }
        this.exportingId.set(null);
      },
      error: err => { this.notify.error(String(err?.message || err)); this.exportingId.set(null); }
    });
  }

  monthName(m: number): string {
    const months = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
    return months[m-1] ?? '';
  }
}
