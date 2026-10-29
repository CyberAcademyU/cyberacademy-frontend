import { Injectable } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';

export interface ModuleCreatedEvent {
  id: string;
  title: string;
}

class UnauthorizedError extends Error {}
class PermanentStreamError extends Error {}

@Injectable({ providedIn: 'root' })
export class ModuleStreamService {
  constructor(private auth: AuthService) {}

  // null indica una conexión establecida: el consumidor puede recuperar eventos perdidos.
  connect(): Observable<ModuleCreatedEvent | null> {
    return new Observable(subscriber => {
      const controller = new AbortController();
      const session = this.auth.sessionEnding.subscribe(() => controller.abort());
      const token = this.auth.isAuthenticated() ? this.auth.tokenSignal() : null;
      if (!token) {
        subscriber.complete();
        session.unsubscribe();
        return;
      }

      const run = async () => {
        const maxRetries = 5;
        for (let attempt = 0; attempt <= maxRetries && !controller.signal.aborted; attempt++) {
          try {
            await fetchEventSource(`${environment.apiUrl}/modules/stream`, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
              signal: controller.signal,
              redirect: 'error',
              credentials: 'omit',
              openWhenHidden: true,
              async onopen(response) {
                if (response.status === 401) throw new UnauthorizedError();
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                  throw new PermanentStreamError();
                }
                if (!response.ok || !response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
                  throw new Error('No se pudo abrir el stream');
                }
                subscriber.next(null);
              },
              onmessage(message) {
                if (message.event !== 'module-created') return;
                try {
                  const data: unknown = JSON.parse(message.data);
                  if (typeof data === 'object' && data !== null &&
                      typeof (data as ModuleCreatedEvent).id === 'string' &&
                      typeof (data as ModuleCreatedEvent).title === 'string') {
                    subscriber.next(data as ModuleCreatedEvent);
                  }
                } catch { /* Ignorar eventos malformados. */ }
              },
              onclose() { throw new Error('Stream cerrado'); },
              onerror(error) { throw error; }
            });
            break;
          } catch (error) {
            if (controller.signal.aborted) break;
            if (error instanceof UnauthorizedError) {
              this.auth.handleUnauthorized();
              break;
            }
            if (error instanceof PermanentStreamError || attempt === maxRetries) break;
            await new Promise<void>(resolve => {
              const timer = setTimeout(done, Math.min(1000 * 2 ** attempt, 16000));
              function done() {
                clearTimeout(timer);
                controller.signal.removeEventListener('abort', done);
                resolve();
              }
              controller.signal.addEventListener('abort', done, { once: true });
              if (controller.signal.aborted) done();
            });
          }
        }
        subscriber.complete();
      };
      void run();
      return () => { controller.abort(); session.unsubscribe(); };
    });
  }
}
