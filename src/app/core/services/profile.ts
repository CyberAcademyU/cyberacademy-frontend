import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  ChangePasswordRequest,
  Leaderboard,
  LeaderboardPeriod,
  Profile,
  UpdateProfileRequest
} from '../models/profile.model';
import { AuthService } from './auth';
import { PasswordTransportService, sealPasswords } from './password-transport';

/** Perfil, XP, liga e insignias del usuario autenticado, y la clasificación. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly transport = inject(PasswordTransportService);

  /** Último perfil recibido: lo comparten la cabecera, el panel y la página de perfil. */
  readonly profile = signal<Profile | null>(null);

  constructor() {
    // Al cerrar sesión no debe quedar el perfil de otra persona en memoria
    inject(AuthService).sessionEnding.subscribe(() => this.profile.set(null));
  }

  private refreshing = false;

  /** Recarga en segundo plano (XP, liga, insignias). Ignora llamadas mientras hay una en curso. */
  refresh(): void {
    if (this.refreshing) return;
    this.refreshing = true;
    this.load().subscribe({
      complete: () => (this.refreshing = false),
      error: () => (this.refreshing = false)
    });
  }

  load(): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.apiUrl}/profile`).pipe(
      tap(res => this.profile.set(res.data ?? null))
    );
  }

  update(data: UpdateProfileRequest): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(`${this.apiUrl}/profile`, data).pipe(
      tap(res => this.profile.set(res.data ?? null))
    );
  }

  /** Tras el cambio el backend invalida todas las sesiones, incluida esta. */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return from(sealPasswords(this.transport, data, {
      currentPassword: 'sealedCurrentPassword',
      newPassword: 'sealedNewPassword'
    })).pipe(
      switchMap(body => this.http.put<ApiResponse<void>>(`${this.apiUrl}/profile/password`, body))
    );
  }

  getLeaderboard(period: LeaderboardPeriod): Observable<ApiResponse<Leaderboard>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<Leaderboard>>(`${this.apiUrl}/leaderboard`, { params });
  }
}
