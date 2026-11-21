import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { MessagesService, StudentMessage } from './messages';
import { AuthService } from './auth';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('notificaciones privadas de estudiantes', () => {
  const user = signal<User | null>(null);
  let service: MessagesService;
  let requests: HttpTestingController;
  let hidden = false;
  let originalHidden: PropertyDescriptor | undefined;
  const item = (id: number): StudentMessage => ({
    id, senderName: 'María Pérez', body: 'Aviso del módulo', createdAt: '2026-11-20T00:00:00Z', readAt: null,
  });
  beforeEach(() => {
    vi.useFakeTimers();
    user.set(null); hidden = false;
    originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { currentUserSignal: user } },
    ] });
    service = TestBed.inject(MessagesService);
    requests = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    requests.verify({ ignoreCancelled: true });
    if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden);
    else Reflect.deleteProperty(document, 'hidden');
    vi.useRealTimers();
  });
  function student() {
    user.set({ id: 'student', role: 'STUDENT', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com',
      status: 'ACTIVE', emailVerified: true, createdAt: '2026-01-01T00:00:00Z' });
    TestBed.tick();
  }
  function claim(items: StudentMessage[], unreadCount = items.length) {
    const req = requests.expectOne(`${environment.apiUrl}/messages/notifications/claim`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { items, unreadCount } });
  }

  it('no consulta notificaciones sin sesión ni para administradores', () => {
    user.set({ id: 'admin', role: 'ADMIN', firstName: 'Admin', lastName: 'Uno', email: 'admin@example.com',
      status: 'ACTIVE', emailVerified: true, createdAt: '2026-01-01T00:00:00Z' });
    TestBed.tick();
    vi.advanceTimersByTime(30000);
    requests.expectNone(`${environment.apiUrl}/messages/notifications/claim`);
    expect(service.toast()).toBeNull();
  });
  it('cada toast dura 3 segundos sin marcar el mensaje como leído', () => {
    student(); claim([item(1), item(2)]);
    expect(service.toast()?.id).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(service.toast()?.id).toBe(2);
    vi.advanceTimersByTime(3000);
    expect(service.toast()).toBeNull();
    expect(service.unreadCount()).toBe(2);
  });
  it('limpia notificaciones y detiene consultas al cerrar sesión', () => {
    student(); claim([item(1)]);
    user.set(null); TestBed.tick();
    vi.advanceTimersByTime(30000);
    expect(service.toast()).toBeNull();
    expect(service.unreadCount()).toBe(0);
    requests.expectNone(`${environment.apiUrl}/messages/notifications/claim`);
  });
  it('no gasta los 3 segundos con la pestaña oculta', () => {
    student(); claim([item(1)]);
    hidden = true; document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(5000);
    expect(service.toast()?.id).toBe(1);
    hidden = false; document.dispatchEvent(new Event('visibilitychange')); claim([], 1);
    vi.advanceTimersByTime(3000);
    expect(service.toast()).toBeNull();
  });
  it('una respuesta antigua no resucita avisos después de vaciar la bandeja', () => {
    student();
    service.clear().subscribe();
    requests.expectOne(`${environment.apiUrl}/messages`).flush({ data: { unreadCount: 0 } });
    claim([item(1)], 1);
    expect(service.toast()).toBeNull();
    expect(service.unreadCount()).toBe(0);
  });
  it('elimina por ID sin enviar una identidad de estudiante manipulable', () => {
    service.delete(8).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}/messages/8`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush({ data: { unreadCount: 2 } });
    expect(service.unreadCount()).toBe(2);
  });
});
