import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth';
import { GoogleButtonComponent } from './google-button';

describe('GoogleButtonComponent', () => {
  let callback: (result: { credential: string }) => void;
  let renderedText: string;
  const auth = {
    googleChallenge: vi.fn(),
    googleLogin: vi.fn(),
    beginGoogleRegistration: vi.fn(),
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
        renderButton: (element: HTMLElement, options: { text: string }) => {
          renderedText = options.text;
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

  it('muestra Regístrate con Google en registro y configura signup_with', () => {
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.componentRef.setInput('signup', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Regístrate con Google');
    expect(renderedText).toBe('signup_with');
  });

  it('conserva Continuar con Google en inicio de sesión y vinculación', () => {
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Continuar con Google');
    expect(renderedText).toBe('continue_with');
  });

  it('abre el formulario de nombres al recibir 428 sin poner la credencial en la URL', () => {
    auth.googleLogin.mockReturnValue(throwError(() => ({ status: 428 })));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    callback({ credential: 'solo-en-memoria' });
    expect(auth.beginGoogleRegistration).toHaveBeenCalledWith('solo-en-memoria');
    expect(navigate).toHaveBeenCalledWith(['/auth/google-details']);
    expect(fixture.componentInstance.busy()).toBe(false);
    expect(fixture.componentInstance.message()).toBe('');
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
