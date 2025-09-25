import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { employees, tribes, squads, roles, chapters, companies, departments, nextId } from './mock-data';
import { EmployeeDto, EmployeeAssignmentDto } from '../models/epic-hr.models';
import { MockConfigService } from './mock-config';

export const mockBackendInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const mockConfig = inject(MockConfigService);
  const enable = mockConfig.enabled();
  if (!enable || !req.url.startsWith('/api')) {
    return next(req);
  }

  // small artificial delay
  const respond = <T>(body: T, status = 200) => of(new HttpResponse<T>({ status, body })).pipe(delay(200));
  const notFound = () => of(new HttpResponse({ status: 404 })).pipe(delay(100));

  const url = new URL(req.url, window.location.origin);
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/');
  const method = req.method.toUpperCase();

  // /api/employees
  if (segments[0] === 'employees' && segments.length === 1) {
    if (method === 'GET') return respond([...employees]);
    if (method === 'POST') {
      const payload = req.body as Omit<EmployeeDto, 'id'>;
      // Avoid duplicate keys by extracting assignments and adding id at the end
      const { assignments = [], ...rest } = payload as any;
      const item: EmployeeDto = { ...rest, assignments, id: nextId(employees) };
      employees.unshift(item);
      return respond(item, 201);
    }
  }

  // /api/employees/{id}
  if (segments[0] === 'employees' && segments.length === 2) {
    const id = Number(segments[1]);
    const idx = employees.findIndex((e) => e.id === id);
    if (idx < 0) return notFound();

    if (method === 'GET') return respond(employees[idx]);
    if (method === 'PUT') {
      const updated: EmployeeDto = { ...employees[idx], ...(req.body as EmployeeDto), id };
      employees[idx] = updated;
      return respond(updated);
    }
    if (method === 'DELETE') {
      employees.splice(idx, 1);
      return respond(null as any, 204);
    }
  }

  // /api/employees/{id}/assignments
  if (segments[0] === 'employees' && segments[2] === 'assignments' && segments.length === 3) {
    const employeeId = Number(segments[1]);
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return notFound();
    if (method === 'GET') return respond([...emp.assignments]);
    if (method === 'POST') {
      const payload = req.body as EmployeeAssignmentDto;
      // Spread payload first, then enforce id and employeeId
      const item: EmployeeAssignmentDto = { ...payload, id: nextId(emp.assignments), employeeId };
      emp.assignments.unshift(item);
      return respond(item, 201);
    }
  }

  // /api/employees/{id}/assignments/{assignmentId}
  if (segments[0] === 'employees' && segments[2] === 'assignments' && segments.length === 4) {
    const employeeId = Number(segments[1]);
    const assignmentId = Number(segments[3]);
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return notFound();
    const idx = emp.assignments.findIndex((a) => a.id === assignmentId);
    if (idx < 0) return notFound();

    if (method === 'PUT') {
      const updated: EmployeeAssignmentDto = { ...emp.assignments[idx], ...(req.body as EmployeeAssignmentDto), id: assignmentId, employeeId };
      emp.assignments[idx] = updated;
      return respond(updated);
    }
    if (method === 'DELETE') {
      emp.assignments.splice(idx, 1);
      return respond(null as any, 204);
    }
  }

  // Dictionaries
  if (segments[0] === 'tribes') return method === 'GET' ? respond([...tribes]) : notFound();
  if (segments[0] === 'squads') return method === 'GET' ? respond([...squads]) : notFound();
  if (segments[0] === 'roles') return method === 'GET' ? respond([...roles]) : notFound();
  if (segments[0] === 'chapters') return method === 'GET' ? respond([...chapters]) : notFound();
  if (segments[0] === 'companies') return method === 'GET' ? respond([...companies]) : notFound();
  if (segments[0] === 'departments') return method === 'GET' ? respond([...departments]) : notFound();

  return next(req);
};
