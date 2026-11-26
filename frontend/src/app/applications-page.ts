import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './auth.service';
import { Application, ApplicationsApi, STATUS_LABELS } from './applications.api';

@Component({
  selector: 'app-applications-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar class="toolbar">
      <mat-icon class="brand" aria-hidden="true">work_history</mat-icon>
      <h1>Mes candidatures</h1>
      <span class="spacer"></span>
      <span class="user">{{ auth.user()?.displayName }}</span>
      <button matButton (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span class="logout-label">Se déconnecter</span>
      </button>
    </mat-toolbar>

    <main class="content">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>
            {{ editingId() ? 'Modifier la candidature' : 'Nouvelle candidature' }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline">
              <mat-label>Entreprise</mat-label>
              <input matInput formControlName="company" required />
              <mat-error>2 caractères minimum</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Poste</mat-label>
              <input matInput formControlName="position" required />
              <mat-error>2 caractères minimum</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Lien de l'offre</mat-label>
              <input matInput type="url" formControlName="offerUrl" />
              <mat-icon matSuffix aria-hidden="true">link</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Statut</mat-label>
              <select matNativeControl formControlName="status">
                @for (s of statuses; track s[0]) {
                  <option [value]="s[0]">{{ s[1] }}</option>
                }
              </select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Date d'envoi</mat-label>
              <input matInput type="date" formControlName="appliedAt" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>

            @if (error()) {
              <p class="error full" role="alert">
                <mat-icon>error</mat-icon>
                {{ error() }}
              </p>
            }

            <div class="actions full">
              @if (editingId()) {
                <button matButton type="button" (click)="cancel()">Annuler</button>
              }
              <button matButton="filled" type="submit">
                <mat-icon>{{ editingId() ? 'save' : 'add' }}</mat-icon>
                {{ editingId() ? 'Enregistrer' : 'Ajouter' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Candidatures</mat-card-title>
          <mat-card-subtitle>{{ items().length }} au total</mat-card-subtitle>
        </mat-card-header>
        <div class="table-wrapper">
          <table mat-table [dataSource]="items()" [trackBy]="trackById">
            <ng-container matColumnDef="company">
              <th mat-header-cell *matHeaderCellDef>Entreprise</th>
              <td mat-cell *matCellDef="let a" class="company">{{ a.company }}</td>
            </ng-container>
            <ng-container matColumnDef="position">
              <th mat-header-cell *matHeaderCellDef>Poste</th>
              <td mat-cell *matCellDef="let a">{{ a.position }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let a">
                <span class="status" [class]="'status-' + a.status">{{ labels[a.status] }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="appliedAt">
              <th mat-header-cell *matHeaderCellDef>Envoyée le</th>
              <td mat-cell *matCellDef="let a">{{ a.appliedAt | date: 'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef><span class="sr-only">Actions</span></th>
              <td mat-cell *matCellDef="let a" class="row-actions">
                @if (a.offerUrl) {
                  <a
                    matIconButton
                    [href]="a.offerUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    attr.aria-label="Voir l'offre {{ a.company }}"
                    matTooltip="Voir l'offre"
                  >
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                }
                <button
                  matIconButton
                  attr.aria-label="Modifier {{ a.company }}"
                  matTooltip="Modifier"
                  (click)="edit(a)"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  matIconButton
                  class="delete"
                  attr.aria-label="Supprimer {{ a.company }}"
                  matTooltip="Supprimer"
                  (click)="remove(a)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr
              mat-row
              *matRowDef="let a; columns: columns"
              [class.editing]="a._id === editingId()"
            ></tr>
            <tr class="mat-mdc-no-data-row" *matNoDataRow>
              <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
                Aucune candidature pour l'instant.
              </td>
            </tr>
          </table>
        </div>
      </mat-card>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
      gap: 0.5rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .toolbar h1 {
      margin: 0;
      font: var(--mat-sys-title-large);
    }
    .brand {
      color: var(--mat-sys-primary);
    }
    .spacer {
      flex: 1;
    }
    .user {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .content {
      display: grid;
      /* minmax(0, …) : le tableau défile dans sa carte au lieu d'élargir la page. */
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
      max-width: 1080px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }
    mat-card-header {
      padding-bottom: 1rem;
    }
    form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem 1rem;
    }
    .full {
      grid-column: 1 / -1;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .error {
      margin-bottom: 1rem;
    }
    .table-wrapper {
      position: relative;
      overflow-x: auto;
    }
    .company {
      font-weight: 500;
    }
    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: var(--mat-sys-corner-full);
      font: var(--mat-sys-label-medium);
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface-variant);
    }
    .status-SENT {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .status-INTERVIEW {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .status-OFFER {
      background: #c8f0d2;
      color: #0b5223;
    }
    .status-REJECTED {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .row-actions {
      text-align: right;
      white-space: nowrap;
    }
    .delete {
      color: var(--mat-sys-error);
    }
    tr.editing {
      background: var(--mat-sys-primary-container);
    }
    .empty {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    @media (max-width: 600px) {
      .user,
      .logout-label {
        display: none;
      }
    }
  `,
})
export class ApplicationsPage implements OnInit {
  private api = inject(ApplicationsApi);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  auth = inject(AuthService);

  items = signal<Application[]>([]);
  editingId = signal<string | null>(null);
  error = signal<string | null>(null);
  statuses = Object.entries(STATUS_LABELS);
  labels = STATUS_LABELS;
  columns = ['company', 'position', 'status', 'appliedAt', 'actions'];
  trackById = (_: number, a: Application) => a._id;
  private formDir = viewChild.required(FormGroupDirective);

  form = this.fb.nonNullable.group({
    company: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', [Validators.required, Validators.minLength(2)]],
    offerUrl: [''],
    status: ['TO_APPLY'],
    appliedAt: [''],
    notes: [''],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.list().subscribe((items) => this.items.set(items));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set("L'entreprise et le poste sont obligatoires (2 caractères minimum).");
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      ...v,
      offerUrl: v.offerUrl || null,
      appliedAt: v.appliedAt || null,
      notes: v.notes || null,
    };
    const id = this.editingId();
    const call = id ? this.api.update(id, body) : this.api.create(body);
    call.subscribe({
      next: () => {
        this.cancel();
        this.load();
      },
      error: (e) => {
        const m = e.error?.message;
        this.error.set(Array.isArray(m) ? m.join(', ') : (m ?? 'Erreur inattendue'));
      },
    });
  }

  edit(a: Application) {
    this.editingId.set(a._id);
    this.error.set(null);
    this.form.setValue({
      company: a.company,
      position: a.position,
      offerUrl: a.offerUrl ?? '',
      status: a.status,
      appliedAt: a.appliedAt ? a.appliedAt.slice(0, 10) : '',
      notes: a.notes ?? '',
    });
  }

  remove(a: Application) {
    if (confirm(`Supprimer la candidature ${a.company} ?`)) {
      this.api.remove(a._id).subscribe(() => this.load());
    }
  }

  cancel() {
    this.editingId.set(null);
    this.error.set(null);
    // resetForm() remet aussi à zéro l'état « soumis » : sans cela, Material
    // afficherait les champs obligatoires vides en erreur après un ajout.
    this.formDir().resetForm();
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
