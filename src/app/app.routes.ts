import { Routes } from '@angular/router';
import { DictionaryManagerComponent } from './dictionaries/dictionary-manager.component';
import { OpenPeriodPageComponent } from './periods/open-period-page.component';

export const routes: Routes = [
	{ path: 'slowniki', component: DictionaryManagerComponent },
	{ path: 'okres', component: OpenPeriodPageComponent },
	{ path: '', pathMatch: 'full', redirectTo: 'okres' },
	{ path: '**', redirectTo: 'okres' },
];
