import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const api = new URL(environment.apiUrl, window.location.origin);
  const target = new URL(req.url, window.location.origin);
  const apiPath = api.pathname.replace(/\/$/, '');
  const isApi = target.origin === api.origin && (target.pathname === apiPath || target.pathname.startsWith(apiPath + '/'));
  if (!isApi) return next(req);
  const isAuthEndpoint = target.pathname.startsWith(`${apiPath}/auth/`);
  const request = req.clone({ withCredentials: true, setHeaders: { 'X-Requested-With': 'CyberAcademy' } });
  return next(request).pipe(catchError((error: unknown) => {
    if (!isAuthEndpoint && error instanceof HttpErrorResponse && error.status === 401) {
      return from(authService.refreshSession()).pipe(
        switchMap(() => next(request)),
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) authService.handleUnauthorized();
          return throwError(() => refreshError);
        })
      );
    }
    return throwError(() => error);
  }));
};
