import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EmployeeDto,
  TribeDto,
  SquadDto,
  RoleDto,
  ChapterDto,
  CompanyDto,
  DepartmentDto,
  EmployeeAssignmentDto,
} from '../models/epic-hr.models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  // Signals - stan
  readonly employees = signal<EmployeeDto[]>([]);
  readonly selectedEmployee = signal<EmployeeDto | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Słowniki
  readonly tribes = signal<TribeDto[]>([]);
  readonly squads = signal<SquadDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly chapters = signal<ChapterDto[]>([]);
  readonly companies = signal<CompanyDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);

  // CRUD - Observable API
  getAll(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/employees`);
  }

  getById(id: number): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.baseUrl}/employees/${id}`);
  }

  create(employee: Omit<EmployeeDto, 'id'>): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(`${this.baseUrl}/employees`, employee, this.httpOptions);
  }

  update(employee: EmployeeDto): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.baseUrl}/employees/${employee.id}`, employee, this.httpOptions);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`);
  }

  // Assignments helpers (opcjonalnie)
  getAssignments(employeeId: number): Observable<EmployeeAssignmentDto[]> {
    return this.http.get<EmployeeAssignmentDto[]>(`${this.baseUrl}/employees/${employeeId}/assignments`);
  }

  upsertAssignment(employeeId: number, assignment: EmployeeAssignmentDto): Observable<EmployeeAssignmentDto> {
    const url = `${this.baseUrl}/employees/${employeeId}/assignments/${assignment.id ?? ''}`.replace(/\/$/, '');
    const hasId = typeof assignment.id === 'number' && assignment.id > 0;
    return hasId
      ? this.http.put<EmployeeAssignmentDto>(url, assignment, this.httpOptions)
      : this.http.post<EmployeeAssignmentDto>(`${this.baseUrl}/employees/${employeeId}/assignments`, assignment, this.httpOptions);
  }

  removeAssignment(employeeId: number, assignmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${employeeId}/assignments/${assignmentId}`);
  }

  // Signals helpers - ładowanie do stanu
  loadEmployees(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.getAll().subscribe({
      next: (data) => this.employees.set(data),
      error: (err) => this.error.set(this.getErrorMessage(err)),
      complete: () => this.isLoading.set(false),
    });
  }

  loadEmployee(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.getById(id).subscribe({
      next: (emp) => this.selectedEmployee.set(emp),
      error: (err) => this.error.set(this.getErrorMessage(err)),
      complete: () => this.isLoading.set(false),
    });
  }

  saveEmployee(employee: Partial<EmployeeDto> & { id?: number }): void {
    this.isLoading.set(true);
    this.error.set(null);
    const req$ = employee.id ? this.update(employee as EmployeeDto) : this.create(employee as Omit<EmployeeDto, 'id'>);
    req$.subscribe({
      next: (saved) => {
        const list = this.employees();
        const idx = list.findIndex((e) => e.id === saved.id);
        if (idx >= 0) {
          this.employees.set([...list.slice(0, idx), saved, ...list.slice(idx + 1)]);
        } else {
          this.employees.set([saved, ...list]);
        }
        this.selectedEmployee.set(saved);
      },
      error: (err) => this.error.set(this.getErrorMessage(err)),
      complete: () => this.isLoading.set(false),
    });
  }

  deleteEmployee(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.delete(id).subscribe({
      next: () => this.employees.set(this.employees().filter((e) => e.id !== id)),
      error: (err) => this.error.set(this.getErrorMessage(err)),
      complete: () => this.isLoading.set(false),
    });
  }

  loadDictionaries(): void {
    this.loadTribes();
    this.loadSquads();
    this.loadRoles();
    this.loadChapters();
    this.loadCompanies();
    this.loadDepartments();
  }

  loadTribes(): void {
    this.http.get<TribeDto[]>(`${this.baseUrl}/tribes`).subscribe({
      next: (d) => this.tribes.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  loadSquads(tribeId?: number): void {
    const url = tribeId != null ? `${this.baseUrl}/tribes/${tribeId}/squads` : `${this.baseUrl}/squads`;
    this.http.get<SquadDto[]>(url).subscribe({
      next: (d) => this.squads.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  loadRoles(): void {
    this.http.get<RoleDto[]>(`${this.baseUrl}/roles`).subscribe({
      next: (d) => this.roles.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  loadChapters(): void {
    this.http.get<ChapterDto[]>(`${this.baseUrl}/chapters`).subscribe({
      next: (d) => this.chapters.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  loadCompanies(): void {
    this.http.get<CompanyDto[]>(`${this.baseUrl}/companies`).subscribe({
      next: (d) => this.companies.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  loadDepartments(): void {
    this.http.get<DepartmentDto[]>(`${this.baseUrl}/departments`).subscribe({
      next: (d) => this.departments.set(d),
      error: (err) => this.error.set(this.getErrorMessage(err)),
    });
  }

  selectEmployee(id: number | null): void {
    if (id == null) {
      this.selectedEmployee.set(null);
      return;
    }
    const existing = this.employees().find((e) => e.id === id);
    if (existing) {
      this.selectedEmployee.set(existing);
    } else {
      this.loadEmployee(id);
    }
  }

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) return String((err as any).message);
    return 'Wystąpił nieznany błąd';
  }
}
