import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-tokens';
import { CompanyDto, DepartmentDto, MPKDto, RoleDto, SquadDto, TribeDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DictionariesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // --- Roles ---
  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/Dictionaries/roles`).pipe(
      catchError(this.handleError)
    );
  }
  createRole(dto: RoleDto): Observable<RoleDto> {
    return this.http.post<RoleDto>(`${this.baseUrl}/Dictionaries/roles`, dto).pipe(
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
    return this.http.get<TribeDto[]>(`${this.baseUrl}/Dictionaries/tribes`).pipe(
      catchError(this.handleError)
    );
  }
  createTribe(dto: TribeDto): Observable<TribeDto> {
    return this.http.post<TribeDto>(`${this.baseUrl}/Dictionaries/tribes`, dto).pipe(
      catchError(this.handleError)
    );
  }
  updateTribe(id: number, dto: TribeDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Dictionaries/tribes/${id}`, dto).pipe(
      catchError(this.handleError)
    );
  }
  deleteTribe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Dictionaries/tribes/${id}`).pipe(
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
    const msg = (err?.error?.message ?? err?.message ?? 'Wystąpił błąd API');
    return throwError(() => new Error(msg));
  }
}
