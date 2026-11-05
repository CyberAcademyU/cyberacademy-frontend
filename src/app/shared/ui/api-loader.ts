import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ApiLoadingService } from '../../core/services/api-loading';

@Component({
  selector: 'ca-api-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading.visible()) {
      <div class="loading-screen" role="status" aria-live="polite" aria-atomic="true">
        <div class="loading-card">
          <span class="loading-mark" aria-hidden="true"></span>
          <p class="loading-title">Cargando<span aria-hidden="true">…</span></p>
        </div>
      </div>
    }
  `,
  styles: `
    .loading-screen {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: rgb(var(--ca-void-rgb) / .76);
      backdrop-filter: blur(8px);
    }
    .loading-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 190px;
      padding: 1.15rem 1.4rem;
      border: 1px solid var(--ca-line-strong);
      border-radius: var(--ca-radius-md);
      background: var(--ca-panel);
      box-shadow: 0 16px 48px rgb(0 0 0 / .35);
    }
    .loading-mark {
      flex: 0 0 26px;
      width: 26px;
      height: 26px;
      border: 2px solid rgb(var(--ca-signal-rgb) / .2);
      border-top-color: var(--ca-signal);
      border-radius: 50%;
      animation: spin .9s linear infinite;
    }
    .loading-title {
      margin: 0;
      color: var(--ca-text);
      font: 500 var(--ca-text-md) var(--ca-font-display);
      letter-spacing: -.01em;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .loading-mark { animation: none; } }
  `
})
export class ApiLoaderComponent {
  protected readonly loading = inject(ApiLoadingService);
}
