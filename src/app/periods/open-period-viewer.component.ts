import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PeriodWithEmployeesDto } from '../models/api.models';

@Component({
  selector: 'app-open-period-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatChipsModule],
  templateUrl: './open-period-viewer.component.html',
  styleUrls: ['./open-period-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenPeriodViewerComponent {
  @Input() period?: PeriodWithEmployeesDto | null;

  get isClosed(): boolean {
    return !!this.period?.isClosed;
  }

  get periodLabel(): string {
    if (!this.period) return 'Brak danych okresu';
    return `${this.monthName(this.period.month)} ${this.period.year}`;
  }

  monthName(m: number | undefined): string {
    if (!m) return '';
    const months = [
      'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
      'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
    ];
    return months[m - 1] ?? '';
  }

  statusIcon(): string {
    return this.isClosed ? 'lock' : 'lock_open';
  }

  statusLabel(): string {
    return this.isClosed ? 'Zamknięty' : 'Otwarty';
  }
}
