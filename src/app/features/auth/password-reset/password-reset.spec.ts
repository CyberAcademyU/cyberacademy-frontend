import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth';
import { PasswordResetComponent } from './password-reset';

describe('PasswordResetComponent', () => {
  const auth = { requestPasswordReset: vi.fn(), confirmPasswordReset: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ imports: [PasswordResetComponent], providers: [
      provideRouter([]), { provide: AuthService, useValue: auth }
    ] });
  });

  it('solicita el código y muestra un mensaje genérico', () => {
    auth.requestPasswordReset.mockReturnValue(of({}));
    const component = TestBed.createComponent(PasswordResetComponent).componentInstance;
    component.requestForm.setValue({ email: 'test@example.com' });
    component.requestCode();
    expect(auth.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    expect(component.requested()).toBe(true);
    expect(component.notice()).toContain('Si la cuenta existe');
  });

  it('redirige al login después de actualizar la contraseña', () => {
    auth.confirmPasswordReset.mockReturnValue(of({}));
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(PasswordResetComponent).componentInstance;
    component.requestForm.setValue({ email: 'test@example.com' });
    component.confirmForm.setValue({ code: '123456', newPassword: 'nueva123', confirmPassword: 'nueva123' });
    component.confirm();
    expect(auth.confirmPasswordReset).toHaveBeenCalledWith('test@example.com', '123456', 'nueva123');
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], { state: { passwordChanged: true }, replaceUrl: true });
  });

  it('muestra el error si el código es inválido', () => {
    auth.confirmPasswordReset.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'Código inválido' } })));
    const component = TestBed.createComponent(PasswordResetComponent).componentInstance;
    component.requestForm.setValue({ email: 'test@example.com' });
    component.confirmForm.setValue({ code: '123456', newPassword: 'nueva123', confirmPassword: 'nueva123' });
    component.confirm();
    expect(component.error()).toBe('Código inválido');
  });
});
