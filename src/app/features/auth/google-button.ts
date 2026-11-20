import { AfterViewInit, Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

interface Identity {
  initialize(config: {client_id: string; nonce: string; callback: (result: {credential: string}) => void}): void;
  renderButton(element: HTMLElement, options: {
    type: string;
    theme: string;
    text: string;
    locale: string;
    size: string;
    shape: string;
    width: number;
  }): void;
}

@Component({
  selector: 'ca-google-button',
  template: `
    <div #button class="google-slot" [hidden]="busy() || justLinked()"></div>
    @if (justLinked()) {
      <p class="verified" role="status">
        <span class="verified-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        Tu cuenta de Google está vinculada.
      </p>
    }
    @if (busy()) { <p role="status">Verificando con Google…</p> }
    @if (message()) { <p role="status">{{ message() }}</p> }
    @if (retry()) { <button class="ca-link" type="button" (click)="prepare()">Reintentar con Google</button> }
  `,
  styles: `
    :host { display: grid; justify-items: stretch; width: 100%; gap: .4rem; margin-block: .25rem 0; }
    .google-slot { width: 100%; min-height: 40px; }
    p { margin: 0; }
    .verified {
      display: flex;
      align-items: center;
      gap: .55rem;
      color: var(--ca-secure);
      font-size: var(--ca-text-sm);
    }
    .verified-icon {
      flex: none;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--ca-secure);
      color: var(--ca-void);
    }
    .verified-icon svg { width: 14px; height: 14px; }
  `,
})
export class GoogleButtonComponent implements AfterViewInit {
  readonly link = input(false);
  readonly linked = output<void>();
  readonly message = signal('');
  readonly busy = signal(false);
  readonly retry = signal(false);
  readonly justLinked = signal(false);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private identityApi?: Identity;
  private ready = false;
  private hideTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit() {
    this.destroy.onDestroy(() => clearTimeout(this.hideTimer));
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (this.ready) this.render();
      });
      observer.observe(this.host.nativeElement);
      this.destroy.onDestroy(() => observer.disconnect());
    }

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
    this.ready = false;
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
                this.ready = false;
                this.button().nativeElement.replaceChildren();
                this.justLinked.set(true);
                // El aviso se muestra 3 s y después el perfil oculta la sección.
                this.hideTimer = setTimeout(() => {
                  this.justLinked.set(false);
                  this.linked.emit();
                }, 3000);
              } else void this.router.navigate([response.data?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student']);
            },
            error: err => this.failed(err.error?.message),
          });
        }});
        this.identityApi = identity;
        this.ready = true;
        this.render();
      },
      error: () => this.failed(),
    });
  }

  private render() {
    // Google limita el ancho del botón a 400 px; usar el ancho real del
    // formulario permite que coincida con los demás botones de la tarjeta.
    const available = this.host.nativeElement.getBoundingClientRect().width;
    const width = Math.min(400, Math.max(200, Math.floor(available)));
    this.identityApi?.renderButton(this.button().nativeElement, {
      type: 'standard',
      theme: 'outline',
      text: 'continue_with',
      locale: 'es',
      size: 'large',
      shape: 'rectangular',
      width,
    });
  }

  private failed(message?: string) {
    this.busy.set(false);
    this.ready = false;
    this.button().nativeElement.replaceChildren();
    this.message.set(message || 'No se pudo iniciar la conexión con Google.');
    this.retry.set(true);
  }
}
