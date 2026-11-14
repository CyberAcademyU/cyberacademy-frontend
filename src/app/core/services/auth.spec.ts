import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth';
import { PasswordTransportService } from './password-transport';
import { environment } from '../../../environments/environment';

const SEALED = { keyId: 'kid', clientPublicKey: 'client-key', data: 'cipher-text' };

describe('sesiones HttpOnly', () => {
  let auth: AuthService;
  let requests: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PasswordTransportService, useValue: { seal: () => Promise.resolve(SEALED), warmUp: () => undefined } }
      ]
    });
    auth = TestBed.inject(AuthService);
    requests = TestBed.inject(HttpTestingController);
  });
  afterEach(() => requests.verify());

  it('restaura usuario desde el servidor sin tokens en almacenamiento', async () => {
    const initialized = auth.initialize();
    const req = requests.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: { user: { id: '1', role: 'STUDENT' } } });
    await initialized;
    expect(auth.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('ca_access_token')).toBeNull();
    expect(localStorage.getItem('ca_user_data')).toBeNull();
  });

  it('comparte un único refresh entre peticiones concurrentes', async () => {
    const first = auth.refreshSession();
    const second = auth.refreshSession();
    expect(first).toBe(second);
    // Web Locks puede comenzar en el siguiente turno.
    await new Promise(resolve => setTimeout(resolve, 0));
    requests.expectOne(`${environment.apiUrl}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await new Promise(resolve => setTimeout(resolve, 0));
    const refresh = requests.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.get('X-Requested-With')).toBe('CyberAcademy');
    refresh.flush({ success: true });
    await Promise.all([first, second]);
  });

  it('envía la contraseña dentro del sobre cifrado y nunca en claro', async () => {
    const pending = firstValueFrom(auth.login({ email: 'test@example.com', password: 'secreto-123' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    const request = requests.expectOne(`${environment.apiUrl}/auth/login`);

    expect(request.request.body.password).toBeUndefined();
    expect(request.request.body.email).toBe('test@example.com');
    expect(request.request.body.sealedPassword).toEqual(SEALED);
    expect(JSON.stringify(request.request.body)).not.toContain('secreto-123');

    request.flush({ success: true, data: { user: { id: '1', role: 'STUDENT' } } });
    await pending;
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('cifra la nueva contraseña al restablecerla', async () => {
    const pending = firstValueFrom(auth.confirmPasswordReset('test@example.com', '123456', 'nueva-clave'));
    await new Promise(resolve => setTimeout(resolve, 0));
    const request = requests.expectOne(`${environment.apiUrl}/auth/password-reset/confirm`);

    expect(request.request.body.newPassword).toBeUndefined();
    expect(request.request.body.sealedNewPassword).toEqual(SEALED);
    expect(request.request.body.code).toBe('123456');

    request.flush({ success: true });
    await pending;
  });
});
