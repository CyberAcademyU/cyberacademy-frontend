import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiLoadingInterceptor } from './core/interceptors/api-loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless: la detección de cambios se programa por señales/eventos,
    // sin zone.js (menos CPU y bundle; todos los componentes ya son OnPush)
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiLoadingInterceptor]))
  ]
};
