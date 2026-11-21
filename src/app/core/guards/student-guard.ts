import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const studentGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialize();
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  return auth.isStudent() || router.createUrlTree(['/dashboard/admin']);
};
