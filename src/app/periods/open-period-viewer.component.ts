import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PeriodWithEmployeesDto } from '../models/api.models';
import { DictionariesService } from '../services/dictionaries.service';
import { Subject, takeUntil } from 'rxjs';
import { PeriodsService } from '../services/periods.service';
import { NotificationService } from '../shared/notification/notification.service';

@Component({
  selector: 'app-open-period-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTableModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './open-period-viewer.component.html',
  styleUrls: ['./open-period-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenPeriodViewerComponent implements OnInit {
  @Input() period?: PeriodWithEmployeesDto | null;
  @Output() delete = new EventEmitter<{ employeeId: string; assignmentId?: string | null }>();
  @Output() edit = new EventEmitter<{ employeeId: string; assignmentId: string; changes: any }>();
  private baseColumns: string[] = [
    'firstName','lastName','tribe','squad','role','department','mpk','fte','contractType','periodId'
  ];
  displayedColumns: string[] = [...this.baseColumns, 'actions'];
  companyIds: number[] = [];
  displayedColumnsPeriod = ['id', 'year', 'month', 'quarter', 'isClosed'];

  private readonly dicts = inject(DictionariesService);
  private readonly dialog = inject(MatDialog);
  private readonly periods = inject(PeriodsService);
  private readonly notify = inject(NotificationService);
  private rolesById = new Map<number, string>();
  private squadsById = new Map<number, { id: number; name?: string | null; tribeId: number }>();
  private tribesById = new Map<number, string>();
  private departmentsById = new Map<number, string>();
  private mpksById = new Map<number, string>();
  private companiesById = new Map<number, string>();
  private readonly cdr = inject(ChangeDetectorRef);
  dictsReady = false;
  private dictsLogged = false;
  // inline editing removed – using dialog
  tribesList: { id: number; name?: string | null }[] = [];
  squadsList: { id: number; name?: string | null; tribeId: number }[] = [];
  rolesList: { id: number; name?: string | null }[] = [];
  departmentsList: { id: number; name?: string | null }[] = [];
  mpksList: { id: number; name?: string | null }[] = [];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Roles
    this.dicts.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: roles => {
        this.rolesById.clear();
        roles?.forEach(r => { if (r?.id != null) this.rolesById.set(r.id, r.name ?? String(r.id)); });
        this.rolesList = roles ?? [];
        this.refreshView();
      }
    });
    // Squads (reactive so tribe name fallback updates)
    this.dicts.getSquads().pipe(takeUntil(this.destroy$)).subscribe({
      next: squads => {
        this.squadsById.clear();
        squads?.forEach(s => { if (s?.id != null) this.squadsById.set(s.id, s); });
        this.squadsList = squads ?? [];
        this.normalizeMissingTribeIds();
        this.refreshView();
      }
    });
    // Tribes (cached reactive)
    this.dicts.getTribes().pipe(takeUntil(this.destroy$)).subscribe({
      next: tribes => {
        this.tribesById.clear();
        tribes?.forEach(t => { if (t?.id != null) this.tribesById.set(t.id, t.name ?? String(t.id)); });
        this.tribesList = tribes ?? [];
        this.normalizeMissingTribeIds();
        this.refreshView();
      }
    });
    // MPKs
    this.dicts.getMpks().pipe(takeUntil(this.destroy$)).subscribe({
      next: mpks => {
        this.mpksById.clear();
        mpks?.forEach(m => { if (m?.id != null) this.mpksById.set(m.id, m.name ?? String(m.id)); });
        this.mpksList = mpks ?? [];
        this.refreshView();
      }
    });
    // Departments
    this.dicts.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: departments => {
        this.departmentsById.clear();
        departments?.forEach(d => { if (d?.id != null) this.departmentsById.set(d.id, d.name ?? String(d.id)); });
        this.departmentsList = departments ?? [];
        this.refreshView();
      }
    });
    // Companies (one-off – could be reactive later)
    this.dicts.getCompanies().pipe(takeUntil(this.destroy$)).subscribe({
      next: companies => {
        this.companiesById.clear();
        companies?.forEach(c => { if (c?.id != null) this.companiesById.set(c.id, c.name ?? `Company ${c.id}`); });
        this.companyIds = (companies ?? []).map(c => c.id!).sort((a,b)=>a-b);
        this.rebuildColumns();
        this.refreshView();
      }
    });
  }

  private rebuildColumns() {
    this.displayedColumns = [...this.baseColumns, ...this.companyIds.map(id => `company_${id}`), 'actions'];
  }

  private refreshView() {
    if (!this.dictsReady) {
      // Consider dictionaries ready after first wave of loads for essential sets (roles + squads + tribes)
      if (this.rolesList.length || this.squadsList.length || this.tribesList.length) {
        this.dictsReady = true;
      }
    }
    this.cdr.markForCheck();
    try { this.cdr.detectChanges(); } catch {}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  employees() {
    return this.period?.employees ?? [];
  }

  // Wiersz per assignment (pivot kolumn spółek w poziomie)
  flattenedRows() {
    const rows: Array<{
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      assignment: any | null;
    }> = [];
    for (const e of this.employees()) {
      const assigns = e.assignments ?? [];
      if (assigns.length === 0) {
        rows.push({ id: e.id, firstName: e.firstName, lastName: e.lastName, assignment: null });
        continue;
      }
      for (const a of assigns) {
        rows.push({ id: e.id, firstName: e.firstName, lastName: e.lastName, assignment: a });
      }
    }
    return rows;
  }

  periodRows() {
    const p = this.period;
    if (!p) return [] as Array<{id:number; year:number; month:number; quarter:number; isClosed:boolean}>;
    return [p];
  }

  assignment0(e: { assignments?: any[] | null }) {
    return (e.assignments ?? [])[0] ?? null;
  }

  // (companyText removed – replaced by separate company/companyShare columns)

  roleName(id?: number | null): string {
    if (id == null) return '—';
    const key = Number(id);
    return this.rolesById.get(key) ?? String(id);
  }

  squadName(id?: number | null): string {
    if (id == null) return '—';
    const key = Number(id);
    const s = this.squadsById.get(key);
    return (s?.name ?? undefined) ? String(s?.name) : String(id);
  }

  inferredSquadName(assignment: any | null): string {
    if (!assignment) return '—';
    if (assignment.squadId != null) return this.squadName(assignment.squadId);
    // If squadId missing but tribeId present and exactly one squad has that tribe -> infer name
    if (assignment.tribeId != null) {
      const tribeIdNum = Number(assignment.tribeId);
      const matches: Array<{ id:number; name?: string | null; tribeId:number }> = [];
      this.squadsById.forEach(s => { if (s.tribeId === tribeIdNum) matches.push(s); });
      if (matches.length === 1) {
        return matches[0].name ?? String(matches[0].id);
      }
    }
    return '—';
  }

  tribeNameForSquad(id?: number | null): string {
    if (id == null) return '';
    const key = Number(id);
    const s = this.squadsById.get(key);
    if (!s) return '';
    return this.tribesById.get(s.tribeId) ?? '';
  }

  tribeNameDirect(tribeId?: number | null, squadId?: number | null): string {
    if (tribeId != null) {
      return this.tribesById.get(Number(tribeId)) ?? String(tribeId);
    }
    if (squadId != null) {
      const s = this.squadsById.get(Number(squadId));
      if (s) return this.tribesById.get(s.tribeId) ?? String(s.tribeId);
    }
    return '';
  }

  mpkName(id?: number | null): string {
    if (id == null) return '—';
    const key = Number(id);
    return this.mpksById.get(key) ?? String(id);
  }

  departmentName(id?: number | null): string {
    if (id == null) return '—';
    const key = Number(id);
    return this.departmentsById.get(key) ?? String(id);
  }

  companyName(id?: number | null): string {
    if (id == null) return '';
    const key = Number(id);
    return this.companiesById.get(key) ?? `Company ${id}`;
  }

  private normalizeMissingTribeIds(): void {
    if (!this.period?.employees) return;
    let mutated = false;
    for (const emp of this.period.employees) {
      if (!emp.assignments) continue;
      for (const a of emp.assignments) {
        if ((a as any).tribeId == null && a.squadId != null) {
          const s = this.squadsById.get(Number(a.squadId));
          if (s) {
            (a as any).tribeId = s.tribeId; // mutacja lokalna – normalizacja danych tylko w UI
            mutated = true;
          }
        }
      }
    }
    if (mutated) {
      // odśwież widok po uzupełnieniu
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  shareForCompany(a: { companies?: { companyId: number; share: number }[] | null } | null, companyId: number): string {
    if (!a) return '—';
    const found = (a.companies ?? []).find(c => c.companyId === companyId);
    if (!found) return '—';
    const share = Number(found.share);
    if (Number.isNaN(share)) return '—';
    // Wartość share jest już w procentach (np. 50 oznacza 50%), więc nie mnożymy przez 100.
    return `${Math.round(share)}%`;
  }

  // Formatowanie FTE: null/undefined -> '—', liczby z dwoma miejscami, przy pełnym 1 dokładnie '1.00'.
  fteText(fte?: number | null): string {
    if (fte == null) return '—';
    const n = Number(fte);
    if (Number.isNaN(n)) return '—';
    return n.toFixed(2).replace(/\.00$/, '.00');
  }

  deleteRow(row: { id: string; assignment: any | null }) {
    this.delete.emit({
      employeeId: row.id,
      assignmentId: row.assignment?.id ?? null
    });
  }

  editRow(row: { id: string; assignment: any | null }) {
    if (!row.assignment?.id) return;
    import('./assignment-edit-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.AssignmentEditDialogComponent, {
        width: '780px',
        data: {
          assignment: row.assignment,
          companies: this.companyIds.map(id => ({ id, name: this.companyName(id) })),
          dictionaries: {
            tribes: this.tribesList,
            squads: this.squadsList,
            roles: this.rolesList,
            departments: this.departmentsList,
            mpks: this.mpksList
          }
        }
      });
      dialogRef.afterClosed().subscribe(changes => {
        if (!changes) return; // cancel
        const sanitized = this.sanitizeAssignmentChanges(changes);
        this.edit.emit({ employeeId: row.id, assignmentId: row.assignment.id, changes: sanitized });
      });
    });
  }

  openCreateEmployeeDialog() {
  if (!this.period?.id) return;
  const periodId = this.period.id;
    // Domyślny pusty assignment
    const emptyAssignment: any = {
      id: undefined,
      employeeId: undefined,
  periodId: periodId,
      tribeId: null,
      squadId: null,
      roleId: null,
      departmentId: null,
      mpkId: null,
      fte: 1,
      contractType: null,
      companies: this.companyIds.map(id => ({ companyId: id, share: 0 }))
    };
    import('./assignment-edit-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.AssignmentEditDialogComponent, {
        width: '820px',
        data: {
          assignment: emptyAssignment,
          companies: this.companyIds.map(id => ({ id, name: this.companyName(id) })),
            dictionaries: {
              tribes: this.tribesList,
              squads: this.squadsList,
              roles: this.rolesList,
              departments: this.departmentsList,
              mpks: this.mpksList
            },
            createEmployee: true
        }
      });
      dialogRef.afterClosed().subscribe(changes => {
        if (!changes) return;
        const sanitized = this.sanitizeAssignmentChanges(changes);
        if (sanitized.roleId == null) {
          this.notify.error('Brak roli – uzupełnij przed zapisem');
          return;
        }
        if ((sanitized.companies ?? []).length === 0) {
          this.notify.error('Brak udziałów spółek');
          return;
        }
        const firstName = (changes.firstName || '').trim();
        const lastName = (changes.lastName || '').trim();
        if (!firstName || !lastName) {
          this.notify.error('Imię i nazwisko są wymagane');
          return;
        }
        // KROK 1: tworzymy pracownika (tylko dane osobowe)
        const createPayload: any = { firstName, lastName };
        this.periods.createEmployee(periodId, createPayload).subscribe({
          next: baseEmployee => {
            if (!baseEmployee?.id) {
              this.notify.error('Brak ID nowego pracownika');
              return;
            }
            // Przygotuj assignment już z nowym employeeId
            const assignment: any = {
              id: undefined,
              employeeId: baseEmployee.id,
              periodId: periodId,
              ...sanitized
            };
            if (assignment.squadId == null) delete assignment.squadId;
            // KROK 2: updateEmployee z tablicą assignments
            this.periods.updateEmployee(periodId, baseEmployee.id, { assignments: [assignment] }).subscribe({
              next: () => {
                const fullEmployee = { ...baseEmployee, firstName, lastName, assignments: [assignment] };
                (this.period!.employees ||= []).push(fullEmployee as any);
                this.normalizeMissingTribeIds();
                this.refreshView();
              },
              error: err => {
                if (err?.message?.includes('404')) {
                  // Endpoint update assignments jeszcze nie istnieje – dodaj użytkownika bez assignmentu
                  (this.period!.employees ||= []).push({ ...baseEmployee, firstName, lastName, assignments: [] } as any);
                  this.refreshView();
                } else {
                  this.notify.error(err?.message || 'Błąd przypisania przy tworzeniu');
                  (this.period!.employees ||= []).push({ ...baseEmployee, firstName, lastName, assignments: [] } as any);
                  this.refreshView();
                }
              }
            });
          },
          error: err => {
            this.notify.error(err?.message || 'Błąd tworzenia pracownika');
          }
        });
      });
    });
  }

  addAssignment(employeeId: string) {
    if (!this.period?.id) return;
    const periodId = this.period.id;
    const emp = this.period.employees?.find(e => e.id === employeeId);
    if (!emp) return;
    const emptyAssignment: any = {
      id: undefined,
      employeeId: emp.id,
      periodId: periodId,
      tribeId: null,
      squadId: null,
      roleId: null,
      departmentId: null,
      mpkId: null,
      fte: 1,
      contractType: null,
      companies: this.companyIds.map(id => ({ companyId: id, share: 0 }))
    };
    import('./assignment-edit-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.AssignmentEditDialogComponent, {
        width: '780px',
        data: {
          assignment: emptyAssignment,
          companies: this.companyIds.map(id => ({ id, name: this.companyName(id) })),
          dictionaries: {
            tribes: this.tribesList,
            squads: this.squadsList,
            roles: this.rolesList,
            departments: this.departmentsList,
            mpks: this.mpksList
          }
        }
      });
      dialogRef.afterClosed().subscribe(changes => {
        if (!changes) return;
        const sanitized = this.sanitizeAssignmentChanges(changes);
        if (sanitized.roleId == null) {
          this.notify.error('Brak roli – uzupełnij przed zapisem');
          return;
        }
        if ((sanitized.companies ?? []).length === 0) {
          this.notify.error('Brak udziałów spółek');
          return;
        }
        const newAssignment: any = {
          id: undefined,
          employeeId: emp.id,
          periodId: periodId,
          ...sanitized
        };
        if (newAssignment.squadId == null) delete newAssignment.squadId;
        const current = emp.assignments ? [...emp.assignments] : [];
        const updatedAssignments = [...current, newAssignment];
        this.periods.updateEmployee(periodId, emp.id, { assignments: updatedAssignments }).subscribe({
          next: () => {
            emp.assignments = updatedAssignments;
            this.normalizeMissingTribeIds();
            this.refreshView();
          },
          error: err => {
            if (err?.message?.includes('404')) {
              // Brak endpointu update – lokalnie dodaj (tymczasowo / informacyjnie)
              emp.assignments = updatedAssignments;
              this.refreshView();
              this.notify.error('Endpoint aktualizacji assignmentów nieobsługiwany (404) – zmiana tylko lokalnie');
            } else {
              this.notify.error(err?.message || 'Błąd dodawania assignmentu');
            }
          }
        });
      });
    });
  }

  private sanitizeAssignmentChanges(changes: any) {
    const tribeId = changes.tribeId != null ? Number(changes.tribeId) : null;
    let squadId = changes.squadId != null ? Number(changes.squadId) : null;
    if (squadId == null && tribeId != null) {
      // Infer if exactly one squad for tribe
      const matches = this.squadsList.filter(s => s.tribeId === tribeId);
      if (matches.length === 1) squadId = matches[0].id;
    }
    const roleId = changes.roleId != null ? Number(changes.roleId) : null;
    const departmentId = changes.departmentId != null ? Number(changes.departmentId) : null;
    const mpkId = changes.mpkId != null ? Number(changes.mpkId) : null;
    let fte = Number(changes.fte);
    if (!Number.isFinite(fte) || fte <= 0) fte = 1;
    const contractType = changes.contractType || null;
    const companies = (changes.companies ?? []).map((c: any) => ({
      companyId: Number(c.companyId),
      share: Number.isFinite(Number(c.share)) ? Number(c.share) : 0
    })).filter((c: { companyId: number; share: number }) => !!c.companyId);
    return {
      tribeId,
      squadId,
      roleId,
      departmentId: departmentId ?? null,
      mpkId: mpkId ?? null,
      fte,
      contractType,
      companies
    };
  }

  trackRow = (_: number, row: { id: string; assignment: any | null }) => row.assignment?.id ?? 'emp-'+row.id;
}
