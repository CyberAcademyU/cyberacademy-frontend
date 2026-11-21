import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil, tap } from 'rxjs';
import { AuthService } from './auth';
import { ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface StudentMessage {
  id: number;
  senderName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}
export interface MessagePage { items: StudentMessage[]; nextBefore: number | null; unreadCount: number; }
export interface MessageDelivery { id: number; recipientCount: number; }
export interface MessageRequest { audience: 'ALL' | 'SELECTED'; recipientIds: string[]; body: string; requestId: string; }

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = environment.apiUrl;
  readonly unreadCount = signal(0);
  readonly toast = signal<StudentMessage | null>(null);
  private studentId = computed(() => {
    const user = this.auth.currentUserSignal();
    return user?.role === 'STUDENT' ? user.id : null;
  });
  private queue: StudentMessage[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private revision = 0;
  private clearGeneration = 0;
  private discarded = new Set<number>();

  constructor() {
    effect(onCleanup => {
      const id = this.studentId();
      this.unreadCount.set(0);
      this.discarded.clear();
      this.clearNotifications();
      if (!id) return;
      const stop = new Subject<void>();
      let inFlight = false;
      const poll = () => {
        if (document.hidden || inFlight || this.queue.length >= 20) return;
        inFlight = true;
        const revision = this.revision;
        const generation = this.clearGeneration;
        this.http.post<ApiResponse<{ items: StudentMessage[]; unreadCount: number }>>(`${this.api}/messages/notifications/claim`, {})
          .pipe(takeUntil(stop)).subscribe({
            next: res => {
              inFlight = false;
              if (!res.data) return;
              if (revision === this.revision) this.unreadCount.set(res.data.unreadCount);
              if (generation !== this.clearGeneration) return;
              this.queue.push(...res.data.items.filter(item => !this.discarded.has(item.id)));
              this.showNext();
            },
            error: () => { inFlight = false; },
          });
      };
      const visible = () => {
        clearTimeout(this.timer);
        if (!document.hidden) {
          if (this.toast()) this.scheduleDismiss();
          else this.showNext();
          poll();
        }
      };
      document.addEventListener('visibilitychange', visible);
      const interval = setInterval(poll, 15000);
      poll();
      onCleanup(() => {
        stop.next(); stop.complete();
        clearInterval(interval);
        document.removeEventListener('visibilitychange', visible);
        this.clearNotifications();
      });
    });
  }
  send(request: MessageRequest) {
    return this.http.post<ApiResponse<MessageDelivery>>(`${this.api}/admin/messages`, request);
  }
  inbox(before?: number) {
    const params = before ? new HttpParams().set('before', before) : new HttpParams();
    return this.http.get<ApiResponse<MessagePage>>(`${this.api}/messages`, { params })
      .pipe(tap(res => { if (res.data) this.unreadCount.set(res.data.unreadCount); }));
  }
  markRead(id: number) {
    return this.http.put<ApiResponse<{ unreadCount: number }>>(`${this.api}/messages/${id}/read`, {})
      .pipe(tap(res => {
        if (res.data) this.unreadCount.set(res.data.unreadCount);
        this.discard(id);
      }));
  }
  delete(id: number) {
    return this.http.delete<ApiResponse<{ unreadCount: number }>>(`${this.api}/messages/${id}`)
      .pipe(tap(res => {
        if (res.data) this.unreadCount.set(res.data.unreadCount);
        this.discard(id);
      }));
  }
  clear() {
    return this.http.delete<ApiResponse<{ unreadCount: number }>>(`${this.api}/messages`)
      .pipe(tap(() => {
        this.revision++; this.clearGeneration++;
        this.unreadCount.set(0); this.clearNotifications();
      }));
  }
  dismiss() {
    clearTimeout(this.timer);
    this.toast.set(null);
    this.showNext();
  }
  private discard(id: number) {
    this.revision++;
    this.discarded.add(id);
    this.queue = this.queue.filter(item => item.id !== id);
    if (this.toast()?.id === id) this.dismiss();
  }
  private clearNotifications() {
    clearTimeout(this.timer);
    this.queue = [];
    this.toast.set(null);
  }
  private showNext() {
    if (this.toast() || document.hidden) return;
    this.toast.set(this.queue.shift() ?? null);
    if (this.toast()) this.scheduleDismiss();
  }
  private scheduleDismiss() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dismiss(), 3000);
  }
}
