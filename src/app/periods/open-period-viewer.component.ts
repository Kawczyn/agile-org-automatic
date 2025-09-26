import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { PeriodWithEmployeesDto } from '../models/api.models';
import { DictionariesService } from '../services/dictionaries.service';
import { forkJoin, take } from 'rxjs';

@Component({
  selector: 'app-open-period-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTableModule, MatButtonModule],
  templateUrl: './open-period-viewer.component.html',
  styleUrls: ['./open-period-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenPeriodViewerComponent implements OnInit {
  @Input() period?: PeriodWithEmployeesDto | null;
  @Output() delete = new EventEmitter<{ employeeId: number; assignmentId?: number | null }>();
  private baseColumns: string[] = [
    'firstName','lastName','tribe','squad','role','department','mpk','fte','contractType','periodId'
  ];
  displayedColumns: string[] = [...this.baseColumns, 'actions'];
  companyIds: number[] = [];
  displayedColumnsPeriod = ['id', 'year', 'month', 'quarter', 'isClosed'];

  private readonly dicts = inject(DictionariesService);
  private rolesById = new Map<number, string>();
  private squadsById = new Map<number, { id: number; name?: string | null; tribeId: number }>();
  private tribesById = new Map<number, string>();
  private departmentsById = new Map<number, string>();
  private mpksById = new Map<number, string>();
  private companiesById = new Map<number, string>();
  private readonly cdr = inject(ChangeDetectorRef);
  dictsReady = false;
  private dictsLogged = false;

  ngOnInit(): void {
    // Uwaga: w trybie mock get* zwracają BehaviorSubject, który nie kończy się sam.
    // forkJoin emituje dopiero po complete, więc musimy pobrać po jednej wartości z każdego strumienia.
    forkJoin({
      roles: this.dicts.getRoles().pipe(take(1)),
      squads: this.dicts.getSquads().pipe(take(1)),
      tribes: this.dicts.getTribes().pipe(take(1)),
      mpks: this.dicts.getMpks().pipe(take(1)),
      departments: this.dicts.getDepartments().pipe(take(1)),
      companies: this.dicts.getCompanies().pipe(take(1))
    }).subscribe({
      next: ({ roles, squads, tribes, mpks, departments, companies }) => {
        roles?.forEach(r => { if (r?.id != null) this.rolesById.set(r.id, r.name ?? String(r.id)); });
        squads?.forEach(s => { if (s?.id != null) this.squadsById.set(s.id, s); });
        tribes?.forEach(t => { if (t?.id != null) this.tribesById.set(t.id, t.name ?? String(t.id)); });
        mpks?.forEach(m => { if (m?.id != null) this.mpksById.set(m.id, m.name ?? String(m.id)); });
        departments?.forEach(d => { if (d?.id != null) this.departmentsById.set(d.id, d.name ?? String(d.id)); });
        companies?.forEach(c => { if (c?.id != null) this.companiesById.set(c.id, c.name ?? `Company ${c.id}`); });
        this.companyIds = (companies ?? []).map(c => c.id!).sort((a,b)=>a-b);
        // Odtwórz listę kolumn: bazowe + dynamiczne kolumny spółek + actions
        this.displayedColumns = [...this.baseColumns, ...this.companyIds.map(id => `company_${id}`), 'actions'];
        // Po zapełnieniu map oznacz słowniki jako gotowe.
        this.dictsReady = true;
        if (!this.dictsLogged) {
          // Jednorazowy log diagnostyczny, aby potwierdzić załadowanie słowników
          console.info('[OpenPeriodViewer] Słowniki załadowane:', {
            roles: this.rolesById.size,
            squads: this.squadsById.size,
            tribes: this.tribesById.size,
            mpks: this.mpksById.size,
            departments: this.departmentsById.size,
            companies: this.companiesById.size,
            service: this.dicts.constructor?.name,
          });
          this.dictsLogged = true;
        }
        // Strategia OnPush + zoneless: po aktualizacji map wymuś odświeżenie widoku,
        // aby podstawienia nazw pojawiły się w tabeli.
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => { /* zostaw mapy puste; użyjemy fallbacków w UI */ }
    });
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
      id: number;
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

  tribeNameForSquad(id?: number | null): string {
    if (id == null) return '';
    const key = Number(id);
    const s = this.squadsById.get(key);
    if (!s) return '';
    return this.tribesById.get(s.tribeId) ?? '';
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

  shareForCompany(a: { companies?: { companyId: number; share: number }[] | null } | null, companyId: number): string {
    if (!a) return '—';
    const found = (a.companies ?? []).find(c => c.companyId === companyId);
    if (!found) return '—';
    const share = Number(found.share);
    if (Number.isNaN(share)) return '—';
    return `${Math.round(share * 100)}%`;
  }

  // Formatowanie FTE: null/undefined -> '—', liczby z dwoma miejscami, przy pełnym 1 dokładnie '1.00'.
  fteText(fte?: number | null): string {
    if (fte == null) return '—';
    const n = Number(fte);
    if (Number.isNaN(n)) return '—';
    return n.toFixed(2).replace(/\.00$/, '.00');
  }

  deleteRow(row: { id: number; assignment: any | null }) {
    this.delete.emit({
      employeeId: row.id,
      assignmentId: row.assignment?.id ?? null
    });
  }
}
