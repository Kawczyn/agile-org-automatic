// DTO models mirrored from backend
export interface TribeDto {
  id: number;
  name: string;
}

export interface SquadDto {
  id: number;
  name: string;
  tribeId: number;
}

export interface RoleDto {
  id: number;
  name: string;
}

export interface ChapterDto {
  id: number;
  name: string;
  mpk: string;
}

export interface CompanyDto {
  id: number;
  name: string;
}

export interface DepartmentDto {
  id: number;
  name: string;
}

export interface EmployeeAssignmentCompanyDto {
  companyId: number;
  share: number;
}

export interface EmployeeAssignmentDto {
  id: number;
  employeeId: number;
  squadId: number;
  roleId: number;
  chapterId: number;
  departmentId: number;
  fte: number;
  contractType: string;
  year: number;
  month: number;
  quarter: number;
  companies: EmployeeAssignmentCompanyDto[];
}

export interface EmployeeDto {
  id: number;
  firstName: string;
  lastName: string;
  assignments: EmployeeAssignmentDto[];
}
