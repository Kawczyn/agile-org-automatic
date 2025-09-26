import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { PeriodsService } from '../services/periods.service';
import { PeriodWithEmployeesDto } from '../models/api.models';
import { OpenPeriodViewerComponent } from './open-period-viewer.component';
import { finalize, timeout } from 'rxjs/operators';
import { take } from 'rxjs';

@Component({
  selector: 'app-open-period-page',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatButtonModule, OpenPeriodViewerComponent],
  templateUrl: './open-period-page.component.html',
  styleUrls: ['./open-period-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenPeriodPageComponent implements OnInit {
  private readonly periods = inject(PeriodsService);

  period = signal<PeriodWithEmployeesDto | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  reload(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.periods
      .getOpenPeriod()
      .pipe(
        take(1),
        timeout(5000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (p) => this.period.set(p),
        error: (e) => this.error.set(String(e?.message ?? e)),
      });
  }

  closeAndGenerate(): void {
    this.loading.set(true);
    this.error.set(null);
    this.periods
      .closeAndGeneratePeriod()
      .pipe(
        take(1),
        timeout(5000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (p) => this.period.set(p),
        error: (e) => this.error.set(String(e?.message ?? e)),
      });
  }
}
