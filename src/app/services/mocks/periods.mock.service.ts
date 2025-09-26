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
    employees: [
      {
        id: 1,
        firstName: 'Jan',
        lastName: 'Kowalski',
        assignments: [
          {
            id: 101,
            employeeId: 1,
            tribeId: 1,
            squadId: 1,
            roleId: 1,
            mpkId: 1,
            departmentId: 1,
            fte: 1,
            contractType: 'UoP',
            periodId: 1,
            companies: [
              { companyId: 1, share: 1 },
    { companyId: 2, share: 0.5 },
            ],
          },
        ],
      },
      {
        id: 2,
        firstName: 'Anna',
        lastName: 'Nowak',
        assignments: [
          {
            id: 102,
            employeeId: 2,
            tribeId: 2,
            squadId: 2,
            roleId: 2,
            mpkId: 2,
            departmentId: 2,
            fte: 0.8,
            contractType: 'B2B',
            periodId: 1,
            companies: [
              { companyId: 1, share: 0.5 },
              { companyId: 2, share: 0.5 },
            ],
          },
                    {
            id: 104,
            employeeId: 2,
            tribeId: 2,
            squadId: 2,
            roleId: 2,
            mpkId: 2,
            departmentId: 2,
            fte: 0.8,
            contractType: 'B2B',
            periodId: 1,
            companies: [
              { companyId: 1, share: 0.5 },
              { companyId: 2, share: 0.5 },
            ],
          },
        ],
      },
      {
        id: 3,
        firstName: 'Piotr',
        lastName: 'Zieliński',
        assignments: [
          {
            id: 103,
            employeeId: 3,
            
            squadId: 1,tribeId: 1,
            roleId: 3,
            mpkId: null,
            departmentId: null,
            fte: 0.5,
            contractType: 'UoD',
            periodId: 1,
            companies: [
              { companyId: 3, share: 1 },
            ],
          },
        ],
      },
    ],
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
          employees: (prev.employees ?? []).map(e => ({
            ...e,
            // shallow copy assignments and update periodId for the new period
            assignments: (e.assignments ?? []).map(a => ({
              ...a,
              // new assignment id optional in mock; keep or increment for readability
              id: (a.id ?? 0) + 100,
              periodId: (prev.id ?? 0) + 1,
            })),
          })),
        };
        this.current$.next(next);
        return next;
      })
    );
  }
}
