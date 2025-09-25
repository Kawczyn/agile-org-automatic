import { Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list/employee-list.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'employees' },
	{ path: 'employees', component: EmployeeListComponent },
];
