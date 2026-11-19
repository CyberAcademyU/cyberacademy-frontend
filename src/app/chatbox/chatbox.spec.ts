import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { ChatboxComponent } from './chatbox';

describe('Rocu con Gemini', () => {
  const url = `${environment.apiUrl}/rocu/chat`;
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('envía el contexto al backend y lo olvida al cerrar', () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    fixture.detectChanges();
    const chat = fixture.componentInstance;
    const requests = TestBed.inject(HttpTestingController);
    chat.open();
    chat.draft.set('Recibí una llamada');
    chat.send();
    const first = requests.expectOne(url);
    expect(first.request.body.history).toEqual([]);
    first.flush({data: '¿Compartiste algún dato?'});
    chat.draft.set('No');
    chat.send();
    const second = requests.expectOne(url);
    expect(second.request.body.history[0].question).toBe('Recibí una llamada');
    chat.close();
    expect(second.cancelled).toBe(true);
    expect(chat.turns()).toEqual([]);
  });

  it('conserva el borrador y la ayuda local cuando Gemini no responde', () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    const chat = fixture.componentInstance;
    chat.open();
    chat.draft.set('Consulta de prueba');
    chat.send();
    TestBed.inject(HttpTestingController).expectOne(url).flush({}, {status: 503, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(chat.draft()).toBe('Consulta de prueba');
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('details')).toBeTruthy();
  });
});
