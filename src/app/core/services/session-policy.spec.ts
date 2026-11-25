import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth';
import { SessionPolicyService } from './session-policy';
import { environment } from '../../../environments/environment';

describe('sesión única y cierre sin avisos por inactividad', () => {
  const user = { id: 'student', role: 'STUDENT' };
  const auth = {
    currentUserSignal: signal<typeof user | null>(null),
    sessionVersion: signal(0),
    activeSessionId: signal<string | null>(null),
    sessionEnding: new Subject<void>(),
    logout: vi.fn(),
    handleUnauthorized: vi.fn(),
  };
  const router = { navigate: vi.fn() };
  let http: HttpTestingController;
  let service: SessionPolicyService;
  let hidden = false;
  const url = `${environment.apiUrl}/session`;
  const status = (remaining = 900000, sessionId = 'family-1') => ({
    data: { sessionId, userId: user.id, idleRemainingMillis: remaining },
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    auth.currentUserSignal.set(null);
    auth.sessionVersion.set(0);
    auth.activeSessionId.set(null);
    auth.logout.mockImplementation(() => {
      auth.sessionEnding.next();
      auth.currentUserSignal.set(null);
      auth.sessionVersion.update((v) => v + 1);
    });
    auth.handleUnauthorized.mockImplementation(() => {
      auth.sessionEnding.next();
      auth.currentUserSignal.set(null);
      auth.sessionVersion.update((v) => v + 1);
    });
    localStorage.removeItem('ca_session_activity');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SessionPolicyService);
    TestBed.tick();
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    http.verify({ ignoreCancelled: true });
    localStorage.removeItem('ca_session_activity');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  function login(remaining = 900000) {
    auth.currentUserSignal.set(user);
    TestBed.tick();
    http.expectOne(url).flush(status(remaining));
  }
  function activity() {
    (service as unknown as { recordActivity(): void }).recordActivity();
  }
  function shared(kind: 'activity' | 'logout', sessionId: string, at = Date.now()) {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'ca_session_activity',
        newValue: JSON.stringify({ kind, sessionId, at }),
      }),
    );
  }

  it('no consulta sin sesión ni usa polling como actividad', () => {
    vi.advanceTimersByTime(60000);
    http.expectNone(url);
    login();
    vi.advanceTimersByTime(30000);
    http.expectOne(url).flush(status(870000));
    http.expectNone(`${url}/activity`);
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('cierra a los quince minutos aunque continúen comprobaciones automáticas', () => {
    login();
    for (let elapsed = 30000; elapsed < 900000; elapsed += 30000) {
      vi.advanceTimersByTime(30000);
      http.expectOne(url).flush(status(900000 - elapsed));
    }
    vi.advanceTimersByTime(30000);
    expect(auth.logout).toHaveBeenCalledExactlyOnceWith('family-1');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('respeta el plazo restante del servidor al recargar, sin conceder otros quince minutos', () => {
    login(1000);
    vi.advanceTimersByTime(1000);
    expect(auth.logout).toHaveBeenCalledWith('family-1');
  });

  it('envía actividad real reciente y limita su frecuencia', () => {
    login();
    activity();
    vi.advanceTimersByTime(1000);
    const heartbeat = http.expectOne(`${url}/activity`);
    expect(heartbeat.request.body.ageMillis).toBe(1000);
    heartbeat.flush(status(899000));
    activity();
    vi.advanceTimersByTime(1000);
    http.expectNone(`${url}/activity`);
    vi.advanceTimersByTime(14000);
    http.expectOne(`${url}/activity`).flush(status(885000));
  });

  it('eventos sintéticos y foco no se consideran interacción humana', () => {
    login();
    document.dispatchEvent(new Event('pointermove'));
    document.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('focus'));
    http.expectOne(url).flush(status());
    vi.advanceTimersByTime(1000);
    http.expectNone(`${url}/activity`);
  });

  it('detecta el plazo vencido al regresar de una suspensión sin revivir la sesión', () => {
    login();
    hidden = true;
    vi.setSystemTime(Date.now() + 901000);
    hidden = false;
    window.dispatchEvent(new Event('focus'));
    expect(auth.logout).toHaveBeenCalledWith('family-1');
    http.expectNone(`${url}/activity`);
  });

  it('la actividad de otra pestaña mantiene el plazo local y no provoca un heartbeat falso', () => {
    login(1000);
    shared('activity', 'family-1');
    vi.advanceTimersByTime(1000);
    expect(auth.logout).not.toHaveBeenCalled();
    http.expectNone(`${url}/activity`);
  });

  it('un cierre de otra sesión no expulsa la actual; uno de la misma sí', () => {
    login();
    shared('logout', 'old-family');
    expect(auth.handleUnauthorized).not.toHaveBeenCalled();
    shared('logout', 'family-1');
    expect(auth.handleUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('al despertar lee la actividad de otra pestaña antes de decidir cerrar', () => {
    login();
    vi.setSystemTime(Date.now() + 901000);
    localStorage.setItem(
      'ca_session_activity',
      JSON.stringify({
        kind: 'activity',
        sessionId: 'family-1',
        at: Date.now() - 1000,
      }),
    );
    window.dispatchEvent(new Event('focus'));
    expect(auth.logout).not.toHaveBeenCalled();
    http.expectOne(url).flush(status(899000));
  });

  it('limpia timers y solicitudes al cerrar la sesión', () => {
    login();
    auth.currentUserSignal.set(null);
    auth.sessionVersion.update((v) => v + 1);
    TestBed.tick();
    vi.advanceTimersByTime(901000);
    http.expectNone(url);
    http.expectNone(`${url}/activity`);
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('una respuesta tardía de otra sesión no modifica la nueva', () => {
    auth.currentUserSignal.set(user);
    TestBed.tick();
    const old = http.expectOne(url);
    auth.sessionVersion.update((v) => v + 1);
    TestBed.tick();
    expect(old.cancelled).toBe(true);
    http.expectOne(url).flush(status(900000, 'new-family'));
    expect(auth.activeSessionId()).toBe('new-family');
  });
});
