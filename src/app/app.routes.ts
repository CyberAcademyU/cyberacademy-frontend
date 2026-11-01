import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Páginas públicas: portada y catálogo de módulos
  {
    path: '',
    pathMatch: 'full',
    title: 'CyberAcademy · Aprende ciberseguridad',
    loadComponent: () => import('./features/landing/intro').then(m => m.IntroComponent)
  },
  {
    path: 'explorar',
    title: 'Módulos · CyberAcademy',
    loadComponent: () => import('./features/landing/explore').then(m => m.ExploreComponent)
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
        path: 'leaderboard',
        canActivate: [authGuard],
        title: 'Clasificación · CyberAcademy',
        loadComponent: () => import('./features/leaderboard/leaderboard').then(m => m.LeaderboardComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        title: 'Mi perfil · CyberAcademy',
        loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent)
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/admin/admin').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  // Cualquier otra ruta no encontrada vuelve a la portada
  {
    path: '**',
    redirectTo: ''
  }
];