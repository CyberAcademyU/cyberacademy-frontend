import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Espera a que el servidor confirme la sesión por cookie (no hay token legible en JS).
  await authService.initialize();

  if (authService.isAuthenticated()) {
    return true;
  }

  // No autenticado: redirigir al login
  return router.createUrlTree(['/auth/login']);
};
