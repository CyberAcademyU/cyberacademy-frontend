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
 * El rol en memoria solo orienta la interfaz. Se obtiene de /auth/me al arrancar;
 * el backend valida el rol actual de la BD en cada petición protegida.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // inject() debe ejecutarse antes del primer await: el contexto de inyección no sobrevive.
  const profileService = inject(ProfileService);

  // 1. Esperar la restauración de sesión y comprobar autenticación
  await authService.initialize();
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  // 2. Con rol ADMIN guardado y sesión vigente: entrar directo
  if (authService.isAdmin()) {
    return true;
  }

  // 3. El rol local no es ADMIN: preguntar al servidor antes de mostrar el panel.
  //    Si la sesión caducó, el interceptor intenta renovarla y, si falla, limpia la sesión.
  try {
    const response = await firstValueFrom(profileService.load());
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
