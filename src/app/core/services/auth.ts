import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, tap, finalize, timeout, firstValueFrom, from, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { PasswordTransportService, sealPasswords } from './password-transport';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly sessionHttp: HttpClient;
  private readonly transport = inject(PasswordTransportService);
  private refreshPending?: Promise<void>;
  private readonly cookieOptions = { withCredentials: true, headers: { 'X-Requested-With': 'CyberAcademy' } };
  private ready?: Promise<void>;
  readonly sessionEnding = new Subject<void>();
  readonly currentUserSignal = signal<User | null>(null);
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  readonly isStudent = computed(() => this.currentUserSignal()?.role === 'STUDENT');
  isAuthenticated = () => this.currentUserSignal() !== null;

  constructor(private http: HttpClient, backend: HttpBackend, private router: Router) {
    this.sessionHttp = new HttpClient(backend);
    // Migración: eliminar datos heredados; nunca leer ni conservar el JWT anterior.
    for (const key of ['ca_access_token', 'ca_token_expiry', 'ca_user_data']) {
      try { localStorage.removeItem(key); } catch { /* almacenamiento no disponible */ }
    }
  }

  /** Idempotente: la app lo lanza al arrancar y los guards esperan la misma promesa. */
  initialize(): Promise<void> {
    this.ready ??= this.restoreSession();
    return this.ready;
  }

  private async restoreSession(): Promise<void> {
    try {
      await this.loadSession();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        try { await this.refreshSession(); await this.loadSession(); } catch { this.clearSession(); }
      }
    }
  }

  private async loadSession(): Promise<void> {
    const response = await firstValueFrom(this.sessionHttp.get<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/me`, this.cookieOptions).pipe(timeout(15000)));
    this.currentUserSignal.set(response.data?.user ?? null);
  }

  refreshSession(): Promise<void> {
    if (!this.refreshPending) {
      const refresh = async () => {
        // Otra pestaña pudo renovar mientras esperábamos el lock.
        try { await this.loadSession(); return; } catch (error) {
          if (!(error instanceof HttpErrorResponse) || error.status !== 401) throw error;
        }
        await firstValueFrom(this.sessionHttp.post(`${this.apiUrl}/auth/refresh`, {}, this.cookieOptions).pipe(timeout(15000)));
      };
      // Serializar entre pestañas evita reuso accidental de refresh tokens rotados.
      this.refreshPending = (navigator.locks
        ? navigator.locks.request('cyberacademy-session-refresh', refresh)
        : refresh()).finally(() => { this.refreshPending = undefined; });
    }
    return this.refreshPending;
  }

  register(data: RegisterRequest): Observable<ApiResponse<{ email: string }>> {
    return this.http.post<ApiResponse<{ email: string }>>(`${this.apiUrl}/auth/register`, data);
  }
  verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<{ verified: boolean }>> {
    return from(sealPasswords(this.transport, data, { password: 'sealedPassword' })).pipe(
      switchMap(body => this.http.post<ApiResponse<{ verified: boolean }>>(`${this.apiUrl}/auth/verify-otp`, body))
    );
  }
  resendOtp(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/resend-otp`, { email });
  }
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return from(sealPasswords(this.transport, credentials, { password: 'sealedPassword' })).pipe(
      switchMap(body => this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, body)),
      tap(response => { if (response.data) this.currentUserSignal.set(response.data.user); }));
  }
  requestPasswordReset(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/password-reset/request`, { email });
  }
  confirmPasswordReset(email: string, code: string, newPassword: string): Observable<ApiResponse<void>> {
    return from(sealPasswords(this.transport, { email, code, newPassword }, { newPassword: 'sealedNewPassword' })).pipe(
      switchMap(body => this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/password-reset/confirm`, body))
    );
  }
  logout(): void {
    this.sessionEnding.next();
    this.http.post(`${this.apiUrl}/auth/refresh/logout`, {}).pipe(
      timeout(10000), finalize(() => this.clearSession())
    ).subscribe({ error: () => console.warn('No se pudo revocar la sesión en el servidor') });
  }
  handleUnauthorized(): void {
    this.clearSession();
    void this.router.navigate(['/']);
  }
  syncUserRole(role: User['role']): void {
    const current = this.currentUserSignal();
    if (current) this.currentUserSignal.set({ ...current, role });
  }
  clearSession(): void {
    this.sessionEnding.next();
    this.currentUserSignal.set(null);
  }
}
