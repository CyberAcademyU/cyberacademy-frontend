import { DestroyRef, Injectable, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, takeUntil, timeout } from 'rxjs';
import { AuthService } from './auth';
import { ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface SessionStatus {
  sessionId: string;
  userId: string;
  idleRemainingMillis: number;
}
interface SessionEvent {
  sessionId: string;
  at: number;
  kind: 'activity' | 'logout';
}

/** Interacción humana únicamente: las consultas automáticas no mantienen la sesión. */
@Injectable({ providedIn: 'root' })
export class SessionPolicyService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly idleMillis = 15 * 60000;
  private readonly key = 'ca_session_activity';
  private readonly userId = computed(() => this.auth.currentUserSignal()?.id ?? null);
  private lastActivity = 0;
  private dirty = false;
  private sessionId: string | null = null;
  private channel?: BroadcastChannel;
  private broadcastTimer?: ReturnType<typeof setTimeout>;
  private publish?: (event: SessionEvent) => void;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('cyberacademy-session-policy');
      this.destroy.onDestroy(() => this.channel?.close());
    }
    effect((onCleanup) => {
      const userId = this.userId();
      const version = this.auth.sessionVersion();
      this.sessionId = null;
      this.lastActivity = 0;
      this.dirty = false;
      if (!userId) return;
      // Límite local también si la primera comprobación de red no responde.
      this.lastActivity = Date.now();
      const stop = new Subject<void>();
      let inFlight = false;
      let lastCheck = 0;
      let lastActivitySent = 0;
      const valid = () =>
        version === this.auth.sessionVersion() && this.auth.currentUserSignal()?.id === userId;

      const publish = (event: SessionEvent) => {
        this.channel?.postMessage(event);
        try {
          localStorage.setItem(this.key, JSON.stringify(event));
        } catch {
          /* canal o sesión local */
        }
      };
      this.publish = publish;
      const receive = (event: unknown) => {
        if (!valid() || !event || typeof event !== 'object') return;
        const value = event as SessionEvent;
        if (value.sessionId !== this.sessionId) return;
        if (value.kind === 'logout') {
          this.auth.handleUnauthorized();
          return;
        }
        if (
          value.kind === 'activity' &&
          Number.isFinite(value.at) &&
          value.at <= Date.now() &&
          value.at > this.lastActivity
        )
          this.lastActivity = value.at;
      };
      const storage = (event: StorageEvent) => {
        if (event.key !== this.key || !event.newValue) return;
        try {
          receive(JSON.parse(event.newValue));
        } catch {
          /* datos ajenos o inválidos */
        }
      };
      const channelMessage = (event: MessageEvent) => receive(event.data);
      const readShared = () => {
        try {
          const stored = localStorage.getItem(this.key);
          if (stored) receive(JSON.parse(stored));
        } catch {
          /* almacenamiento no disponible */
        }
      };
      const sessionEnded = this.auth.sessionEnding.subscribe(() => {
        if (this.sessionId) publish({ sessionId: this.sessionId, at: Date.now(), kind: 'logout' });
      });

      const check = () => {
        if (!valid()) return;
        // Una pestaña suspendida puede no haber recibido los eventos de otra pestaña.
        if (Date.now() - this.lastActivity >= this.idleMillis) readShared();
        if (!valid()) return;
        if (this.lastActivity && Date.now() - this.lastActivity >= this.idleMillis) {
          const id = this.sessionId;
          if (id) {
            this.auth.logout(id);
            void this.router.navigate(['/auth/login']);
          } else this.auth.handleUnauthorized();
          return;
        }
        if (document.hidden || inFlight) return;
        if (Date.now() - this.lastActivity > 60000) this.dirty = false;
        const activity = this.dirty && !!this.sessionId;
        if (activity && Date.now() - lastActivitySent < 15000) return;
        if (!activity && this.sessionId && Date.now() - lastCheck < 30000) return;
        inFlight = true;
        lastCheck = Date.now();
        const sentAt = Date.now();
        const activityAt = this.lastActivity;
        if (activity) lastActivitySent = sentAt;
        const request = activity
          ? this.http.post<ApiResponse<SessionStatus>>(`${environment.apiUrl}/session/activity`, {
              ageMillis: Math.min(60000, Math.max(0, sentAt - activityAt)),
            })
          : this.http.get<ApiResponse<SessionStatus>>(`${environment.apiUrl}/session`);
        request.pipe(timeout(15000), takeUntil(stop)).subscribe({
          next: (res) => {
            inFlight = false;
            if (!valid() || !res.data) return;
            const status = res.data;
            if (status.userId !== userId) {
              this.auth.handleUnauthorized();
              return;
            }
            const changed = this.sessionId !== status.sessionId;
            const unchanged = this.lastActivity <= activityAt;
            this.sessionId = status.sessionId;
            this.auth.activeSessionId.set(status.sessionId);
            const serverActivity = sentAt + status.idleRemainingMillis - this.idleMillis;
            this.lastActivity = changed
              ? serverActivity
              : Math.max(this.lastActivity, serverActivity);
            if (activity && unchanged) this.dirty = false;
            if (changed) {
              // No inventar actividad al abrir o recargar una pestaña.
              readShared();
            }
          },
          error: () => {
            inFlight = false;
          }, // Interceptor gestiona 401; red caída no inventa actividad.
        });
      };
      const interaction = (event: Event) => {
        if (event.isTrusted && !document.hidden && valid()) this.recordActivity();
      };
      const resume = () => {
        readShared();
        lastCheck = 0;
        check();
      };
      const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'];
      for (const event of events)
        document.addEventListener(event, interaction, { passive: true, capture: true });
      document.addEventListener('visibilitychange', resume);
      window.addEventListener('pageshow', resume);
      window.addEventListener('focus', resume);
      window.addEventListener('storage', storage);
      this.channel?.addEventListener('message', channelMessage);
      const timer = setInterval(check, 1000);
      check();
      onCleanup(() => {
        stop.next();
        stop.complete();
        sessionEnded.unsubscribe();
        clearInterval(timer);
        clearTimeout(this.broadcastTimer);
        this.publish = undefined;
        for (const event of events) document.removeEventListener(event, interaction, true);
        document.removeEventListener('visibilitychange', resume);
        window.removeEventListener('pageshow', resume);
        window.removeEventListener('focus', resume);
        window.removeEventListener('storage', storage);
        this.channel?.removeEventListener('message', channelMessage);
      });
    });
  }

  private recordActivity(): void {
    // Una interacción posterior al plazo no puede revivir una sesión vencida.
    if (!this.sessionId || Date.now() - this.lastActivity >= this.idleMillis) return;
    this.lastActivity = Date.now();
    this.dirty = true;
    if (this.broadcastTimer) return;
    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = undefined;
      if (this.sessionId)
        this.publish?.({ sessionId: this.sessionId, at: this.lastActivity, kind: 'activity' });
    }, 250);
  }
}
