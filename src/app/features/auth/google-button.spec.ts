import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
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
    auth.googleLogin.mockReturnValue(
      throwError(() => ({
        error: { message: 'Inicia sesión con tu contraseña y vincula Google desde tu perfil.' },
      })),
    );
    Object.defineProperty(window, 'google', {
      configurable: true,
      value: {
        accounts: {
          id: {
            initialize: (config: { callback: typeof callback }) => {
              callback = config.callback;
            },
            renderButton: (element: HTMLElement, options: { text: string }) => {
              renderedText = options.text;
              element.replaceChildren(document.createElement('iframe'));
            },
          },
        },
      },
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
    vi.restoreAllMocks();
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

  it('renueva tras inactividad sin recargar la página', () => {
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(11 * 60000);
    window.dispatchEvent(new Event('focus'));
    expect(auth.googleChallenge.mock.calls.length).toBeGreaterThan(1);
    callback({ credential: 'nuevo-token' });
    expect(auth.googleLogin).toHaveBeenCalledWith('nuevo-token', false);
  });

  it('pausa la renovación en una pestaña oculta y renueva al volver', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    hidden.mockReturnValue(true);
    vi.advanceTimersByTime(12 * 60000);
    expect(auth.googleChallenge).toHaveBeenCalledTimes(1);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(auth.googleChallenge).toHaveBeenCalledTimes(2);
  });

  it('no rota el nonce mientras una credencial se está validando', () => {
    const response = new Subject();
    auth.googleLogin.mockReturnValue(response);
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    callback({ credential: 'validando' });
    vi.advanceTimersByTime(12 * 60000);
    window.dispatchEvent(new Event('focus'));
    expect(auth.googleChallenge).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.busy()).toBe(true);
  });

  it('conserva la confirmación de vinculación durante tres segundos', () => {
    auth.googleLogin.mockReturnValue(of({ data: { user: { role: 'STUDENT' } } }));
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.componentRef.setInput('link', true);
    fixture.detectChanges();
    const succeeded = vi.fn();
    const linked = vi.fn();
    fixture.componentInstance.linkSucceeded.subscribe(succeeded);
    fixture.componentInstance.linked.subscribe(linked);
    callback({ credential: 'vincular' });
    expect(auth.googleLogin).toHaveBeenCalledWith('vincular', true);
    expect(succeeded).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.justLinked()).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(linked).toHaveBeenCalledTimes(1);
    expect(auth.googleChallenge).toHaveBeenCalledTimes(1);
  });

  it('un 401 renueva el desafío pero nunca reenvía la credencial vieja', () => {
    auth.googleLogin.mockReturnValue(throwError(() => ({ status: 401 })));
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    const stale = callback;
    callback({ credential: 'caducado' });
    expect(auth.googleChallenge).toHaveBeenCalledTimes(2);
    expect(auth.googleLogin).toHaveBeenCalledTimes(1);
    stale({ credential: 'caducado' });
    expect(auth.googleLogin).toHaveBeenCalledTimes(1);
    callback({ credential: 'nuevo' });
    expect(auth.googleLogin).toHaveBeenCalledTimes(2);
  });

  it('cambiar de registro a login reutiliza GIS y el callback apunta al botón actual', () => {
    const first = TestBed.createComponent(GoogleButtonComponent);
    first.detectChanges();
    first.destroy();
    const second = TestBed.createComponent(GoogleButtonComponent);
    second.detectChanges();
    expect(auth.googleChallenge).toHaveBeenCalledTimes(1);
    callback({ credential: 'token' });
    expect(auth.googleLogin).toHaveBeenCalledTimes(1);
  });

  it('no renueva mientras se completa el registro con nombres', () => {
    auth.googleLogin.mockReturnValue(throwError(() => ({ status: 428 })));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    callback({ credential: 'pendiente' });
    fixture.destroy();
    vi.advanceTimersByTime(11 * 60000);
    expect(auth.googleChallenge).toHaveBeenCalledTimes(1);
    expect(auth.beginGoogleRegistration).toHaveBeenCalledWith('pendiente');
  });

  it('permite reintentar si falla la preparación inicial y libera los temporizadores', () => {
    auth.googleChallenge.mockReturnValueOnce(throwError(() => ({ status: 0 })));
    const fixture = TestBed.createComponent(GoogleButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar conexión con Google');
    fixture.componentInstance.prepare();
    expect(auth.googleChallenge).toHaveBeenCalledTimes(2);
    fixture.destroy();
    vi.advanceTimersByTime(11 * 60000);
    window.dispatchEvent(new Event('focus'));
    expect(auth.googleChallenge).toHaveBeenCalledTimes(2);
  });
});
