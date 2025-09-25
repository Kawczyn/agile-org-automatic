import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../services/employee.service';
import { EmployeeDto } from '../models/epic-hr.models';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);

  // signals pass-through
  employees = this.employeeService.employees;
  isLoading = this.employeeService.isLoading;
  error = this.employeeService.error;
  // dictionaries signals for template
  tribesSig = this.employeeService.tribes;
  squadsSig = this.employeeService.squads;
  rolesSig = this.employeeService.roles;
  chaptersSig = this.employeeService.chapters;
  companiesSig = this.employeeService.companies;
  departmentsSig = this.employeeService.departments;

  ngOnInit(): void {
    // load data on init
    this.employeeService.loadEmployees();
    this.employeeService.loadDictionaries();
  }

  // Helper name resolvers using loaded dictionaries (fallback to ID if not found)
  tribeName(id: number): string | number {
    return this.employeeService.tribes().find((x) => x.id === id)?.name ?? id;
  }
  squadName(id: number): string | number {
    return this.employeeService.squads().find((x) => x.id === id)?.name ?? id;
  }
  roleName(id: number): string | number {
    return this.employeeService.roles().find((x) => x.id === id)?.name ?? id;
  }
  chapterDisplay(id: number): string | number {
    const ch = this.employeeService.chapters().find((x) => x.id === id);
    return ch ? `${ch.name} (${ch.mpk})` : id;
  }
  companyName(id: number): string | number {
    return this.employeeService.companies().find((x) => x.id === id)?.name ?? id;
  }
  departmentName(id: number): string | number {
    return this.employeeService.departments().find((x) => x.id === id)?.name ?? id;
  }

  // Compute remaining share (to 1.0) for an assignment
  remainingForAssignment(a: { companies?: { companyId: number; share: number }[] } | null | undefined): number {
    const sum = (a?.companies ?? []).reduce((acc, x) => acc + (Number(x.share) || 0), 0);
    const rem = 1 - sum;
    return rem > 0 ? Number(rem.toFixed(2)) : 0;
  }

  // --- CRUD UI state ---
  editing = false;
  form: { id?: number; firstName: string; lastName: string } = {
    firstName: '',
    lastName: '',
  };

  beginCreate(): void {
    this.form = { firstName: '', lastName: '' };
    this.editing = true;
  }

  beginEdit(e: EmployeeDto): void {
    this.form = { id: e.id, firstName: e.firstName, lastName: e.lastName };
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  submitForm(): void {
    const trimmedFirst = (this.form.firstName ?? '').trim();
    const trimmedLast = (this.form.lastName ?? '').trim();
    if (!trimmedFirst || !trimmedLast) {
      this.employeeService.error.set('Imię i nazwisko są wymagane');
      return;
    }

    if (this.form.id) {
      const current = this.employees().find((x) => x.id === this.form.id);
      const assignments = current?.assignments ?? [];
      this.employeeService.saveEmployee({
        id: this.form.id,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        assignments,
      });
    } else {
      this.employeeService.saveEmployee({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        assignments: [],
      });
    }
    this.editing = false;
  }

  removeEmployee(id: number): void {
    if (confirm('Usunąć tego pracownika?')) {
      this.employeeService.deleteEmployee(id);
    }
  }

  // --- Inline row editing (employee + assignment + company) ---
  editingRow: { empId: number; assignmentId: number | null; companyId: number | null } | null = null;
  rowForm: {
    // employee
    firstName: string;
    lastName: string;
    // assignment
    squadId: number | null;
    roleId: number | null;
    chapterId: number | null;
    departmentId: number | null;
    fte: number | null;
    contractType: string;
    year: number | null;
    month: number | null;
    quarter: number | null;
    // company
    companyId: number | null;
    share: number | null;
  } | null = null;

  beginRowEdit(e: EmployeeDto, a?: any, c?: { companyId: number; share: number } | null): void {
    this.editingRow = { empId: e.id, assignmentId: a?.id ?? null, companyId: c?.companyId ?? null };
    const defaultShare = a ? this.remainingForAssignment(a) : null;
    this.rowForm = {
      firstName: e.firstName,
      lastName: e.lastName,
      squadId: a?.squadId ?? null,
      roleId: a?.roleId ?? null,
      chapterId: a?.chapterId ?? null,
      departmentId: a?.departmentId ?? null,
      fte: a?.fte ?? null,
      contractType: a?.contractType ?? '',
      year: a?.year ?? null,
      month: a?.month ?? null,
      quarter: a?.quarter ?? null,
      companyId: c?.companyId ?? null,
      share: c?.share ?? (c == null ? defaultShare : null),
    };
  }

  cancelRowEdit(): void {
    this.editingRow = null;
    this.rowForm = null;
  }

  async saveRow(): Promise<void> {
    if (!this.editingRow || !this.rowForm) return;
    const { empId, assignmentId, companyId } = this.editingRow;
    const form = this.rowForm;

    // update employee base fields
    const employee = this.employees().find((x) => x.id === empId);
    if (!employee) return this.cancelRowEdit();

    const updatedEmployee: EmployeeDto = {
      ...employee,
      firstName: form.firstName?.trim() ?? employee.firstName,
      lastName: form.lastName?.trim() ?? employee.lastName,
    };
    const namesChanged =
      updatedEmployee.firstName !== employee.firstName ||
      updatedEmployee.lastName !== employee.lastName;

    // update assignment if present, or create when there are no assignments yet
    let assignmentUpdated = false;
    if (assignmentId != null) {
      const currentAssignment = employee.assignments.find((as) => as.id === assignmentId);
      if (currentAssignment) {
        // Update company within assignment if present
        let companies = currentAssignment.companies ?? [];
        if (companyId != null) {
          companies = companies.map((co) =>
            co.companyId === companyId
              ? {
                  companyId: form.companyId ?? co.companyId,
                  share: Number(form.share ?? co.share),
                }
              : co,
          );
        } else if (form.companyId != null) {
          // Adding first (or additional) company; force share to remaining so total = 1.0
          const remaining = this.remainingForAssignment(currentAssignment);
          if (remaining <= 0) {
            this.employeeService.error.set('Suma udziałów dla tego przypisania wynosi już 100%.');
            return;
          }
          companies = [
            ...companies,
            { companyId: Number(form.companyId), share: remaining },
          ];
        }

        const updatedAssignment = {
          ...currentAssignment,
          squadId: Number(form.squadId ?? currentAssignment.squadId),
          roleId: Number(form.roleId ?? currentAssignment.roleId),
          chapterId: Number(form.chapterId ?? currentAssignment.chapterId),
          departmentId: Number(form.departmentId ?? currentAssignment.departmentId),
          fte: Number(form.fte ?? currentAssignment.fte),
          contractType: form.contractType ?? currentAssignment.contractType,
          year: Number(form.year ?? currentAssignment.year),
          month: Number(form.month ?? currentAssignment.month),
          quarter: Number(form.quarter ?? currentAssignment.quarter),
          companies,
        };

        // save assignment via service
        this.employeeService.upsertAssignment(empId, updatedAssignment).subscribe({
          next: () => {
            // refresh selected employee or list after assignment save
            this.employeeService.loadEmployees();
          },
          error: (err) => this.employeeService.error.set(String((err as any)?.message ?? err ?? 'Error')),
        });
        assignmentUpdated = true;
      }
    } else if (assignmentId == null && companyId == null) {
      // Create a new assignment for this employee
      const newAssignment = {
        // id omitted on purpose for POST; service detects it and POSTs
        employeeId: empId,
        squadId: Number(form.squadId ?? 0),
        roleId: Number(form.roleId ?? 0),
        chapterId: Number(form.chapterId ?? 0),
        departmentId: Number(form.departmentId ?? 0),
        fte: Number(form.fte ?? 0),
        contractType: form.contractType ?? '',
        year: Number(form.year ?? new Date().getFullYear()),
        month: Number(form.month ?? 1),
        quarter: Number(form.quarter ?? 1),
        companies: [],
      } as any;

      this.employeeService.upsertAssignment(empId, newAssignment).subscribe({
        next: () => this.employeeService.loadEmployees(),
        error: (err) => this.employeeService.error.set(String((err as any)?.message ?? err ?? 'Error')),
      });
      assignmentUpdated = true;
    }

    // save employee names if changed; only relevant when editing employee-level row or when names actually changed
    if ((assignmentId == null && companyId == null && namesChanged)) {
      this.employeeService.saveEmployee(updatedEmployee);
    }

    this.cancelRowEdit();
  }
}
