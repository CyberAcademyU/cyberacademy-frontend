import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GoogleDetailsComponent } from './google-details';
import { AuthService } from '../../../core/services/auth';

describe('confirmación de nombres en registro Google', () => {
  const auth = {
    hasPendingGoogleRegistration: vi.fn(),
    completeGoogleRegistration: vi.fn(),
    cancelGoogleRegistration: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    auth.hasPendingGoogleRegistration.mockReturnValue(true);
    auth.completeGoogleRegistration.mockReturnValue(of({ data: { user: { role: 'STUDENT' } } }));
    TestBed.configureTestingModule({
      imports: [GoogleDetailsComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('pide ambos nombres vacíos y rechaza espacios sin crear cuenta', () => {
    const fixture = TestBed.createComponent(GoogleDetailsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ firstName: '', lastName: '' });
    fixture.componentInstance.form.setValue({ firstName: '  ', lastName: 'Pérez' });
    fixture.componentInstance.submit();
    expect(auth.completeGoogleRegistration).not.toHaveBeenCalled();
  });

  it('confirma los nombres escritos y entra al panel solo tras el éxito', () => {
    const fixture = TestBed.createComponent(GoogleDetailsComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ firstName: '  María José  ', lastName: '  Pérez Díaz  ' });
    fixture.componentInstance.submit();
    expect(auth.completeGoogleRegistration).toHaveBeenCalledWith('María José', 'Pérez Díaz');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/dashboard/student']);
  });

  it('redirige al registro si se recarga sin credencial pendiente', () => {
    auth.hasPendingGoogleRegistration.mockReturnValue(false);
    const fixture = TestBed.createComponent(GoogleDetailsComponent);
    fixture.detectChanges();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/register'], { replaceUrl: true });
  });

  it('caducidad obliga a elegir Google otra vez sin crear cuenta', () => {
    auth.completeGoogleRegistration.mockReturnValue(throwError(() => ({ status: 401 })));
    const fixture = TestBed.createComponent(GoogleDetailsComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ firstName: 'María', lastName: 'Pérez' });
    fixture.componentInstance.submit();
    expect(auth.cancelGoogleRegistration).toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('caducó');
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('borra la credencial al abandonar la pantalla', () => {
    const fixture = TestBed.createComponent(GoogleDetailsComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(auth.cancelGoogleRegistration).toHaveBeenCalled();
  });
});
