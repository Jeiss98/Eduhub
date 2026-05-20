import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'admin', component: Admin },
  { path: '**', redirectTo: '' }
];
