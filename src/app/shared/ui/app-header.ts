import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ProfileService } from '../../core/services/profile';
import { LogoComponent } from './logo';
import { IconComponent, IconName } from './icon';
import { AvatarComponent } from './avatar';
import { LeagueEmblemComponent } from './league-emblem';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

/**
 * Barra del estudiante. En escritorio la navegación va arriba; en móvil pasa a una
 * barra inferior fija, al alcance del pulgar (como una app nativa).
 */
@Component({
  selector: 'ca-app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent, AvatarComponent, LeagueEmblemComponent],
  template: `
    <header class="topbar">
      <div class="inner">
        <a routerLink="/dashboard/student" class="brand" aria-label="CyberAcademy, ir a Aprender">
          <ca-logo class="ca-logo-collapse" [size]="28" />
        </a>

        <nav class="nav nav--top" aria-label="Principal">
          <ng-container [ngTemplateOutlet]="links" />
        </nav>

        <div class="actions">
          <ng-content />
          @if (profile(); as p) {
            <a routerLink="/dashboard/leaderboard" class="xp" [attr.aria-label]="'Liga ' + p.league.name + ', ' + p.xp + ' XP'">
              <ca-league-emblem [code]="p.league.code" [size]="22" />
              <span class="ca-num">{{ p.xp }}</span><span class="unit">XP</span>
            </a>
          }
          <a routerLink="/dashboard/profile" class="me" aria-label="Mi perfil" title="Mi perfil">
            <ca-avatar [avatar]="profile()?.avatar" [name]="profile()?.publicName ?? user()?.firstName ?? ''" [size]="34" />
          </a>
          <button type="button" class="ca-icon-btn" (click)="logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
            <ca-icon name="logout" />
          </button>
        </div>
      </div>
    </header>

    <!-- Fuera del header: su backdrop-filter haría que "fixed" se posicionara respecto a él -->
    <nav class="nav nav--bottom" aria-label="Principal">
      <ng-container [ngTemplateOutlet]="links" />
    </nav>

    <ng-template #links>
      @for (item of nav; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="is-active" ariaCurrentWhenActive="page">
          <ca-icon [name]="item.icon" [size]="18" />
          <span>{{ item.label }}</span>
        </a>
      }
    </ng-template>
  `,
  styles: `
    :host { display: contents; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid var(--ca-line);
      background: rgb(var(--ca-void-rgb) / 0.82);
      backdrop-filter: blur(10px);
    }
    .inner {
      display: flex;
      align-items: center;
      gap: var(--ca-space-5);
      width: min(100% - 2 * var(--ca-space-4), 1180px);
      min-height: 64px;
      margin-inline: auto;
    }
    .brand { display: inline-flex; border-radius: var(--ca-radius-sm); text-decoration: none; }
    .brand:focus-visible, .nav a:focus-visible, .xp:focus-visible, .me:focus-visible {
      outline: none;
      box-shadow: var(--ca-focus);
    }
    .nav { display: flex; align-self: stretch; gap: var(--ca-space-1); }
    .nav--bottom { display: none; }
    .nav a {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: 0 var(--ca-space-3);
      color: var(--ca-text-dim);
      font-family: var(--ca-font-display);
      font-size: var(--ca-text-sm);
      font-weight: 600;
      text-decoration: none;
      transition: color var(--ca-fast);
    }
    .nav a:hover { color: var(--ca-text); }
    .nav a.is-active { color: var(--ca-text); }
    .nav a.is-active::after {
      content: '';
      position: absolute;
      right: var(--ca-space-3);
      bottom: -1px;
      left: var(--ca-space-3);
      height: 2px;
      background: var(--ca-signal);
      box-shadow: 0 0 10px var(--ca-signal);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      margin-left: auto;
    }
    .xp {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 var(--ca-space-3) 0 var(--ca-space-2);
      border: 1px solid var(--ca-line);
      border-radius: var(--ca-radius-pill);
      color: var(--ca-text);
      font-family: var(--ca-font-display);
      font-weight: 600;
      text-decoration: none;
    }
    .xp:hover { border-color: var(--ca-line-strong); }
    .unit { color: var(--ca-text-dim); font-size: var(--ca-text-xs); }
    .me { display: inline-flex; border-radius: 50%; }

    @media (max-width: 760px) {
      .inner { gap: var(--ca-space-3); }
      .nav--top { display: none; }
      .nav--bottom {
        display: flex;
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 30;
        justify-content: space-around;
        padding: 0 var(--ca-space-2) env(safe-area-inset-bottom);
        border-top: 1px solid var(--ca-line);
        background: rgb(var(--ca-deck-rgb) / 0.95);
        backdrop-filter: blur(10px);
      }
      .nav--bottom a {
        flex: 1;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        min-height: 60px;
        font-size: 0.72rem;
      }
      .nav--bottom a.is-active::after { top: -1px; bottom: auto; }
    }
  `
})
export class AppHeaderComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private profileService = inject(ProfileService);

  protected readonly user = this.auth.currentUserSignal;
  protected readonly profile = this.profileService.profile;
  protected readonly nav: NavItem[] = [
    { path: '/dashboard/student', label: 'Aprender', icon: 'book' },
    { path: '/dashboard/leaderboard', label: 'Clasificación', icon: 'trophy' },
    { path: '/dashboard/profile', label: 'Perfil', icon: 'user' }
  ];

  ngOnInit(): void {
    // Si falla, la cabecera sigue funcionando sin XP ni avatar
    if (!this.profile()) this.profileService.refresh();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
