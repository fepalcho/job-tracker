import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { LoginPage } from './login-page';
import { ApplicationsPage } from './applications-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'applications', component: ApplicationsPage, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'applications' },
  { path: '**', redirectTo: 'applications' },
];