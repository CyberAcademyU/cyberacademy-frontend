import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../services/auth';
import { studentGuard } from './student-guard';

describe('bandeja solo para estudiantes', () => {
  const auth = { initialize: vi.fn(), isAuthenticated: vi.fn(), isStudent: vi.fn() };
  beforeEach(() => {
    auth.initialize.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });
  async function guard() {
    return TestBed.runInInjectionContext(() => studentGuard({} as never, {} as never));
  }
  it('permite estudiantes y redirige administradores a su panel', async () => {
    auth.isAuthenticated.mockReturnValue(true); auth.isStudent.mockReturnValue(true);
    expect(await guard()).toBe(true);
    auth.isStudent.mockReturnValue(false);
    expect(TestBed.inject(Router).serializeUrl(await guard() as never)).toBe('/dashboard/admin');
  });
  it('requiere una sesión autenticada', async () => {
    auth.isAuthenticated.mockReturnValue(false);
    expect(TestBed.inject(Router).serializeUrl(await guard() as never)).toBe('/auth/login');
  });
});
