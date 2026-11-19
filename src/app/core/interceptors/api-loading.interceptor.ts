import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Render Free puede necesitar más de un minuto para arrancar después de inactividad.
export const API_TIMEOUT_MS = 150_000;

export const apiLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const api = new URL(environment.apiUrl, window.location.origin);
  const target = new URL(req.url, window.location.origin);
  const path = api.pathname.replace(/\/$/, '');
  const isApi = target.origin === api.origin && (target.pathname === path || target.pathname.startsWith(path + '/'));
  if (!isApi || target.pathname === `${path}/modules/stream`) return next(req);

  return next(req).pipe(
      timeout({ each: API_TIMEOUT_MS }),
      catchError(error => {
        if (error instanceof TimeoutError) {
          return throwError(() => new HttpErrorResponse({
            status: 408,
            statusText: 'Request Timeout',
            url: req.url,
            error: { message: 'La solicitud tardó demasiado. Comprueba el resultado antes de volver a intentarlo.' }
          }));
        }
        return throwError(() => error);
      })
  );
};
