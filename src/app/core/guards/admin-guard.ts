import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { ProfileService } from '../services/profile';

/** A dónde regresa quien no es administrador. */
export const STUDENT_DASHBOARD_URL = '/dashboard/student';

/**
 * Protege el panel administrativo.
 *
 * El rol guardado en localStorage solo es orientación (UX): un usuario puede
 * manipularlo localmente o quedarse desactualizado si el ADMIN le cambia el
 * rol. Este guard revalida el rol real contra el servidor (GET /profile)
 * cuando el rol local no coincide con ADMIN y sincroniza el valor local.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Sin sesión: mismo comportamiento que authGuard
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  // 2. Con rol ADMIN guardado y sesión vigente: entrar directo
  if (authService.isAdmin()) {
    return true;
  }

  // 3. El rol local no es ADMIN: preguntar al servidor antes de mostrar el panel.
  //    El token sigue siendo necesario; si caducó, el interceptor limpia la sesión.
  try {
    const response = await firstValueFrom(inject(ProfileService).load());
    const role = response.data?.role;
    if (role && authService.currentUserSignal()?.email === response.data?.email) {
      authService.syncUserRole(role);
    }
    if (role === 'ADMIN') {
      return true;
    }
  } catch {
    // 403/401 o red caída: no es admin a efectos de la UI (el backend protege los datos)
  }

  return router.createUrlTree([STUDENT_DASHBOARD_URL]);
};
