import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CompanyDto, DepartmentDto, MPKDto, RoleDto, SquadDto, TribeDto } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class MockDictionariesService {
  private roles$ = new BehaviorSubject<RoleDto[]>([
    { id: 1, name: 'Developer' },
    { id: 2, name: 'Tester' },
    { id: 3, name: 'Product Owner' },
  ]);

  private mpks$ = new BehaviorSubject<MPKDto[]>([
    { id: 1, name: 'MPK-001' },
    { id: 2, name: 'MPK-002' },
  ]);

  private departments$ = new BehaviorSubject<DepartmentDto[]>([
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
  ]);

  private companies$ = new BehaviorSubject<CompanyDto[]>([
    { id: 1, name: 'Acme S.A.' },
    { id: 2, name: 'Globex Sp. z o.o.' },
  ]);

  private tribes$ = new BehaviorSubject<TribeDto[]>([
    { id: 1, name: 'Tribe A' },
    { id: 2, name: 'Tribe B' },
  ]);

  private squads$ = new BehaviorSubject<SquadDto[]>([
    { id: 1, name: 'Zespół 1', tribeId: 1 },
    { id: 2, name: 'Zespół 2', tribeId: 2 },
  ]);

  private latency = 150;

  // --- Roles ---
  getRoles(): Observable<RoleDto[]> {
    return this.roles$.pipe(delay(this.latency));
  }
  createRole(dto: RoleDto): Observable<RoleDto> {
    const roles = this.roles$.value;
    const id = this.nextId(roles);
    const created: RoleDto = { id, name: dto.name };
    this.roles$.next([...roles, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateRole(id: number, dto: RoleDto): Observable<void> {
    const roles = this.roles$.value;
    const idx = roles.findIndex(r => r.id === id);
    if (idx === -1) return throwError(() => new Error('Rola nie znaleziona'));
    const updated = [...roles];
    updated[idx] = { ...roles[idx], name: dto.name };
    this.roles$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteRole(id: number): Observable<void> {
    this.roles$.next(this.roles$.value.filter(r => r.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  // --- MPKs ---
  getMpks(): Observable<MPKDto[]> {
    return this.mpks$.pipe(delay(this.latency));
  }
  createMpk(dto: MPKDto): Observable<MPKDto> {
    const list = this.mpks$.value;
    const id = this.nextId(list);
    const created: MPKDto = { id, name: dto.name };
    this.mpks$.next([...list, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateMpk(id: number, dto: MPKDto): Observable<void> {
    const list = this.mpks$.value;
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return throwError(() => new Error('MPK nie znalezione'));
    const updated = [...list];
    updated[idx] = { ...list[idx], name: dto.name };
    this.mpks$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteMpk(id: number): Observable<void> {
    this.mpks$.next(this.mpks$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  // --- Departments ---
  getDepartments(): Observable<DepartmentDto[]> {
    return this.departments$.pipe(delay(this.latency));
  }
  createDepartment(dto: DepartmentDto): Observable<DepartmentDto> {
    const list = this.departments$.value;
    const id = this.nextId(list);
    const created: DepartmentDto = { id, name: dto.name };
    this.departments$.next([...list, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateDepartment(id: number, dto: DepartmentDto): Observable<void> {
    const list = this.departments$.value;
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return throwError(() => new Error('Departament nie znaleziony'));
    const updated = [...list];
    updated[idx] = { ...list[idx], name: dto.name };
    this.departments$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteDepartment(id: number): Observable<void> {
    this.departments$.next(this.departments$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  // --- Companies ---
  getCompanies(): Observable<CompanyDto[]> {
    return this.companies$.pipe(delay(this.latency));
  }
  createCompany(dto: CompanyDto): Observable<CompanyDto> {
    const list = this.companies$.value;
    const id = this.nextId(list);
    const created: CompanyDto = { id, name: dto.name };
    this.companies$.next([...list, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateCompany(id: number, dto: CompanyDto): Observable<void> {
    const list = this.companies$.value;
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return throwError(() => new Error('Firma nie znaleziona'));
    const updated = [...list];
    updated[idx] = { ...list[idx], name: dto.name };
    this.companies$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteCompany(id: number): Observable<void> {
    this.companies$.next(this.companies$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  // --- Tribes ---
  getTribes(): Observable<TribeDto[]> {
    return this.tribes$.pipe(delay(this.latency));
  }
  createTribe(dto: TribeDto): Observable<TribeDto> {
    const list = this.tribes$.value;
    const id = this.nextId(list);
    const created: TribeDto = { id, name: dto.name };
    this.tribes$.next([...list, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateTribe(id: number, dto: TribeDto): Observable<void> {
    const list = this.tribes$.value;
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return throwError(() => new Error('Tribe nie znaleziony'));
    const updated = [...list];
    updated[idx] = { ...list[idx], name: dto.name };
    this.tribes$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteTribe(id: number): Observable<void> {
    this.tribes$.next(this.tribes$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  // --- Squads ---
  getSquads(): Observable<SquadDto[]> {
    return this.squads$.pipe(delay(this.latency));
  }
  createSquad(dto: SquadDto): Observable<SquadDto> {
    const list = this.squads$.value;
    const id = this.nextId(list);
    const created: SquadDto = { id, name: dto.name, tribeId: dto.tribeId };
    this.squads$.next([...list, created]);
    return of(created).pipe(delay(this.latency));
  }
  updateSquad(id: number, dto: SquadDto): Observable<void> {
    const list = this.squads$.value;
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return throwError(() => new Error('Zespół nie znaleziony'));
    const updated = [...list];
    updated[idx] = { ...list[idx], name: dto.name, tribeId: dto.tribeId };
    this.squads$.next(updated);
    return of(void 0).pipe(delay(this.latency));
  }
  deleteSquad(id: number): Observable<void> {
    this.squads$.next(this.squads$.value.filter(x => x.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  private nextId<T extends { id?: number | null }>(list: T[]): number {
    return (list.reduce((max, x: any) => Math.max(max, Number(x.id) || 0), 0) + 1);
  }
}
