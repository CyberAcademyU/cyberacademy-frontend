import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const api = new URL(environment.apiUrl, window.location.origin);
  const target = new URL(req.url, window.location.origin);
  const apiPath = api.pathname.replace(/\/$/, '');
  const isApi = target.origin === api.origin && (target.pathname === apiPath || target.pathname.startsWith(apiPath + '/'));
  const token = authService.isAuthenticated() ? authService.tokenSignal() : null;
  const request = isApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(catchError((error: unknown) => {
    if (isApi && error instanceof HttpErrorResponse && error.status === 401) {
      authService.handleUnauthorized();
    }
    return throwError(() => error);
  }));
};
