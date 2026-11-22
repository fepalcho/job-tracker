import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  template: `
    <main class="login">
      <h1>Suivi de candidatures</h1>
      <p>Démo portfolio : connecte-toi avec Google pour tester.</p>
      <button (click)="login()">Se connecter avec Google</button>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </main>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  error = signal<string | null>(null);

  async login() {
    try {
      await this.auth.login();
      await this.router.navigate(['/applications']);
    } catch (e: unknown) {
      console.error(e);
      const err = e as { code?: string; message?: string } | null | undefined;
      this.error.set('Connexion impossible : ' + (err?.code ?? err?.message ?? e));
    }
  }
}
