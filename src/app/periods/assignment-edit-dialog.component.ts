import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface AssignmentEditData {
  assignment: any; // shape from API
  companies: { id: number; name: string }[];
  dictionaries: {
    tribes: { id: number; name?: string | null }[];
    squads: { id: number; name?: string | null; tribeId: number }[];
    roles: { id: number; name?: string | null }[];
    departments: { id: number; name?: string | null }[];
    mpks: { id: number; name?: string | null }[];
  };
  createEmployee?: boolean; // tryb tworzenia nowego pracownika z pierwszym assignementem
  firstName?: string | null;
  lastName?: string | null;
}

@Component({
  selector: 'app-assignment-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.createEmployee ? 'Nowy pracownik' : 'Edytuj przypisanie' }}</h2>
    <form class="form" [formGroup]="form" (ngSubmit)="submit()" mat-dialog-content>
      <div class="field-row" *ngIf="data.createEmployee">
        <div class="field-label">Imię</div>
        <div class="field-control">
          <mat-form-field appearance="outline" class="full">
            <input matInput type="text" formControlName="firstName" />
          </mat-form-field>
        </div>
      </div>
      <div class="field-row" *ngIf="data.createEmployee">
        <div class="field-label">Nazwisko</div>
        <div class="field-control">
          <mat-form-field appearance="outline" class="full">
            <input matInput type="text" formControlName="lastName" />
          </mat-form-field>
        </div>
      </div>
      <div class="field-row" *ngFor="let row of mainFields">
        <div class="field-label">{{ row.label }}</div>
        <div class="field-control">
          <ng-container [ngSwitch]="row.key">
            <mat-form-field *ngSwitchCase="'tribeId'" appearance="outline" class="full">
              <mat-select formControlName="tribeId">
                <mat-option *ngFor="let t of data.dictionaries.tribes" [value]="t.id">{{ t.name || t.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'squadId'" appearance="outline" class="full">
              <mat-select formControlName="squadId" [disabled]="!form.value.tribeId" placeholder="Wybierz squad">
                <mat-option *ngIf="!form.value.tribeId" [value]="null" disabled>Najpierw wybierz Tribe</mat-option>
                <mat-option *ngFor="let s of filteredSquads()" [value]="s.id">{{ s.name || s.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'roleId'" appearance="outline" class="full">
              <mat-select formControlName="roleId">
                <mat-option *ngFor="let r of data.dictionaries.roles" [value]="r.id">{{ r.name || r.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'departmentId'" appearance="outline" class="full">
              <mat-select formControlName="departmentId">
                <mat-option [value]="null">—</mat-option>
                <mat-option *ngFor="let d of data.dictionaries.departments" [value]="d.id">{{ d.name || d.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'mpkId'" appearance="outline" class="full">
              <mat-select formControlName="mpkId">
                <mat-option [value]="null">—</mat-option>
                <mat-option *ngFor="let m of data.dictionaries.mpks" [value]="m.id">{{ m.name || m.id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'fte'" appearance="outline" class="full">
              <input matInput type="number" step="0.01" min="0.01" formControlName="fte" />
            </mat-form-field>
            <mat-form-field *ngSwitchCase="'contractType'" appearance="outline" class="full">
              <input matInput type="text" formControlName="contractType" />
            </mat-form-field>
          </ng-container>
        </div>
      </div>

      <div class="companies-block">
        <div class="companies-title">Udziały spółek (%)</div>
        <div class="company-row" *ngFor="let c of data.companies">
          <div class="field-label">{{ c.name || ('Company '+c.id) }}</div>
          <div class="field-control">
            <mat-form-field appearance="outline" class="mini">
              <input matInput type="number" step="1" min="0" max="100" [formControlName]="'company_'+c.id" />
            </mat-form-field>
          </div>
        </div>
      </div>

      <div class="actions" mat-dialog-actions>
        <button mat-button type="button" (click)="dialogRef.close()">Anuluj</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Zapisz</button>
      </div>
    </form>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:8px; width:100%; }
    .field-row, .company-row { display:flex; align-items:center; gap:10px; }
    .field-row { padding:0; }
    .field-label { width:140px; font-size:12.5px; font-weight:600; color:#2f3b44; line-height:40px; height:40px; }
    .field-control { flex:1; display:flex; align-items:center; }
    .full { width:100%; }
    .companies-block { margin-top:2px; display:flex; flex-direction:column; gap:0; }
    .companies-title { font-weight:600; font-size:11px; letter-spacing:.6px; text-transform:uppercase; color:#5a6b75; margin:2px 0 2px; }
    .company-row { padding:0; }
    .mini { max-width:100px; }
    .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:2px; }
    ::ng-deep .mat-mdc-dialog-surface { border-radius:14px; }
    /* Compact field appearance inside dialog only */
    :host ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-subscript-wrapper { display:none; }
    :host ::ng-deep .mat-mdc-form-field .mdc-notched-outline__leading,
    :host ::ng-deep .mat-mdc-form-field .mdc-notched-outline__notch,
    :host ::ng-deep .mat-mdc-form-field .mdc-notched-outline__trailing { height:40px; }
    :host ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper { min-height:40px; }
    :host ::ng-deep .mat-mdc-form-field .mdc-text-field__input { padding: 0 0 2px 0; }
    :host ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label { top:50%; transform:translateY(-50%); }
    :host ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label { transform:translateY(-155%) scale(.75); }
  `]
})
export class AssignmentEditDialogComponent {
  form: FormGroup;
  // definicja pól głównych w kolejności wyświetlania
  mainFields: Array<{ key: string; label: string }> = [
    { key: 'tribeId', label: 'Tribe' },
    { key: 'squadId', label: 'Squad' },
    { key: 'roleId', label: 'Rola' },
    { key: 'departmentId', label: 'Departament' },
    { key: 'mpkId', label: 'MPK' },
    { key: 'fte', label: 'FTE' },
    { key: 'contractType', label: 'Umowa' }
  ];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AssignmentEditData,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AssignmentEditDialogComponent>
  ) {
    const a = data.assignment;
    const group: any = {
      tribeId: [a.tribeId],
      squadId: [a.squadId],
      roleId: [a.roleId],
      departmentId: [a.departmentId ?? null],
      mpkId: [a.mpkId ?? null],
      fte: [a.fte],
      contractType: [a.contractType ?? '']
    };
    if (data.createEmployee) {
      group.firstName = [data.firstName ?? ''];
      group.lastName = [data.lastName ?? ''];
    }
    (a.companies ?? []).forEach((c: any) => group['company_'+c.companyId] = [c.share]);
    data.companies.forEach(c => { const key = 'company_'+c.id; if (!(key in group)) group[key] = [0]; });
    this.form = this.fb.group(group);
    this.form.get('tribeId')?.valueChanges.subscribe(val => {
      const squadCtrl = this.form.get('squadId');
      if (!squadCtrl) return;
      const currentSquad = this.data.dictionaries.squads.find(s => s.id === squadCtrl.value);
      // If current squad no longer matches tribe -> clear it
      if (currentSquad && currentSquad.tribeId !== val) {
        squadCtrl.setValue(null);
      }
      if (!currentSquad) {
        const matches = this.data.dictionaries.squads.filter(s => s.tribeId === val);
        if (matches.length === 1) {
          squadCtrl.setValue(matches[0].id);
        } else if (matches.length === 0) {
          squadCtrl.setValue(null);
        }
      }
    });
  }

  filteredSquads() {
    const tribeId = this.form.value.tribeId;
    if (!tribeId) return [];
    return this.data.dictionaries.squads.filter(s => s.tribeId === tribeId);
  }

  submit() {
    const raw = this.form.getRawValue();
    const companies = this.data.companies.map(c => ({ companyId: c.id, share: Number(raw['company_'+c.id] ?? 0) }));
    const changes: any = {
      tribeId: raw.tribeId,
      squadId: raw.squadId,
      roleId: raw.roleId,
      departmentId: raw.departmentId ?? null,
      mpkId: raw.mpkId ?? null,
      fte: Number(raw.fte),
      contractType: raw.contractType || null,
      companies
    };
    if (this.data.createEmployee) {
      changes.firstName = raw.firstName?.trim() || null;
      changes.lastName = raw.lastName?.trim() || null;
    }
    this.dialogRef.close(changes);
  }
}
