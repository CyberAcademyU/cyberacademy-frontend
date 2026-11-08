import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('oculta el error de credenciales después de cinco segundos', () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(TestBed.inject(AuthService), 'login').mockReturnValue(
        throwError(() => ({ status: 401, error: { message: 'Correo o contraseña incorrectos.' } }))
      );
      component.loginForm.setValue({ email: 'test@example.com', password: 'incorrecta' });
      component.onLoginSubmit();
      expect(component.loginError()).toBe('Correo o contraseña incorrectos.');
      vi.advanceTimersByTime(5000);
      expect(component.loginError()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
