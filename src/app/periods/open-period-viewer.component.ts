import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
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
  displayedColumns = [
    'id','firstName','lastName','contractType','fte','role','squad','mpk','department','periodId','company'
  ];
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

  // Zwraca wiersze zduplikowane per assignment i per company
  flattenedRows() {
    const rows: Array<{
      id: number;
      firstName?: string | null;
      lastName?: string | null;
      assignment: any | null;
      companyId?: number | null;
    }> = [];

    for (const e of this.employees()) {
      const assigns = e.assignments ?? [];
      if (assigns.length === 0) {
        rows.push({ id: e.id, firstName: e.firstName, lastName: e.lastName, assignment: null, companyId: null });
        continue;
      }
      for (const a of assigns) {
        const comps = a.companies ?? [];
        if (comps.length === 0) {
          rows.push({ id: e.id, firstName: e.firstName, lastName: e.lastName, assignment: a, companyId: null });
          continue;
        }
        for (const c of comps) {
          rows.push({ id: e.id, firstName: e.firstName, lastName: e.lastName, assignment: a, companyId: c.companyId });
        }
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

  companyText(a: { companies?: { companyId: number; share: number }[] | null } | null, companyId?: number | null) {
    if (!a) return '—';
    if (!companyId) return '—';
    const found = (a.companies ?? []).find(c => c.companyId === companyId);
    if (!found) return '—';
    return `${this.companyName(found.companyId)} (${Math.round((found.share ?? 0) * 100)}%)`;
  }

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
    if (id == null) return 'Company —';
    const key = Number(id);
    return this.companiesById.get(key) ?? `Company ${id}`;
  }

  fteText(v?: number | null): string {
    if (v == null) return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
