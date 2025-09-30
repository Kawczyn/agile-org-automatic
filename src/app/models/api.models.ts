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
  share: number; // double (wartość udziału) – wg spec numeric double
}

export interface EmployeeAssignmentDto {
  id?: string;              // GUID
  employeeId: string;       // GUID
  squadId: number | null;   // może być null jeśli brak przypisania do squadu
  tribeId: number | null;   // każdy squad ma tribe - pole wymagane (może być null jeśli brak)
  roleId: number;
  mpkId?: number | null;
  departmentId?: number | null;
  fte: number;
  contractType?: string | null;
  periodId: string;         // GUID okresu
  companies?: EmployeeAssignmentCompanyDto[] | null;
}

export interface EmployeeDto {
  id: string; // GUID
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
  id: string; // GUID
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
