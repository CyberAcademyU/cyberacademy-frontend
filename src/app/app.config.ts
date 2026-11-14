import { ApplicationConfig, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { AuthService } from './core/services/auth';
import { PasswordTransportService } from './core/services/password-transport';
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
    provideAppInitializer(() => {
      void inject(AuthService).initialize();
      // Precarga la clave pública para que el primer login no espere.
      inject(PasswordTransportService).warmUp();
    }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiLoadingInterceptor]))
  ]
};
