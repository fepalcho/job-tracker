import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <main class="login">
      <mat-card appearance="outlined" class="login-card">
        <mat-card-content>
          <div class="logo" aria-hidden="true">
            <mat-icon>work_history</mat-icon>
          </div>
          <h1>Suivi de candidatures</h1>
          <p class="intro">Démo portfolio : connecte-toi avec Google pour tester.</p>
          <button matButton="filled" class="login-button" (click)="login()">
            <mat-icon>login</mat-icon>
            Se connecter avec Google
          </button>
          @if (error()) {
            <p class="error" role="alert">
              <mat-icon>error</mat-icon>
              {{ error() }}
            </p>
          }
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .login {
      min-height: 100%;
      display: grid;
      place-items: center;
      padding: 1rem;
      box-sizing: border-box;
      background: linear-gradient(
        160deg,
        var(--mat-sys-primary-container) 0%,
        var(--mat-sys-surface-container-low) 60%
      );
    }
    .login-card {
      width: min(100%, 420px);
      text-align: center;
    }
    mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2.5rem 2rem 2rem;
    }
    .logo {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .logo mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
      color: var(--mat-sys-on-surface);
    }
    .intro {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .login-button {
      width: 100%;
      margin-top: 0.5rem;
    }
    .error {
      width: 100%;
      box-sizing: border-box;
      text-align: left;
    }
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
