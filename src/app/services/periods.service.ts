import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-tokens';
import { PeriodWithEmployeesDto } from '../models/api.models';

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

  private handleError(err: any) {
    const msg = (err?.error?.message ?? err?.message ?? 'Wystąpił błąd API');
    return throwError(() => new Error(msg));
  }
}
