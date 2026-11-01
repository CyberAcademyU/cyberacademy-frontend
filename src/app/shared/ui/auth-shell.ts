import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo';

/**
 * Layout de las pantallas de acceso: panel de presentación con la secuencia de arranque
 * (el único movimiento automático de la app) y el formulario proyectado a la derecha.
 */
@Component({
  selector: 'ca-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <div class="shell">
      <section class="briefing" aria-labelledby="briefing-title">
        <a routerLink="/" class="home" aria-label="CyberAcademy, volver a la portada"><ca-logo [size]="34" /></a>

        <div class="scene" aria-hidden="true">
          <svg viewBox="0 0 240 260" fill="none">
            <g class="traces" stroke-width="1.5" stroke-linecap="round">
              <path class="t t1" d="M0 70h48l14 14h22" />
              <path class="t t2" d="M0 150h36l12-12h36" />
              <path class="t t3" d="M240 96h-44l-14 14h-26" />
              <path class="t t4" d="M240 176h-52l-10-10h-22" />
            </g>
            <path class="shield" d="M120 22l78 28v58c0 48-33 84-78 98-45-14-78-50-78-98V50z" />
            <path class="shield-inner" d="M120 48l54 20v40c0 33-23 58-54 68-31-10-54-35-54-68V68z" />
            <path class="tick" d="M96 116l17 17 33-35" />
            <circle class="pad p1" cx="84" cy="84" r="4" />
            <circle class="pad p2" cx="84" cy="138" r="4" />
            <circle class="pad p3" cx="156" cy="110" r="4" />
            <circle class="pad p4" cx="156" cy="166" r="4" />
          </svg>
        </div>

        <div class="copy">
          <h1 id="briefing-title">Identifica el ataque antes de que pueda afectarte.</h1>
          <ul>
            <li>Lecciones cortas con una pregunta para comprobar lo que aprendiste.</li>
            <li>Una práctica final por módulo con nota inmediata.</li>
            <li>Tu avance y tus resultados, siempre a la vista.</li>
          </ul>
        </div>
      </section>

      <main class="access">
        <div class="ca-panel ca-panel--cut card">
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      min-height: 100dvh;
    }
    .briefing {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-6);
      padding: var(--ca-space-7) clamp(var(--ca-space-5), 5vw, var(--ca-space-8));
      overflow: hidden;
      border-right: 1px solid var(--ca-line);
      background:
        radial-gradient(60% 50% at 35% 45%, rgb(var(--ca-signal-rgb) / 0.10), transparent 70%),
        linear-gradient(180deg, var(--ca-deck), var(--ca-void));
    }
    .home {
      align-self: flex-start;
      color: inherit;
      text-decoration: none;
      border-radius: var(--ca-radius-sm);
    }
    .scene {
      flex: 1;
      display: grid;
      place-items: center;
      min-height: 220px;
    }
    .scene svg {
      width: min(100%, 320px);
      height: auto;
    }
    .copy {
      display: grid;
      gap: var(--ca-space-5);
      max-width: 34rem;
    }
    h1 {
      font-size: clamp(var(--ca-text-2xl), 3.4vw, var(--ca-text-4xl));
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
    }
    ul {
      display: grid;
      gap: var(--ca-space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ca-text-dim);
    }
    li {
      display: flex;
      gap: var(--ca-space-3);
      align-items: baseline;
    }
    li::before {
      content: '';
      flex: none;
      width: 8px;
      height: 8px;
      border: 2px solid var(--ca-secure);
      border-radius: 50%;
      transform: translateY(-1px);
    }
    .access {
      display: grid;
      place-items: center;
      padding: var(--ca-space-6) var(--ca-space-4);
    }
    .card {
      width: min(100%, 460px);
      padding: var(--ca-space-6) clamp(var(--ca-space-5), 4vw, var(--ca-space-6));
    }

    /* ---------- Secuencia de arranque ---------- */
    .shield,
    .shield-inner,
    .tick,
    .t {
      stroke-linejoin: round;
    }
    .shield {
      stroke: var(--ca-text);
      stroke-width: 2.5;
      stroke-dasharray: 520;
      stroke-dashoffset: 520;
      animation: draw 1.2s var(--ca-ease-out) 0.15s forwards;
    }
    .shield-inner {
      stroke: var(--ca-line-strong);
      stroke-width: 1.5;
      stroke-dasharray: 4 6;
      opacity: 0;
      animation: appear 0.6s ease 0.9s forwards;
    }
    .t {
      stroke: var(--ca-signal);
      stroke-dasharray: 120;
      stroke-dashoffset: 120;
      animation: draw 0.7s var(--ca-ease-out) forwards;
    }
    .t1 { animation-delay: 1.0s; }
    .t2 { animation-delay: 1.1s; }
    .t3 { animation-delay: 1.2s; }
    .t4 { animation-delay: 1.3s; }
    .pad {
      fill: var(--ca-signal);
      opacity: 0;
      animation: appear 0.3s ease forwards;
    }
    .p1 { animation-delay: 1.5s; }
    .p2 { animation-delay: 1.6s; }
    .p3 { animation-delay: 1.7s; }
    .p4 { animation-delay: 1.8s; }
    .tick {
      stroke: var(--ca-secure);
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 90;
      stroke-dashoffset: 90;
      filter: drop-shadow(0 0 10px rgb(var(--ca-secure-rgb) / 0.6));
      animation: draw 0.5s var(--ca-ease-out) 2s forwards;
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
    @keyframes appear {
      to { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .shield, .t, .tick { stroke-dashoffset: 0; animation: none; }
      .shield-inner, .pad { opacity: 1; animation: none; }
    }

    @media (max-width: 900px) {
      .shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
      .briefing {
        gap: var(--ca-space-4);
        padding: var(--ca-space-5) var(--ca-space-4) var(--ca-space-2);
        border-right: 0;
        background: none;
      }
      .scene,
      ul {
        display: none;
      }
      h1 {
        font-size: var(--ca-text-xl);
      }
      .access {
        place-items: start center;
        padding-top: var(--ca-space-4);
      }
    }
  `
})
export class AuthShellComponent {}
