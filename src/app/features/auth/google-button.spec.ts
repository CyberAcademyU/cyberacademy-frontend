import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth';
import { GoogleButtonComponent } from './google-button';

describe('GoogleButtonComponent', () => {
  let callback: (result: { credential: string }) => void;
  const auth = {
    googleChallenge: vi.fn(),
    googleLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    auth.googleChallenge.mockReturnValue(of({ clientId: 'web', nonce: 'nonce' }));
    auth.googleLogin.mockReturnValue(throwError(() => ({
      error: { message: 'Inicia sesión con tu contraseña y vincula Google desde tu perfil.' },
    })));
    Object.defineProperty(window, 'google', {
      configurable: true,
      value: { accounts: { id: {
        initialize: (config: { callback: typeof callback }) => { callback = config.callback; },
        renderButton: (element: HTMLElement) => {
          element.replaceChildren(document.createElement('iframe'));
        },
      } } },
    });
    TestBed.configureTestingModule({
      imports: [GoogleButtonComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    Reflect.deleteProperty(window, 'google');
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('mantiene una sola capa invisible confinada al botón', () => {
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    const slots = fixture.nativeElement.querySelectorAll('.google-slot');
    expect(slots.length).toBe(1);
    expect(slots[0].parentElement.classList.contains('google-wrap')).toBe(true);
  });

  it('oculta el error a los 3 segundos y conserva Google para otro intento', () => {
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    callback({ credential: 'token' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Inicia sesión con tu contraseña');
    expect(fixture.nativeElement.textContent).not.toContain('Reintentar con Google');
    expect(fixture.nativeElement.querySelector('.google-slot iframe')).not.toBeNull();
    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    expect(fixture.componentInstance.message()).toBe('');
    callback({ credential: 'otro-token' });
    expect(auth.googleLogin).toHaveBeenCalledTimes(2);
  });
});
