import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { rateLimitMessage } from './rate-limit-message';

describe('rateLimitMessage', () => {
  it('uses Retry-After to tell the user when to try again', () => {
    const error = new HttpErrorResponse({ status: 429, headers: new HttpHeaders({ 'Retry-After': '61' }) });
    expect(rateLimitMessage(error)).toContain('2 minutos');
  });

  it('uses a safe generic message if the header is missing', () => {
    expect(rateLimitMessage(new HttpErrorResponse({ status: 429 }))).toContain('Espera un momento');
    expect(rateLimitMessage(new HttpErrorResponse({ status: 401 }))).toBeNull();
  });
});
