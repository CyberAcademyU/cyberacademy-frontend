import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MessageInboxComponent } from './inbox';
import { AppHeaderComponent } from '../../shared/ui/app-header';
import { MessagesService, StudentMessage } from '../../core/services/messages';

@Component({ selector: 'ca-app-header', template: '' })
class HeaderStub {}

describe('bandeja de mensajes', () => {
  const message: StudentMessage = { id: 1, senderName: 'María Pérez', body: '<img src=x onerror=alert(1)>',
    createdAt: '2026-11-20T00:00:00Z', readAt: null };
  const service = { inbox: vi.fn(), markRead: vi.fn(), delete: vi.fn(), clear: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    service.inbox.mockReturnValue(of({ data: { items: [message], nextBefore: null, unreadCount: 1 } }));
    service.markRead.mockReturnValue(of({ data: { unreadCount: 0 } }));
    service.delete.mockReturnValue(of({ data: { unreadCount: 0 } }));
    service.clear.mockReturnValue(of({ data: { unreadCount: 0 } }));
    TestBed.configureTestingModule({ imports: [MessageInboxComponent], providers: [{ provide: MessagesService, useValue: service }] });
    TestBed.overrideComponent(MessageInboxComponent, { remove: { imports: [AppHeaderComponent] }, add: { imports: [HeaderStub] } });
  });
  function render() {
    const fixture = TestBed.createComponent(MessageInboxComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('muestra remitente y texto sin interpretar HTML', () => {
    const fixture = render();
    expect(fixture.nativeElement.textContent).toContain('María Pérez');
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
  it('marca leído solo cuando el estudiante abre el mensaje', () => {
    const fixture = render();
    expect(service.markRead).not.toHaveBeenCalled();
    fixture.componentInstance.open(message);
    expect(service.markRead).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.items()[0].readAt).not.toBeNull();
  });
  it('no vacía sin confirmación y puede eliminar un mensaje por separado', () => {
    const fixture = render();
    fixture.componentInstance.clear();
    expect(service.clear).not.toHaveBeenCalled();
    fixture.componentInstance.remove(1);
    expect(service.delete).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.items()).toEqual([]);
  });
  it('vacía la lista solo tras confirmar', () => {
    const fixture = render();
    fixture.componentInstance.confirmClear.set(true);
    fixture.componentInstance.clear();
    expect(service.clear).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.items()).toEqual([]);
    expect(fixture.componentInstance.confirmClear()).toBe(false);
  });
});
