import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const auth = { isAuthenticated: () => false, tokenSignal: () => null, handleUnauthorized: vi.fn() };
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

  it('sigue cerrando la sesión ante un 401 en una petición protegida', () => {
    http.get(`${environment.apiUrl}/profile`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/profile`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.handleUnauthorized).toHaveBeenCalledOnce();
  });
});
