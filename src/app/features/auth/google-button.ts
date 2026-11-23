import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { GoogleIdentity, GoogleIdentityService } from '../../core/services/google-identity';

@Component({
  selector: 'ca-google-button',
  template: `
    <div
      class="google-wrap"
      [hidden]="justLinked()"
      [class.is-busy]="busy() || preparing()"
      [attr.aria-busy]="busy() || preparing()"
    >
      @if (busy()) {
        <span class="google-visual google-visual--busy" role="status">
          <span class="spinner" aria-hidden="true"></span>
          {{ link() ? 'Vinculando cuenta con Google…' : 'Iniciando sesión con Google…' }}
        </span>
      } @else {
        <!-- Referencia visual: el iframe real de Google queda transparente encima
             para conservar su comportamiento y adoptar el estilo de la tarjeta. -->
        <span class="google-visual" aria-hidden="true">
          <svg class="google-logo" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>{{ signup() ? 'Regístrate con Google' : 'Continuar con Google' }}</span>
        </span>
      }
      <div #button class="google-slot"></div>
    </div>
    @if (!ready && !preparing() && !justLinked()) {
      <button type="button" class="ca-link" (click)="prepare()">
        Reintentar conexión con Google
      </button>
    }
    @if (justLinked()) {
      <p class="verified" role="status">
        <span class="verified-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        Tu cuenta de Google está vinculada.
      </p>
    }
    @if (message()) {
      <p class="message-error" role="status">{{ message() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      justify-items: stretch;
      width: 100%;
      gap: 0.4rem;
      margin-block: var(--ca-space-4) 0;
    }
    p {
      margin: 0;
    }
    .google-wrap {
      position: relative;
      width: 100%;
      height: 44px;
    }
    .google-visual {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-2);
      padding: 0 var(--ca-space-5);
      border: 1px solid var(--ca-line-strong);
      border-radius: var(--ca-radius-sm);
      background: #fff;
      color: #1f1f1f;
      font-family: var(--ca-font-display);
      font-size: var(--ca-text-sm);
      font-weight: 600;
      letter-spacing: 0.02em;
      pointer-events: none;
      transition: border-color var(--ca-fast) var(--ca-ease-out);
    }
    .google-wrap:hover .google-visual {
      border-color: var(--ca-signal);
    }
    .google-wrap:focus-within .google-visual {
      outline: 2px solid var(--ca-signal);
      outline-offset: 3px;
    }
    .google-wrap.is-busy {
      pointer-events: none;
    }
    .google-wrap.is-busy .google-visual {
      border-color: var(--ca-signal);
      color: var(--ca-text-dim);
    }
    .google-logo {
      width: 18px;
      height: 18px;
      flex: none;
    }
    .spinner {
      width: 1em;
      height: 1em;
      flex: none;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: google-spin 0.9s linear infinite;
    }
    @keyframes google-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }
    }
    /* El iframe conserva la interacción de Google, pero sin su caja visible. */
    .google-slot {
      position: absolute;
      inset: 0;
      opacity: 0;
    }
    .google-slot > div,
    .google-slot iframe {
      width: 100% !important;
      height: 100% !important;
    }
    .verified {
      display: flex;
      align-items: center;
      gap: 0.55rem;
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
    .verified-icon svg {
      width: 14px;
      height: 14px;
    }
  `,
})
export class GoogleButtonComponent implements AfterViewInit {
  readonly link = input(false);
  readonly signup = input(false);
  readonly linked = output<void>();
  readonly linkSucceeded = output<void>();
  readonly message = signal('');
  readonly busy = signal(false);
  readonly preparing = signal(false);
  readonly justLinked = signal(false);
  private readonly button = viewChild.required<ElementRef<HTMLElement>>('button');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private identityApi?: GoogleIdentity;
  protected ready = false;
  private renderedWidth?: number;
  private hideTimer?: ReturnType<typeof setTimeout>;

  private hideMessageTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit() {
    this.google.attach(this, (credential) => this.login(credential));
    const resume = () => {
      if (!document.hidden && !this.busy() && !this.justLinked() && !this.google.isFresh())
        this.prepare();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    const renewal = setInterval(resume, 30000);
    this.destroy.onDestroy(() => {
      this.google.detach(this);
      clearInterval(renewal);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pageshow', resume);
    });
    this.destroy.onDestroy(() => clearTimeout(this.hideTimer));
    this.destroy.onDestroy(() => clearTimeout(this.hideMessageTimer));
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (this.ready) this.render();
      });
      observer.observe(this.host.nativeElement);
      this.destroy.onDestroy(() => observer.disconnect());
    }

    const script = document.getElementById('google-identity');
    if (this.identity()) {
      this.prepare();
      return;
    }
    const loaded = () => this.prepare();
    const unavailable = () => this.message.set('Google no está disponible en este navegador.');
    script?.addEventListener('load', loaded, { once: true });
    script?.addEventListener('error', unavailable, { once: true });
    this.destroy.onDestroy(() => {
      script?.removeEventListener('load', loaded);
      script?.removeEventListener('error', unavailable);
    });
  }

  private identity() {
    return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts
      ?.id;
  }

  prepare() {
    const identity = this.identity();
    if (!identity || this.preparing() || this.busy() || this.justLinked()) return;
    this.preparing.set(true);
    this.ready = false;
    this.renderedWidth = undefined;
    this.button().nativeElement.replaceChildren();
    this.google
      .prepare(identity)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.preparing.set(false);
          this.identityApi = identity;
          this.ready = true;
          this.render();
        },
        error: () => {
          this.preparing.set(false);
          this.failed('No se pudo preparar Google. Reintenta la conexión.', false);
        },
      });
  }

  private login(credential: string) {
    if (this.destroy.destroyed || this.busy() || this.preparing() || !credential) return;
    if (!this.google.isFresh()) {
      this.google.invalidate();
      this.failed('La conexión con Google caducó. Selecciona tu cuenta de nuevo.');
      this.prepare();
      return;
    }
    this.busy.set(true);
    this.auth
      .googleLogin(credential, this.link())
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (response) => {
          this.busy.set(false);
          this.google.invalidate();
          if (this.link()) {
            this.ready = false;
            this.button().nativeElement.replaceChildren();
            this.justLinked.set(true);
            this.linkSucceeded.emit();
            // El aviso se muestra 3 s y después el perfil oculta la sección.
            this.hideTimer = setTimeout(() => {
              this.justLinked.set(false);
              this.linked.emit();
            }, 3000);
          } else
            void this.router.navigate([
              response.data?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student',
            ]);
        },
        error: (err) => {
          if (err.status === 428 && !this.link()) {
            this.busy.set(false);
            // No solicitar otro nonce: el formulario de nombres aún usa esta credencial.
            this.google.invalidate();
            this.ready = false;
            this.auth.beginGoogleRegistration(credential);
            void this.router.navigate(['/auth/google-details']);
          } else {
            this.failed(err.error?.message);
            if (err.status === 401) {
              // No reenviar el token viejo ni relajar la comprobación de nonce.
              this.google.invalidate();
              this.prepare();
            }
          }
        },
      });
  }

  private render() {
    // Google limita el ancho del botón a 400 px; usar el ancho real del
    // formulario permite que coincida con los demás botones de la tarjeta.
    const available = this.host.nativeElement.getBoundingClientRect().width;
    const width = Math.min(400, Math.max(200, Math.floor(available)));
    if (this.renderedWidth === width) return;
    this.renderedWidth = width;
    this.button().nativeElement.replaceChildren();
    this.identityApi?.renderButton(this.button().nativeElement, {
      type: 'standard',
      theme: 'outline',
      text: this.signup() ? 'signup_with' : 'continue_with',
      locale: 'es',
      size: 'large',
      shape: 'rectangular',
      width,
    });
  }

  private failed(message?: string, ready = true) {
    this.busy.set(false);
    this.ready = ready;
    clearTimeout(this.hideMessageTimer);
    this.message.set(message || 'No se pudo iniciar la conexión con Google.');
    // Ocultar el mensaje después de 3 segundos sin necesidad de botón de reintentar
    this.hideMessageTimer = setTimeout(() => {
      this.message.set('');
    }, 3000);
  }
}
