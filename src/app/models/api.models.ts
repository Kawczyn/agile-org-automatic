// Auto-generated from provided OpenAPI spec (subset for this app)
export interface CompanyDto {
  id: number;
  name?: string | null;
}

export interface DepartmentDto {
  id: number;
  name?: string | null;
}

export interface EmployeeAssignmentCompanyDto {
  companyId: number;
  share: number; // 0..1
}

export interface EmployeeAssignmentDto {
  id?: number;
  employeeId: number;
  squadId: number;
  tribeId: number;
  roleId: number;
  mpkId?: number | null;
  departmentId?: number | null;
  fte: number;
  contractType?: string | null;
  periodId: number;
  companies?: EmployeeAssignmentCompanyDto[] | null;
}

export interface EmployeeDto {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  assignments?: EmployeeAssignmentDto[] | null;
}

export interface MPKDto {
  id: number;
  name?: string | null;
}

// Alias to match requested name in prompt
export type MpksDto = MPKDto;

export interface PeriodDto {
  id: number;
  year: number;
  month: number;
  quarter: number;
  isClosed: boolean;
}

export interface PeriodWithEmployeesDto extends PeriodDto {
  employees?: EmployeeDto[] | null;
}

export interface RoleDto {
  id: number;
  name?: string | null;
}

export interface SquadDto {
  id: number;
  name?: string | null;
  tribeId: number;
}

export interface TribeDto {
  id: number;
  name?: string | null;
}
