import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Ruta por defecto: redirigir al login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  // Módulo de Autenticación
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
      },
      {
        path: 'verify-otp',
        loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(m => m.VerifyOtpComponent)
      }
    ]
  },
  // Módulo de Paneles Protegidos
  {
    path: 'dashboard',
    children: [
      {
        path: 'student',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/student/student').then(m => m.StudentComponent)
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/admin/admin').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  // Cualquier otra ruta no encontrada redirige al login
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];