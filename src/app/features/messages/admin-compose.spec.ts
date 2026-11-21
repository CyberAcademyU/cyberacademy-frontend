import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminComposeComponent } from './admin-compose';
import { MessagesService } from '../../core/services/messages';
import { AuthService } from '../../core/services/auth';
import { StudentOverview } from '../../core/models/admin-dashboard.model';

describe('enviar mensajes desde administración', () => {
  const send = vi.fn();
  const student = (id: string, status: 'ACTIVE' | 'SUSPENDED'): StudentOverview => ({
    userId: id, firstName: id, lastName: 'Pérez', email: `${id}@example.com`, status,
    modulesCompleted: 0, modulesTotal: 1, totalScore: null, gradedModules: 0,
    averageScore: null, progressPercent: 0, lastActivityAt: null, createdAt: '2026-01-01T00:00:00Z',
  });
  beforeEach(() => {
    send.mockReset(); send.mockReturnValue(of({ data: { id: 1, recipientCount: 2 } }));
    TestBed.configureTestingModule({ imports: [AdminComposeComponent], providers: [
      { provide: MessagesService, useValue: { send } },
      { provide: AuthService, useValue: { currentUserSignal: signal({ firstName: 'María', lastName: 'Pérez' }) } },
    ] });
  });
  function render() {
    const fixture = TestBed.createComponent(AdminComposeComponent);
    fixture.componentRef.setInput('students', [student('Ana', 'ACTIVE'), student('Luis', 'ACTIVE'), student('Inactivo', 'SUSPENDED')]);
    fixture.detectChanges();
    return fixture;
  }
  it('no envía sin texto o sin confirmar y excluye estudiantes suspendidos', () => {
    const fixture = render();
    const component = fixture.componentInstance;
    component.review(); component.send();
    expect(send).not.toHaveBeenCalled();
    component.setBody('Mensaje');
    component.review();
    expect(component.recipientCount()).toBe(2);
    expect(send).not.toHaveBeenCalled();
    component.send();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ audience: 'ALL', recipientIds: [], body: 'Mensaje' }));
  });
  it('permite buscar y seleccionar solo los destinatarios específicos', () => {
    const fixture = render();
    const component = fixture.componentInstance;
    component.setAudience('SELECTED');
    component.query.set('ana@example.com');
    expect(component.filtered().map(user => user.userId)).toEqual(['Ana']);
    component.toggle('Ana'); component.setBody('Para Ana');
    component.review(); component.send();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ audience: 'SELECTED', recipientIds: ['Ana'] }));
  });
  it('reintentar el mismo envío conserva la clave para no duplicarlo', () => {
    send.mockReturnValue(throwError(() => ({ error: { message: 'Red interrumpida' } })));
    const fixture = render();
    const component = fixture.componentInstance;
    component.setBody('Aviso');
    component.review();
    const id = component.preview()?.requestId;
    component.send(); component.send();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].requestId).toBe(id);
    expect(send.mock.calls[1][0].requestId).toBe(id);
  });
  it('la vista previa muestra HTML como texto, sin ejecutarlo', () => {
    const fixture = render();
    fixture.componentInstance.setBody('<img src=x onerror=alert(1)>');
    fixture.componentInstance.review();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
