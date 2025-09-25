import { CommonModule, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DictionaryTabComponent, DictionaryKind } from './dictionary-tab.component';

@Component({
  selector: 'app-dictionary-manager',
  standalone: true,
  imports: [CommonModule, MatTabsModule, NgComponentOutlet, DictionaryTabComponent],
  templateUrl: './dictionary-manager.component.html',
  styleUrls: ['./dictionary-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictionaryManagerComponent {
  tabs: { label: string; kind: DictionaryKind }[] = [
    { label: 'Role', kind: 'roles' },
    { label: 'MPK', kind: 'mpks' },
    { label: 'Departamenty', kind: 'departments' },
    { label: 'Jednostki organizacyjne', kind: 'companies' },
    { label: 'Tribe', kind: 'tribes' },
    { label: 'Zespoły', kind: 'squads' },
  ];

  tabComp = DictionaryTabComponent;
}
