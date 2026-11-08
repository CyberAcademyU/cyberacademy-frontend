import { HttpErrorResponse } from '@angular/common/http';

/** Mensaje para límites de la API; el servidor sigue aplicando el control. */
export function rateLimitMessage(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 429) return null;
  const header = error.headers.get('Retry-After');
  const seconds = header && /^\d+$/.test(header) ? Number(header) : 0;
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    return 'Demasiadas solicitudes. Espera un momento e inténtalo nuevamente.';
  }
  if (seconds <= 60) {
    return `Demasiadas solicitudes. Intenta nuevamente en ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Demasiadas solicitudes. Intenta nuevamente en aproximadamente ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
}
