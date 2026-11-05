import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ApiLoadingService } from '../../core/services/api-loading';

@Component({
  selector: 'ca-api-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading.visible()) {
      <div class="loading-screen" role="status" aria-live="polite" aria-atomic="true">
        <div class="loading-card">
          <div class="loading-mark" aria-hidden="true"><span></span></div>
          <span class="loading-label">CYBERACADEMY / CONEXIÓN</span>
          <p class="loading-title">Un momento<span class="dots">…</span></p>
          <p class="loading-detail">
            {{ loading.slow() ? 'El servidor puede tardar en iniciar. Seguimos conectando.' : 'Estamos procesando tu solicitud.' }}
          </p>
        </div>
      </div>
    }
  `,
  styles: `
    .loading-screen { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 1.5rem; background: rgb(7 7 9 / .78); backdrop-filter: blur(8px); }
    .loading-card { width: min(100%, 25rem); display: grid; justify-items: center; text-align: center; padding: 2.5rem 2rem; border: 1px solid var(--ca-line-strong); border-radius: var(--ca-radius-lg); background: radial-gradient(circle at 50% 0%, rgb(var(--ca-signal-rgb) / .12), transparent 60%), var(--ca-panel); box-shadow: 0 24px 80px rgb(0 0 0 / .4); }
    .loading-mark { width: 52px; height: 52px; display: grid; place-items: center; border: 2px solid rgb(var(--ca-signal-rgb) / .2); border-top-color: var(--ca-signal); border-radius: 50%; animation: spin .9s linear infinite; }
    .loading-mark span { width: 8px; height: 8px; border-radius: 50%; background: var(--ca-secure); box-shadow: 0 0 16px var(--ca-secure); }
    .loading-label { margin-top: 1.6rem; color: var(--ca-signal); font: 500 .7rem var(--ca-font-code); letter-spacing: .12em; }
    .loading-title { margin: .7rem 0 0; color: var(--ca-text); font: 600 1.4rem var(--ca-font-display); }
    .loading-detail { max-width: 19rem; margin: .55rem 0 0; color: var(--ca-text-dim); font-size: var(--ca-text-sm); line-height: 1.6; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .loading-mark { animation: none; } }
  `
})
export class ApiLoaderComponent {
  protected readonly loading = inject(ApiLoadingService);
}
