import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth';
import { ProfileService } from '../../core/services/profile';
import { PasswordFormComponent } from './password-form';

describe('PasswordFormComponent', () => {
  const auth = { currentUserSignal: () => ({ email: 'test@example.com' }), clearSession: vi.fn() };
  const profile = { changePassword: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [PasswordFormComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ProfileService, useValue: profile },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  function fillForm() {
    const fixture = TestBed.createComponent(PasswordFormComponent);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[formControlName]') as NodeListOf<HTMLInputElement>;
    ['actual123', 'nueva123', 'nueva123'].forEach((value, index) => {
      inputs[index].value = value;
      inputs[index].dispatchEvent(new Event('input'));
    });
    return fixture;
  }

  it('cierra la sesión y redirige al login después del cambio', () => {
    profile.changePassword.mockReturnValue(of({}));
    const fixture = fillForm();
    fixture.componentInstance.submit();

    expect(profile.changePassword).toHaveBeenCalledWith({ currentPassword: 'actual123', newPassword: 'nueva123' });
    expect(auth.clearSession).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { state: { passwordChanged: true }, replaceUrl: true });
  });

  it('mantiene la sesión y muestra el error si falla el cambio', () => {
    profile.changePassword.mockReturnValue(throwError(() => ({ error: { message: 'Contraseña incorrecta' } })));
    const fixture = fillForm();
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Contraseña incorrecta');
  });
});
