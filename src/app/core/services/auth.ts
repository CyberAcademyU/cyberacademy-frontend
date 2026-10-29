import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap, finalize, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base apuntando a Spring Boot
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'ca_access_token';
  private readonly USER_KEY = 'ca_user_data';
  private readonly EXPIRY_KEY = 'ca_token_expiry';
  private expiryTimer?: ReturnType<typeof setTimeout>;
  readonly sessionEnding = new Subject<void>();

  // Signals reactivos de Angular 18+
  currentUserSignal = signal<User | null>(this.getStoredUser());
  tokenSignal = signal<string | null>(this.getStoredToken());

  isAuthenticated = () => !!this.tokenSignal() && Number(localStorage.getItem(this.EXPIRY_KEY)) > Date.now();
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');
  isStudent = computed(() => this.currentUserSignal()?.role === 'STUDENT');

  constructor(private http: HttpClient, private router: Router) {
    if (this.tokenSignal()) this.scheduleExpiry(Number(localStorage.getItem(this.EXPIRY_KEY)));
  }

  register(data: RegisterRequest): Observable<ApiResponse<{ email: string }>> {
    // El rol nunca se envía desde el cliente: el backend fuerza 'STUDENT'
    return this.http.post<ApiResponse<{ email: string }>>(`${this.apiUrl}/auth/register`, data);
  }

  verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<{ verified: boolean }>> {
    return this.http.post<ApiResponse<{ verified: boolean }>>(`${this.apiUrl}/auth/verify-otp`, data);
  }

  resendOtp(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/resend-otp`, { email });
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    this.sessionEnding.next();
    if (!this.tokenSignal()) { this.clearSession(); return; }
    this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      timeout(10000), finalize(() => this.clearSession())
    ).subscribe({ error: () => console.warn('No se pudo revocar la sesión en el servidor') });
  }

  handleUnauthorized(): void {
    this.clearSession();
    void this.router.navigate(['/auth/login']);
  }

  clearSession(): void {
    this.sessionEnding.next();
    clearTimeout(this.expiryTimer);
    localStorage.removeItem(this.EXPIRY_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private setSession(authData: AuthResponse): void {
    const payload = authData.token.split('.')[1];
    let expiry = 0;
    try { expiry = Number(JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).exp) * 1000; } catch { /* Invalid token: do not retain a session. */ }
    localStorage.setItem(this.EXPIRY_KEY, String(expiry));
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    this.tokenSignal.set(authData.token);
    this.currentUserSignal.set(authData.user);
    this.scheduleExpiry(expiry);
  }

  private scheduleExpiry(expiry: number): void {
    clearTimeout(this.expiryTimer);
    if (!expiry || expiry <= Date.now()) { this.clearSession(); return; }
    this.expiryTimer = setTimeout(() => this.scheduleExpiry(expiry), Math.min(expiry - Date.now(), 2147483647));
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}