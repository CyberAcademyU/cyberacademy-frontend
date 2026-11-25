import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { LogoComponent } from './logo';

/** Barra superior de las páginas públicas (inicio y explorar). */
@Component({
  selector: 'ca-public-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <nav class="bar" aria-label="Principal">
      <a routerLink="/" class="brand" aria-label="CyberAcademy, inicio">
        <ca-logo class="ca-logo-collapse" [size]="28" />
      </a>

      <div class="links">
        @if (signedIn()) {
          <a [routerLink]="home()" class="nav-action ca-btn ca-btn--primary">Ir a mi panel</a>
        } @else {
          <a routerLink="/auth/register" class="nav-action link">Crear cuenta</a>
          <a routerLink="/auth/login" class="nav-action ca-btn ca-btn--primary">Iniciar sesión</a>
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
    .nav-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 var(--ca-space-4);
      border-radius: var(--ca-radius-sm);
      font-family: var(--ca-font-display);
      font-size: var(--ca-text-sm);
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }
    .link {
      border: 1px solid transparent;
      color: var(--ca-text);
      transition: background-color var(--ca-fast), border-color var(--ca-fast);
    }
    .link:hover {
      background: var(--ca-raised);
      border-color: var(--ca-signal);
    }
    .brand:focus-visible,
    .nav-action:focus-visible {
      outline: 2px solid var(--ca-signal);
      outline-offset: 3px;
    }
    .nav-action.ca-btn--primary,
    .nav-action.ca-btn--primary:hover {
      box-shadow: none;
    }
    @media (max-width: 760px) {
      .bar { flex-wrap: wrap; gap: var(--ca-space-3); }
      .links { width: 100%; flex-wrap: wrap; }
      .nav-action { flex: 1; padding-inline: var(--ca-space-2); }
    }
  `
})
export class PublicNavComponent {
  private auth = inject(AuthService);

  protected readonly signedIn = computed(() => !!this.auth.currentUserSignal() && this.auth.isAuthenticated());
  protected readonly home = computed(() => (this.auth.isAdmin() ? '/dashboard/admin' : '/dashboard/student'));
}
