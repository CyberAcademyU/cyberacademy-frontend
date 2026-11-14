import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const auth = { refreshSession: vi.fn(), handleUnauthorized: vi.fn() };
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: auth }
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('deja que el formulario gestione las credenciales incorrectas', () => {
    const errorHandler = vi.fn();
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: errorHandler });
    requests.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { message: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' }
    );
    expect(auth.handleUnauthorized).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledOnce();
  });

  it('cierra la sesión si el refresh también responde 401', async () => {
    auth.refreshSession.mockRejectedValue(new HttpErrorResponse({ status: 401 }));
    http.get(`${environment.apiUrl}/profile`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/profile`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(auth.handleUnauthorized).toHaveBeenCalledOnce();
  });

  it('envía cookies y protección CSRF solo a la API propia', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
    const own = requests.expectOne(`${environment.apiUrl}/auth/login`);
    expect(own.request.withCredentials).toBe(true);
    expect(own.request.headers.get('X-Requested-With')).toBe('CyberAcademy');
    expect(own.request.headers.has('Authorization')).toBe(false);
    own.flush({});
    http.get('https://example.com/resource').subscribe();
    const external = requests.expectOne('https://example.com/resource');
    expect(external.request.withCredentials).toBe(false);
    expect(external.request.headers.has('X-Requested-With')).toBe(false);
    external.flush({});
  });

  it('renueva y reintenta una sola vez ante un 401', async () => {
    auth.refreshSession.mockResolvedValue(undefined);
    http.get(`${environment.apiUrl}/profile`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/profile`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await new Promise(resolve => setTimeout(resolve, 0));
    requests.expectOne(`${environment.apiUrl}/profile`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.refreshSession).toHaveBeenCalledOnce();
    expect(auth.handleUnauthorized).toHaveBeenCalledOnce();
  });
});
