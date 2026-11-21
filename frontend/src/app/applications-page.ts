import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Application, ApplicationsApi, STATUS_LABELS } from './applications.api';

@Component({
  selector: 'app-applications-page',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <header>
      <h1>Mes candidatures</h1>
      <span>{{ auth.user()?.displayName }}</span>
      <button (click)="logout()">Se déconnecter</button>
    </header>

    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="company" placeholder="Entreprise *" />
      <input formControlName="position" placeholder="Poste *" />
      <input formControlName="offerUrl" placeholder="Lien de l'offre" />
      <select formControlName="status">
        @for (s of statuses; track s[0]) {
          <option [value]="s[0]">{{ s[1] }}</option>
        }
      </select>
      <input type="date" formControlName="appliedAt" />
      <textarea formControlName="notes" placeholder="Notes"></textarea>
      <button type="submit">{{ editingId() ? 'Enregistrer' : 'Ajouter' }}</button>
      @if (editingId()) {
        <button type="button" (click)="cancel()">Annuler</button>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </form>

    <table>
      <thead>
        <tr><th>Entreprise</th><th>Poste</th><th>Statut</th><th>Envoyée le</th><th></th></tr>
      </thead>
      <tbody>
        @for (a of items(); track a._id) {
          <tr>
            <td>{{ a.company }}</td>
            <td>{{ a.position }}</td>
            <td>{{ labels[a.status] }}</td>
            <td>{{ a.appliedAt | date: 'dd/MM/yyyy' }}</td>
            <td>
              <button (click)="edit(a)">Modifier</button>
              <button (click)="remove(a)">Supprimer</button>
            </td>
          </tr>
        } @empty {
          <tr><td colspan="5">Aucune candidature pour l'instant.</td></tr>
        }
      </tbody>
    </table>
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
    this.form.reset();
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}