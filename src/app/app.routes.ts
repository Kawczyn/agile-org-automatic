import { Routes } from '@angular/router';
import { DictionaryManagerComponent } from './dictionaries/dictionary-manager.component';

export const routes: Routes = [
	{ path: 'slowniki', component: DictionaryManagerComponent },
	{ path: '', pathMatch: 'full', redirectTo: 'slowniki' },
	{ path: '**', redirectTo: 'slowniki' },
];
