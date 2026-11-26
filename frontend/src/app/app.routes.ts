import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

// Pages chargées à la demande : Material n'alourdit pas le bundle initial.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login-page').then((m) => m.LoginPage) },
  {
    path: 'applications',
    loadComponent: () => import('./applications-page').then((m) => m.ApplicationsPage),
    canActivate: [authGuard],
  },
  { path: '', pathMatch: 'full', redirectTo: 'applications' },
  { path: '**', redirectTo: 'applications' },
];
