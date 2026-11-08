import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { of, Observable } from 'rxjs';
import { AuthService } from '../services/auth';
import { ProfileService } from '../services/profile';
import { ApiResponse } from '../models/user.model';
import { adminGuard, STUDENT_DASHBOARD_URL } from './admin-guard';

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/dashboard/admin' } as RouterStateSnapshot;

/** Genera la respuesta que devolvería GET /profile en el guard. */
function profileResponse(role: 'STUDENT' | 'ADMIN'): ApiResponse<{ role: 'STUDENT' | 'ADMIN'; email: string }> {
  return { success: true, message: 'Perfil obtenido', data: { role, email: 'test@cyberacademy.com' }, timestamp: new Date().toISOString() };
}

describe('adminGuard', () => {
  describe('sin sesión', () => {
    it('redirige al login', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: { isAuthenticated: () => false, isAdmin: () => false } },
          { provide: ProfileService, useValue: { load: () => of(profileResponse('ADMIN')) } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toEqual('/auth/login');
    });
  });

  describe('con sesión y rol ADMIN guardado', () => {
    it('permite el acceso sin consultar el servidor', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          {
            provide: AuthService,
            useValue: {
              isAuthenticated: () => true,
              isAdmin: () => true,
              currentUserSignal: () => ({ email: 'test@cyberacademy.com' }),
              syncUserRole: () => undefined,
            },
          },
          { provide: ProfileService, useValue: { load: () => of(profileResponse('ADMIN')) } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result).toBe(true);
    });
  });

  describe('con sesión y rol STUDENT guardado', () => {
    function studentLocally(): object {
      return {
        isAuthenticated: () => true,
        isAdmin: () => false,
        currentUserSignal: () => ({ email: 'test@cyberacademy.com' }),
        syncUserRole: () => undefined,
      };
    }

    it('devuelta al panel de estudiante cuando el servidor confirma STUDENT', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: studentLocally() },
          { provide: ProfileService, useValue: { load: () => of(profileResponse('STUDENT')) } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toEqual(STUDENT_DASHBOARD_URL);
    });

    it('permite el acceso cuando el servidor confirma ADMIN (rol local desactualizado)', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: studentLocally() },
          { provide: ProfileService, useValue: { load: () => of(profileResponse('ADMIN')) } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result).toBe(true);
    });

    it('devuelta al panel de estudiante si GET /profile falla', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: studentLocally() },
          { provide: ProfileService, useValue: { load: () => new Observable(subscriber => subscriber.error(new Error('falla red'))) } },
        ],
      });
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toEqual(STUDENT_DASHBOARD_URL);
    });
  });
});
