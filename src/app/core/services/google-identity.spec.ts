import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth';
import { GoogleIdentity, GoogleIdentityService } from './google-identity';

describe('ciclo de vida global de Google Identity', () => {
  const challenge = vi.fn();
  const initialize = vi.fn();
  let service: GoogleIdentityService;
  const api: GoogleIdentity = { initialize, renderButton: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    challenge.mockReturnValue(of({ clientId: 'web', nonce: 'nonce' }));
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { googleChallenge: challenge } }],
    });
    service = TestBed.inject(GoogleIdentityService);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('reutiliza una configuración vigente entre componentes sin reinicializar GIS', () => {
    service.prepare(api).subscribe();
    service.prepare(api).subscribe();
    expect(challenge).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('deduplica solicitudes simultáneas del desafío', () => {
    const response = new Subject<{ clientId: string; nonce: string }>();
    challenge.mockReturnValue(response);
    service.prepare(api).subscribe();
    service.prepare(api).subscribe();
    expect(challenge).toHaveBeenCalledTimes(1);
    response.next({ clientId: 'web', nonce: 'new' });
    response.complete();
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('renueva antes de los diez minutos y descarta callbacks anteriores', () => {
    const receive = vi.fn();
    service.attach({}, receive);
    service.prepare(api).subscribe();
    const oldCallback = initialize.mock.calls[0][0].callback;
    vi.advanceTimersByTime(8 * 60000);
    expect(service.isFresh()).toBe(false);
    service.prepare(api).subscribe();
    oldCallback({ credential: 'old' });
    expect(receive).not.toHaveBeenCalled();
    initialize.mock.calls[1][0].callback({ credential: 'new' });
    expect(receive).toHaveBeenCalledWith('new');
  });

  it('no entrega resultados a un componente destruido', () => {
    const owner = {};
    const receive = vi.fn();
    service.attach(owner, receive);
    service.prepare(api).subscribe();
    service.detach(owner);
    initialize.mock.calls[0][0].callback({ credential: 'token' });
    expect(receive).not.toHaveBeenCalled();
  });

  it('una credencial consumida no deja un desafío reutilizable', () => {
    service.prepare(api).subscribe();
    service.invalidate();
    expect(service.isFresh()).toBe(false);
    service.prepare(api).subscribe();
    expect(challenge).toHaveBeenCalledTimes(2);
  });
});
