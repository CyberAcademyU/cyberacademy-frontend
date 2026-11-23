import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { AuthService } from './auth';

export interface GoogleIdentity {
  initialize(config: {
    client_id: string;
    nonce: string;
    callback: (result: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      type: string;
      theme: string;
      text: string;
      locale: string;
      size: string;
      shape: string;
      width: number;
    },
  ): void;
}

/** GIS es global en la página, no pertenece a cada instancia del botón. */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly auth = inject(AuthService);
  // Margen respecto a los 600 segundos de la cookie HttpOnly del backend.
  private readonly lifetime = 8 * 60 * 1000;
  private preparedAt = 0;
  private usable = false;
  private api?: GoogleIdentity;
  private pending?: Observable<void>;
  private generation = 0;
  private owner?: object;
  private receive?: (credential: string) => void;

  isFresh(): boolean {
    return this.usable && Date.now() - this.preparedAt < this.lifetime;
  }

  attach(owner: object, receive: (credential: string) => void): void {
    this.owner = owner;
    this.receive = receive;
  }

  detach(owner: object): void {
    if (this.owner !== owner) return;
    this.owner = undefined;
    this.receive = undefined;
  }

  invalidate(): void {
    this.usable = false;
    // Ignora callbacks de un popup anterior, incluso antes de la renovación.
    this.generation++;
  }

  prepare(api: GoogleIdentity): Observable<void> {
    if (this.api === api && this.isFresh()) return of(undefined);
    if (this.pending) return this.pending;
    const requestedAt = Date.now();
    this.pending = this.auth.googleChallenge().pipe(
      tap((challenge) => {
        const generation = ++this.generation;
        api.initialize({
          client_id: challenge.clientId,
          nonce: challenge.nonce,
          callback: (result) => {
            if (generation === this.generation && result.credential)
              this.receive?.(result.credential);
          },
        });
        this.api = api;
        this.preparedAt = requestedAt;
        this.usable = true;
      }),
      map(() => undefined),
      finalize(() => {
        this.pending = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this.pending;
  }
}
