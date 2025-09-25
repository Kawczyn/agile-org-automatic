import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { DictionariesService } from '../services/dictionaries.service';
import { CompanyDto, DepartmentDto, MPKDto, RoleDto, SquadDto, TribeDto } from '../models/api.models';
import { Observable } from 'rxjs';

export type DictionaryKind = 'roles' | 'mpks' | 'departments' | 'companies' | 'tribes' | 'squads';

type DtoMap = {
  roles: RoleDto;
  mpks: MPKDto;
  departments: DepartmentDto;
  companies: CompanyDto;
  tribes: TribeDto;
  squads: SquadDto;
};

@Component({
  selector: 'app-dictionary-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule],
  templateUrl: './dictionary-tab.component.html',
  styleUrls: ['./dictionary-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictionaryTabComponent<TKind extends DictionaryKind = DictionaryKind> implements OnInit {
  private readonly dictionaries = inject(DictionariesService);
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) kind!: TKind;

  // data and ui state
  data = signal<DtoMap[TKind][]>([] as any);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  displayedColumns: string[] = ['id', 'name', 'actions'];

  form!: FormGroup<{ id: FormControl<number | null>; name: FormControl<string>; tribeId: FormControl<number | null> }>;
  // -1 = brak edycji; dowolny id = edycja wiersza
  editingId = signal<number>(-1);
  // tryb dodawania nowego wpisu
  isAdding = signal<boolean>(false);
  tribesOptions = signal<TribeDto[]>([]);

  ngOnInit(): void {
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)],
        asyncValidators: [this.uniqueNameValidator()],
        // validate on each change so the Save button enables immediately when valid
        updateOn: 'change',
      }),
      tribeId: this.fb.control<number | null>(null),
    });
    if (this.kind === 'squads') {
      // Add tribe column for squads
      this.displayedColumns = ['id', 'name', 'tribeId', 'actions'];
      // Load tribes for select options
      this.dictionaries.getTribes().subscribe({
        next: (list) => this.tribesOptions.set(list),
        error: (err) => this.error.set(String(err?.message ?? err)),
      });
      // Require tribe assignment for squads
      this.form.controls.tribeId.addValidators([Validators.required]);
    }
    this.load();
  }

  // Load list per kind
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    let obs: Observable<any[]>;
    switch (this.kind) {
      case 'roles':
        obs = this.dictionaries.getRoles();
        break;
      case 'mpks':
        obs = this.dictionaries.getMpks();
        break;
      case 'departments':
        obs = this.dictionaries.getDepartments();
        break;
      case 'companies':
        obs = this.dictionaries.getCompanies();
        break;
      case 'tribes':
        obs = this.dictionaries.getTribes();
        break;
      case 'squads':
        obs = this.dictionaries.getSquads();
        break;
      default:
        obs = new Observable<any[]>();
    }
    obs.subscribe({
      next: (list) => this.data.set(list as any),
      error: (err) => this.error.set(String(err?.message ?? err)),
      complete: () => this.loading.set(false),
    });
  }

  beginAdd(): void {
    this.isAdding.set(true);
    this.editingId.set(-1);
    this.form.reset({ id: null, name: '' });
  }

  beginEdit(row: any): void {
    this.isAdding.set(false);
    this.editingId.set(row.id);
    this.form.patchValue({ id: row.id ?? null, name: row.name ?? '' });
  }

  cancel(): void {
    this.isAdding.set(false);
    this.editingId.set(-1);
    this.form.reset({ id: null, name: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    const dto: any = { id: val.id ?? undefined, name: val.name };
    if (this.kind === 'squads') {
      dto.tribeId = val.tribeId;
    }

    let obs: Observable<any>;
    const id = val.id ?? 0;

    const isCreate = !val.id;
    switch (this.kind) {
      case 'roles':
        obs = isCreate ? this.dictionaries.createRole(dto) : this.dictionaries.updateRole(id, dto);
        break;
      case 'mpks':
        obs = isCreate ? this.dictionaries.createMpk(dto) : this.dictionaries.updateMpk(id, dto);
        break;
      case 'departments':
        obs = isCreate ? this.dictionaries.createDepartment(dto) : this.dictionaries.updateDepartment(id, dto);
        break;
      case 'companies':
        obs = isCreate ? this.dictionaries.createCompany(dto) : this.dictionaries.updateCompany(id, dto);
        break;
      case 'tribes':
        obs = isCreate ? this.dictionaries.createTribe(dto) : this.dictionaries.updateTribe(id, dto);
        break;
      case 'squads':
        obs = isCreate ? this.dictionaries.createSquad(dto) : this.dictionaries.updateSquad(id, dto);
        break;
      default:
        obs = new Observable<any>();
    }

    this.loading.set(true);
    this.error.set(null);
    obs.subscribe({
      next: () => {
        this.cancel(); // hides add form & clears edit state
        this.load();
      },
      error: (err) => this.error.set(String(err?.message ?? err)),
      complete: () => this.loading.set(false),
    });
  }

  remove(row: any): void {
    if (!confirm('Usunąć element?')) return;
    const id = row.id as number;
    let obs: Observable<void>;
    switch (this.kind) {
      case 'roles':
        obs = this.dictionaries.deleteRole(id);
        break;
      case 'mpks':
        obs = this.dictionaries.deleteMpk(id);
        break;
      case 'departments':
        obs = this.dictionaries.deleteDepartment(id);
        break;
      case 'companies':
        obs = this.dictionaries.deleteCompany(id);
        break;
      case 'tribes':
        obs = this.dictionaries.deleteTribe(id);
        break;
      case 'squads':
        obs = this.dictionaries.deleteSquad(id);
        break;
      default:
        obs = new Observable<void>();
    }
    this.loading.set(true);
    this.error.set(null);
    obs.subscribe({
      next: () => {
        this.isAdding.set(false);
        this.load();
      },
      error: (err) => this.error.set(String(err?.message ?? err)),
      complete: () => this.loading.set(false),
    });
  }

  // Helper to resolve tribe name by id for squads
  tribeNameById(id: number | null | undefined): string | number {
    const t = this.tribesOptions().find((x) => x.id === (id as number));
    return (t?.name ?? id ?? '');
  }

  // Async validator to ensure name uniqueness within current list
  private uniqueNameValidator(): AsyncValidatorFn {
    return async (control): Promise<ValidationErrors | null> => {
      const value = (control.value ?? '').toString().trim().toLowerCase();
      if (!value) return null;
      const currentId = this.form?.controls.id.value ?? null;
      const exists = (this.data() ?? []).some((x: any) => (x.name ?? '').toString().trim().toLowerCase() === value && x.id !== currentId);
      return exists ? { notUnique: true } : null;
    };
  }
}
