import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-tokens';
import { EmployeeDto, PeriodDto, PeriodWithEmployeesDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PeriodsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getOpenPeriod(): Observable<PeriodWithEmployeesDto> {
    return this.http.get<PeriodWithEmployeesDto>(`${this.baseUrl}/Periods/open`).pipe(
      catchError(this.handleError)
    );
  }

  closeAndGeneratePeriod(): Observable<PeriodWithEmployeesDto> {
    return this.http.post<PeriodWithEmployeesDto>(`${this.baseUrl}/Periods/close-and-generate`, null).pipe(
      catchError(this.handleError)
    );
  }

  // --- Additional Period list/detail endpoints ---
  getPeriods(): Observable<PeriodDto[]> {
    return this.http.get<PeriodDto[]>(`${this.baseUrl}/Periods`).pipe(
      catchError(this.handleError)
    );
  }

  getPeriod(periodId: string): Observable<PeriodWithEmployeesDto> {
    return this.http.get<PeriodWithEmployeesDto>(`${this.baseUrl}/Periods/${periodId}`).pipe(
      catchError(this.handleError)
    );
  }

  exportPeriod(periodId: string): Observable<HttpResponse<Blob>> {
    // Ustawiamy Accept na typ Excela (xlsx). Backend powinien zwrócić odpowiedni Content-Type.
    return this.http.get(`${this.baseUrl}/Periods/${periodId}/export`, {
      responseType: 'blob',
      observe: 'response',
      headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream' }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // --- Employees within Period ---
  getPeriodEmployees(periodId: string): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/Periods/${periodId}/employees`).pipe(
      catchError(this.handleError)
    );
  }

  createEmployee(periodId: string, body: Partial<EmployeeDto> & { assignments?: any[] }): Observable<EmployeeDto> {
    // Backend może oczekiwać wrappera { employeeDto: {...} }
    const wrapped = { employeeDto: body } as any;
    return this.http.post<EmployeeDto>(`${this.baseUrl}/Periods/${periodId}/employees`, wrapped).pipe(
      catchError(err => {
        if (err?.status === 400) {
          // Spróbuj bez wrappera jeśli walidacja wrappera nieprzewidziana
          return this.http.post<EmployeeDto>(`${this.baseUrl}/Periods/${periodId}/employees`, body).pipe(
            catchError(this.handleError)
          );
        }
        return this.handleError(err);
      })
    );
  }

  updateEmployee(periodId: string, employeeId: string, body: Partial<EmployeeDto>): Observable<void> {
    const baseUrl = `${this.baseUrl}/Periods/${periodId}/employees/${employeeId}`;
    const wrapped = { employeeDto: body } as any;
    return this.http.put<void>(baseUrl, wrapped).pipe(
      catchError(err => {
        if (err?.status === 400) {
          // Spróbuj bez wrappera przy walidacji wrappera
          return this.http.put<void>(baseUrl, body).pipe(
            catchError(this.handleError)
          );
        }
        if (err?.status === 404) {
          // Alternatywny endpoint (hipotetyczny) bez segmentu Periods
          const alt = `${this.baseUrl}/Employees/${employeeId}`; // jeśli backend mapuje globalnie
          return this.http.put<void>(alt, wrapped).pipe(
            catchError(e2 => {
              if (e2?.status === 400) {
                return this.http.put<void>(alt, body).pipe(catchError(this.handleError));
              }
              return this.handleError(e2);
            })
          );
        }
        return this.handleError(err);
      })
    );
  }

  deleteEmployee(periodId: string, employeeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Periods/${periodId}/employees/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteAssignment(periodId: string, assignmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Periods/${periodId}/assignments/${assignmentId}`).pipe(
      catchError(this.handleError)
    );
  }

  updateAssignment(periodId: string, assignmentId: string, body: Partial<any>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Periods/${periodId}/assignments/${assignmentId}`, body).pipe(
      catchError(this.handleError)
    );
  }

  createAssignment(periodId: string, employeeId: string, body: {
    id?: string;
    employeeId: string;
    periodId: string;
    tribeId: number | null;
    squadId: number | null;
    roleId: number | null;
    departmentId?: number | null;
    mpkId?: number | null;
    fte: number;
    contractType?: string | null;
    companies?: { companyId: number; share: number }[];
  }): Observable<any> {
    // Spróbuj najpierw endpoint osadzony w employee, a gdy 404 – fallback do prostszego /assignments
    return this.http.post<any>(`${this.baseUrl}/Periods/${periodId}/employees/${employeeId}/assignments`, body).pipe(
      catchError(err => {
        if (err?.status === 404) {
          return this.http.post<any>(`${this.baseUrl}/Periods/${periodId}/assignments`, body).pipe(
            catchError(this.handleError)
          );
        }
        return this.handleError(err);
      })
    );
  }

  private handleError(err: any) {
    const msg = (err?.error?.message ?? err?.message ?? 'Wystąpił błąd API');
    return throwError(() => new Error(msg));
  }
}
