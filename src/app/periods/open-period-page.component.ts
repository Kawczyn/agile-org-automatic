import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PeriodsService } from '../services/periods.service';
import { PeriodsEventsService } from '../services/periods-events.service';
import { ConfirmClosePeriodDialogComponent } from './confirm-close-period.dialog';
import { PeriodWithEmployeesDto } from '../models/api.models';
import { OpenPeriodViewerComponent } from './open-period-viewer.component';
import { finalize, timeout } from 'rxjs/operators';
import { take } from 'rxjs';
import { NotificationService } from '../shared/notification/notification.service';

@Component({
  selector: 'app-open-period-page',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, OpenPeriodViewerComponent, ReactiveFormsModule],
  templateUrl: './open-period-page.component.html',
  styleUrls: ['./open-period-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenPeriodPageComponent implements OnInit {
  private readonly periods = inject(PeriodsService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly events = inject(PeriodsEventsService);

  period = signal<PeriodWithEmployeesDto | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  adding = signal<boolean>(false);
  generating = signal<boolean>(false);
  addForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]]
  });

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
    if (this.generating()) return;
    const dialogRef = this.dialog.open(ConfirmClosePeriodDialogComponent, { width: '420px' });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return; // user canceled
      this.generating.set(true);
      this.error.set(null);
      this.periods
        .closeAndGeneratePeriod()
        .pipe(
          take(1),
          timeout(10000),
          finalize(() => this.generating.set(false))
        )
        .subscribe({
          next: (p) => {
            this.period.set(p);
            this.events.notifyGenerated();
            this.notify.success('Zamknięto i wygenerowano nowy okres');
          },
          error: (e) => {
            const msg = String(e?.message ?? e);
              this.error.set(msg);
              this.notify.error(msg || 'Błąd zamykania okresu');
          },
        });
    });
  }

  onDelete(evt: { employeeId: string; assignmentId?: string | null }) {
    const current = this.period();
    if (!current) return;
    // brak assignmentId => usuń całego pracownika lokalnie
    if (!evt.assignmentId) {
      const updated = {
        ...current,
        employees: (current.employees ?? []).filter(e => e.id !== evt.employeeId)
      } as typeof current;
      this.period.set(updated);
      this.notify.success('Usunięto pracownika');
      return;
    }
  const periodId = current.id;
  const assignmentId = evt.assignmentId;
    this.periods.deleteAssignment(periodId, assignmentId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const updated = {
            ...current,
            employees: (current.employees ?? []).map(e => {
              if (e.id !== evt.employeeId) return e;
              const remaining = (e.assignments ?? []).filter(a => a.id !== evt.assignmentId);
              if (remaining.length === 0) return null as any; // usuwamy pustego pracownika
              return { ...e, assignments: remaining };
            }).filter(e => e != null) as any[]
          } as typeof current;
          this.period.set(updated);
          this.notify.success('Usunięto przypisanie');
        },
        error: err => this.notify.error(String(err?.message ?? err ?? 'Błąd usuwania'))
      });
  }

  onEdit(evt: { employeeId: string; assignmentId: string; changes: any }) {
    const current = this.period();
    if (!current) return;
  const emp = (current.employees ?? []).find(e => e.id === evt.employeeId);
  if (!emp) return;
  const assignment = emp.assignments?.find(a => a.id === evt.assignmentId);
  if (!assignment) return;
  const periodId = current.id;
  const assignmentId = evt.assignmentId;
    // Merge original assignment with changes for full update (some backends require full DTO)
    const fullPayload = {
      id: assignmentId,
  employeeId: emp.id,
      periodId: periodId,
      tribeId: evt.changes.tribeId ?? assignment.tribeId ?? null,
      squadId: evt.changes.squadId ?? assignment.squadId,
      roleId: evt.changes.roleId ?? assignment.roleId,
      departmentId: (evt.changes.departmentId !== undefined ? evt.changes.departmentId : assignment.departmentId) ?? null,
      mpkId: (evt.changes.mpkId !== undefined ? evt.changes.mpkId : assignment.mpkId) ?? null,
      fte: evt.changes.fte ?? assignment.fte,
      contractType: (evt.changes.contractType !== undefined ? evt.changes.contractType : assignment.contractType) ?? null,
      companies: (evt.changes.companies && evt.changes.companies.length ? evt.changes.companies : assignment.companies) ?? []
    };
    // console.log('UPDATE assignment payload', fullPayload);
    this.periods.updateAssignment(periodId, assignmentId, fullPayload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const updated = {
            ...current,
            employees: (current.employees ?? []).map(e => {
              if (e.id !== evt.employeeId) return e;
              return {
                ...e,
                assignments: (e.assignments ?? []).map(a => a.id === evt.assignmentId ? { ...a, ...fullPayload } : a)
              };
            })
          } as typeof current;
          this.period.set(updated);
          this.notify.success('Zapisano zmiany');
        },
        error: err => this.notify.error(String(err?.message ?? err ?? 'Błąd zapisu'))
      });
  }

  addEmployee(): void {
    if (!this.period()) return;
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const periodId = this.period()!.id;
    const payload = {
      firstName: this.addForm.value.firstName?.trim() || '',
      lastName: this.addForm.value.lastName?.trim() || ''
    };
    this.adding.set(true);
    this.periods.createEmployee(periodId, payload)
      .pipe(take(1), finalize(() => this.adding.set(false)))
      .subscribe({
        next: emp => {
          const current = this.period();
          if (!current) return;
            const updated: PeriodWithEmployeesDto = {
              ...current,
              employees: [...(current.employees ?? []), { ...emp, assignments: emp.assignments ?? [] }]
            };
            this.period.set(updated);
            this.notify.success('Dodano pracownika');
            this.addForm.reset();
        },
        error: err => this.notify.error(String(err?.message ?? err ?? 'Błąd dodawania'))
      });
  }
}
