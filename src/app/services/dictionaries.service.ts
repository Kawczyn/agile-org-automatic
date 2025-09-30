import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, throwError, tap } from 'rxjs';
import { API_BASE_URL } from './api-tokens';
import { CompanyDto, DepartmentDto, MPKDto, RoleDto, SquadDto, TribeDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DictionariesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  // Caches (on-demand). Only tribes needed reactivity now.
  private tribes$ = new BehaviorSubject<TribeDto[] | null>(null);

  // --- Roles ---
  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/Dictionaries/roles`).pipe(
      catchError(this.handleError)
    );
  }
  createRole(dto: RoleDto): Observable<RoleDto> {
    const payload: any = { ...dto };
    if ('id' in payload) {
      delete payload.id;
    }
    // opcjonalnie trimming nazwy jeśli istnieje
    if (typeof payload.name === 'string') {
      payload.name = payload.name.trim();
    }
    return this.http.post<RoleDto>(`${this.baseUrl}/Dictionaries/roles`, payload).pipe(
      catchError(this.handleError)
    );
  }
  updateRole(id: number, dto: RoleDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/roles/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/roles/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- MPKs (Chapters/MPK) ---
  getMpks(): Observable<MPKDto[]> {
    return this.http.get<MPKDto[]>(`${this.baseUrl}/Dictionaries/mpks`).pipe(
      catchError(this.handleError)
    );
  }
  createMpk(dto: MPKDto): Observable<MPKDto> {
    return this.http.post<MPKDto>(`${this.baseUrl}/Dictionaries/mpks`, dto).pipe(
      catchError(this.handleError)
    );
  }
  updateMpk(id: number, dto: MPKDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/mpks/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteMpk(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/mpks/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Departments ---
  getDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.baseUrl}/Dictionaries/departments`).pipe(
      catchError(this.handleError)
    );
  }
  createDepartment(dto: DepartmentDto): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(`${this.baseUrl}/Dictionaries/departments`, dto).pipe(
      catchError(this.handleError)
    );
  }
  updateDepartment(id: number, dto: DepartmentDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/departments/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/departments/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Companies ---
  getCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[]>(`${this.baseUrl}/Dictionaries/companies`).pipe(
      catchError(this.handleError)
    );
  }
  createCompany(dto: CompanyDto): Observable<CompanyDto> {
    return this.http.post<CompanyDto>(`${this.baseUrl}/Dictionaries/companies`, dto).pipe(
      catchError(this.handleError)
    );
  }
  updateCompany(id: number, dto: CompanyDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/companies/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/companies/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Tribes ---
  getTribes(): Observable<TribeDto[]> {
    // If we already fetched tribes, return subject as observable.
    if (this.tribes$.value === null) {
      this.http.get<TribeDto[]>(`${this.baseUrl}/Dictionaries/tribes`).pipe(
        catchError(this.handleError)
      ).subscribe({
        next: list => this.tribes$.next(list),
        error: () => this.tribes$.next([])
      });
    }
    return this.tribes$.asObservable() as Observable<TribeDto[]>;
  }
  createTribe(dto: TribeDto): Observable<TribeDto> {
    return this.http.post<TribeDto>(`${this.baseUrl}/Dictionaries/tribes`, dto).pipe(
      tap(created => {
        const current = this.tribes$.value ?? [];
        this.tribes$.next([...current, created]);
      }),
      catchError(this.handleError)
    );
  }
  updateTribe(id: number, dto: TribeDto): Observable<void> {
    return this.http.put<TribeDto>(`${this.baseUrl}/Dictionaries/tribes/${id}`, dto).pipe(
      tap(updated => {
        const arr = (this.tribes$.value ?? []).map(t => t.id === id ? updated : t);
        this.tribes$.next(arr);
      }),
      catchError(this.handleError)
    ).pipe(tap(()=>{})) as unknown as Observable<void>; // cast to keep signature
  }
  deleteTribe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/tribes/${id}`).pipe(
      tap(() => {
        const arr = (this.tribes$.value ?? []).filter(t => t.id !== id);
        this.tribes$.next(arr);
      }),
      catchError(this.handleError)
    );
  }

  // --- Squads ---
  getSquads(): Observable<SquadDto[]> {
    return this.http.get<SquadDto[]>(`${this.baseUrl}/Dictionaries/squads`).pipe(
      catchError(this.handleError)
    );
  }
  createSquad(dto: SquadDto): Observable<SquadDto> {
    return this.http.post<SquadDto>(`${this.baseUrl}/Dictionaries/squads`, dto).pipe(
      catchError(this.handleError)
    );
  }
  updateSquad(id: number, dto: SquadDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/squads/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteSquad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/squads/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(err: any) {
    // Backend może zwracać:
    // 1) { message: '...' }
    // 2) { error: { message: '...' }} (Angular HttpErrorResponse)
    // 3) Plain string jako body
    // 4) Array of errors, np. [ '...', '...' ]
    // 5) Inne pola (detail, title)
    let raw = err?.error;
    let msg: string | null = null;
    if (typeof raw === 'string') {
      msg = raw.trim();
    } else if (raw && typeof raw === 'object') {
      msg = raw.message || raw.detail || raw.title || null;
      if (!msg && Array.isArray(raw) && raw.length > 0) {
        msg = raw.join('\n');
      }
    }
    if (!msg) {
      msg = err?.message || 'Wystąpił błąd API';
    }
    return throwError(() => new Error(msg || 'Wystąpił błąd API'));
  }
}
