import { AfterViewInit, Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

interface Identity {
  initialize(config: {client_id: string; nonce: string; callback: (result: {credential: string}) => void}): void;
  renderButton(element: HTMLElement, options: {type: string; theme: string; text: string; locale: string}): void;
}

@Component({
  selector: 'ca-google-button',
  template: `
    <div #button [hidden]="busy()"></div>
    @if (busy()) { <p role="status">Verificando con Google…</p> }
    @if (message()) { <p role="status">{{ message() }}</p> }
    @if (retry()) { <button class="ca-link" type="button" (click)="prepare()">Reintentar con Google</button> }
  `,
  styles: `:host { display: grid; justify-items: center; gap: .4rem; margin-block: 1rem; } p { margin: 0; }`,
})
export class GoogleButtonComponent implements AfterViewInit {
  readonly link = input(false);
  readonly message = signal('');
  readonly busy = signal(false);
  readonly retry = signal(false);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);

  ngAfterViewInit() {
    const script = document.getElementById('google-identity');
    if (this.identity()) { this.prepare(); return; }
    const loaded = () => this.prepare();
    const unavailable = () => this.message.set('Google no está disponible en este navegador.');
    script?.addEventListener('load', loaded, {once: true});
    script?.addEventListener('error', unavailable, {once: true});
    this.destroy.onDestroy(() => {
      script?.removeEventListener('load', loaded);
      script?.removeEventListener('error', unavailable);
    });
  }

  private identity() {
    return (window as Window & { google?: { accounts?: { id?: Identity } } }).google?.accounts?.id;
  }

  prepare() {
    const identity = this.identity();
    if (!identity) return;
    this.retry.set(false);
    this.message.set('');
    this.auth.googleChallenge().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: challenge => {
        identity.initialize({client_id: challenge.clientId, nonce: challenge.nonce, callback: result => {
          if (this.destroy.destroyed || this.busy() || !result.credential) return;
          this.busy.set(true);
          this.auth.googleLogin(result.credential, this.link()).pipe(takeUntilDestroyed(this.destroy)).subscribe({
            next: response => {
              this.busy.set(false);
              if (this.link()) {
                this.button().nativeElement.replaceChildren();
                this.message.set('Tu cuenta de Google está vinculada.');
              } else void this.router.navigate([response.data?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student']);
            },
            error: err => this.failed(err.error?.message),
          });
        }});
        identity.renderButton(this.button().nativeElement, {type: 'standard', theme: 'outline', text: 'continue_with', locale: 'es'});
      },
      error: () => this.failed(),
    });
  }

  private failed(message?: string) {
    this.busy.set(false);
    this.button().nativeElement.replaceChildren();
    this.message.set(message || 'No se pudo iniciar la conexión con Google.');
    this.retry.set(true);
  }
}
