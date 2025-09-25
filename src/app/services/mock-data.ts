import { EmployeeDto, TribeDto, SquadDto, RoleDto, ChapterDto, CompanyDto, DepartmentDto, EmployeeAssignmentDto } from '../models/epic-hr.models';

export const tribes: TribeDto[] = [
  { id: 1, name: 'Payments' },
  { id: 2, name: 'Onboarding' },
];

export const squads: SquadDto[] = [
  { id: 1, name: 'PayCore', tribeId: 1 },
  { id: 2, name: 'PayUX', tribeId: 1 },
  { id: 3, name: 'KYC', tribeId: 2 },
];

export const roles: RoleDto[] = [
  { id: 1, name: 'Developer' },
  { id: 2, name: 'QA' },
  { id: 3, name: 'Product Owner' },
];

export const chapters: ChapterDto[] = [
  { id: 1, name: 'Engineering', mpk: 'ENG' },
  { id: 2, name: 'Product', mpk: 'PROD' },
];

export const companies: CompanyDto[] = [
  { id: 1, name: 'Acme S.A.' },
  { id: 2, name: 'Globex' },
];

export const departments: DepartmentDto[] = [
  { id: 1, name: 'R&D' },
  { id: 2, name: 'Operations' },
];

export const employees: EmployeeDto[] = [
  {
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    assignments: [
      {
        id: 101,
        employeeId: 1,
        squadId: 1,
        roleId: 1,
        chapterId: 1,
        departmentId: 1,
        fte: 1,
        contractType: 'UoP',
        year: 2025,
        month: 9,
        quarter: 3,
        companies: [
          { companyId: 1, share: 0.6 },
          { companyId: 2, share: 0.4 },
        ],
      },
    ],
  },
  {
    id: 2,
    firstName: 'Anna',
    lastName: 'Nowak',
    assignments: [],
  },
];

export function nextId(collection: { id: number }[]): number {
  return collection.length ? Math.max(...collection.map((i) => i.id)) + 1 : 1;
}
