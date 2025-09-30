import { Routes } from '@angular/router';
import { DictionaryManagerComponent } from './dictionaries/dictionary-manager.component';
import { OpenPeriodPageComponent } from './periods/open-period-page.component';
import { PeriodsListComponent } from './periods/periods-list.component';

export const routes: Routes = [
	{ path: 'slowniki', component: DictionaryManagerComponent },
	{ path: 'okresy', component: PeriodsListComponent },
	{ path: 'okres', component: OpenPeriodPageComponent },
	{ path: '', pathMatch: 'full', redirectTo: 'okres' },
	{ path: '**', redirectTo: 'okres' },
];
