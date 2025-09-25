import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { PeriodWithEmployeesDto } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class MockPeriodsService {
  private latency = 150;
  private current$ = new BehaviorSubject<PeriodWithEmployeesDto>({
    id: 1,
    year: 2025,
    month: 9,
    quarter: 3,
    isClosed: false,
    employees: [],
  });

  getOpenPeriod(): Observable<PeriodWithEmployeesDto> {
    return this.current$.pipe(delay(this.latency));
  }

  closeAndGeneratePeriod(): Observable<PeriodWithEmployeesDto> {
    return of(null).pipe(
      delay(this.latency),
      map(() => {
        const prev = this.current$.value;
        const nextMonth = prev.month === 12 ? 1 : prev.month + 1;
        const nextYear = prev.month === 12 ? prev.year + 1 : prev.year;
        const nextQuarter = Math.ceil(nextMonth / 3);
        const next: PeriodWithEmployeesDto = {
          id: (prev.id ?? 0) + 1,
          year: nextYear,
          month: nextMonth,
          quarter: nextQuarter,
          isClosed: false,
          employees: [],
        };
        this.current$.next(next);
        return next;
      })
    );
  }
}
