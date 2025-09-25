import { Routes } from '@angular/router';
import { DictionaryManagerComponent } from './dictionaries/dictionary-manager.component';
import { OpenPeriodViewerComponent } from './periods/open-period-viewer.component';

export const routes: Routes = [
	{ path: 'slowniki', component: DictionaryManagerComponent },
	{ path: 'okres', component: OpenPeriodViewerComponent },
	{ path: '', pathMatch: 'full', redirectTo: 'okres' },
	{ path: '**', redirectTo: 'okres' },
];
