import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { LogoComponent } from './logo';

/** Barra superior de las páginas públicas (inicio y explorar). */
@Component({
  selector: 'ca-public-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <nav class="bar" aria-label="Principal">
      <a routerLink="/" class="brand" aria-label="CyberAcademy, inicio">
        <ca-logo class="ca-logo-collapse" [size]="28" />
      </a>

      <div class="links">
        <a routerLink="/explorar" routerLinkActive="is-active" class="link">Módulos</a>
        @if (signedIn()) {
          <a [routerLink]="home()" class="ca-btn ca-btn--sm ca-btn--primary">Ir a mi panel</a>
        } @else {
          <a routerLink="/auth/register" class="link hide-sm">Crear cuenta</a>
          <a routerLink="/auth/login" class="ca-btn ca-btn--sm ca-btn--primary">Iniciar sesión</a>
        }
      </div>
    </nav>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-4);
    }
    .brand {
      display: inline-flex;
      color: inherit;
      text-decoration: none;
      border-radius: var(--ca-radius-sm);
    }
    .links {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
    }
    .link {
      padding: var(--ca-space-2) var(--ca-space-3);
      border-radius: var(--ca-radius-sm);
      color: var(--ca-text-dim);
      font-size: var(--ca-text-sm);
      font-weight: 500;
      text-decoration: none;
      transition: color var(--ca-fast);
    }
    .link:hover,
    .link.is-active {
      color: var(--ca-text);
    }
    @media (max-width: 480px) {
      .hide-sm { display: none; }
    }
  `
})
export class PublicNavComponent {
  private auth = inject(AuthService);

  protected readonly signedIn = computed(() => !!this.auth.currentUserSignal() && this.auth.isAuthenticated());
  protected readonly home = computed(() => (this.auth.isAdmin() ? '/dashboard/admin' : '/dashboard/student'));
}
