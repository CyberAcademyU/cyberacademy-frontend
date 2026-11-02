import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleSummary } from '../../../core/models/course-module.model';
import { CircuitStep, CircuitTrackComponent } from '../../../shared/ui/circuit-track';
import { IconComponent } from '../../../shared/ui/icon';
import { ModuleCoverComponent } from '../../../shared/ui/module-cover';

/**
 * Tarjeta de módulo. El título es el botón que abre el módulo y se estira sobre
 * toda la tarjeta; el marcador de guardado queda encima como control independiente.
 */
@Component({
  selector: 'app-module-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CircuitTrackComponent, IconComponent, ModuleCoverComponent],
  host: { '[class.is-next]': 'next()', '[class.is-locked]': 'module().locked' },
  template: `
    <ca-module-cover class="cover" [cover]="module().cover" [seed]="module().code" />
    <div class="top">
      <span class="ca-code">{{ module().code }}</span>
      <button type="button" class="ca-icon-btn save" [class.is-saved]="module().saved"
              [attr.aria-pressed]="module().saved" [disabled]="saving()"
              [attr.aria-label]="(module().saved ? 'Quitar de guardados: ' : 'Guardar módulo: ') + module().title"
              [title]="module().saved ? 'Quitar de guardados' : 'Guardar para después'"
              (click)="toggleSave.emit()">
        <ca-icon [name]="module().saved ? 'bookmark-filled' : 'bookmark'" [size]="18" />
      </button>
    </div>

    <h3 class="title">
      <button type="button" class="open" [disabled]="module().locked" (click)="open.emit()">{{ module().title }}</button>
    </h3>
    <p class="desc">{{ module().description || 'Módulo de ciberseguridad' }}</p>
    @if (module().locked) { <p class="locked-message"><ca-icon name="lock" [size]="16" /> Termina los módulos anteriores para desbloquearlo.</p> }

    <ca-circuit-track class="track" [steps]="steps()" [compact]="true" />

    <div class="foot">
      <span class="ca-badge" [class]="statusClass()">{{ label() }}</span>
      <span class="ca-num">{{ module().completedSections }} de {{ module().totalSections }} sesiones</span>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      min-width: 0;
      display: grid;
      grid-template-rows: auto auto auto 1fr auto auto;
      gap: var(--ca-space-3);
      padding: var(--ca-space-3) var(--ca-space-5) var(--ca-space-5);
      border: 1px solid var(--ca-line);
      border-radius: var(--ca-radius-sm);
      background: var(--ca-panel);
      transition: border-color var(--ca-fast) var(--ca-ease-out), background-color var(--ca-fast) var(--ca-ease-out);
    }
    :host(:has(.open:hover)) { border-color: var(--ca-line-strong); background: var(--ca-raised); }
    :host(:has(.open:focus-visible)) { box-shadow: var(--ca-focus); }
    :host(.is-next) { border-color: rgb(var(--ca-signal-rgb) / 0.45); }
    :host(.is-locked) { opacity: 0.75; }
    .locked-message { display: flex; gap: var(--ca-space-2); align-items: center; color: var(--ca-text-dim); font-size: var(--ca-text-xs); }
    .open:disabled { cursor: not-allowed; }
    .cover {
      aspect-ratio: 16 / 7;
      margin: 0 calc(var(--ca-space-2) * -1) var(--ca-space-1);
      border-radius: var(--ca-radius-sm);
      transition: transform var(--ca-slow) var(--ca-ease-out);
    }
    :host(:has(.open:hover)) .cover { transform: scale(1.015); }
    @media (prefers-reduced-motion: reduce) {
      :host(:has(.open:hover)) .cover { transform: none; }
    }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: calc(var(--ca-space-2) * -1);
    }
    .save { position: relative; z-index: 1; }
    .save.is-saved { color: var(--ca-signal); }
    .title {
      font-size: var(--ca-text-lg);
      font-weight: 600;
      line-height: 1.2;
    }
    .open {
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .open:focus-visible { outline: none; }
    .open::after { content: ''; position: absolute; inset: 0; }
    .desc {
      align-self: start;
      display: -webkit-box;
      overflow: hidden;
      color: var(--ca-text-dim);
      font-size: var(--ca-text-sm);
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .track { margin-top: var(--ca-space-2); }
    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-2);
      color: var(--ca-text-faint);
      font-size: var(--ca-text-xs);
    }
  `
})
export class ModuleCardComponent {
  module = input.required<ModuleSummary>();
  next = input(false);
  saving = input(false);

  open = output<void>();
  toggleSave = output<void>();

  protected statusClass = computed(() => {
    if (this.module().locked) return '';
    switch (this.module().status) {
      case 'COMPLETED': return 'ca-badge--secure';
      case 'IN_PROGRESS': return 'ca-badge--warn';
      case 'FAILED': return 'ca-badge--threat';
      default: return 'ca-badge--signal';
    }
  });

  protected label = computed(() => {
    const m = this.module();
    if (m.locked) return 'Bloqueado';
    if (m.status === 'COMPLETED') return `Aprobado con ${m.score ?? m.progressPercent} pts`;
    if (m.status === 'FAILED') {
      return `No aprobado · ${m.score ?? 0} pts`;
    }
    if (m.status === 'IN_PROGRESS') return `En curso, ${m.progressPercent} %`;
    return 'Sin empezar';
  });

  /** Pista compacta: se deduce de las secciones completadas (teorías en orden y práctica al final). */
  protected steps = computed<CircuitStep[]>(() => {
    const m = this.module();
    const finished = m.status === 'COMPLETED' || m.status === 'FAILED';
    return Array.from({ length: m.totalSections }, (_, i) => {
      const final = i === m.totalSections - 1;
      const label = final ? 'Práctica' : `Teoría ${i + 1}`;
      if (m.locked) return { label, final, state: 'locked' };
      if (final && m.status === 'FAILED') return { label, final, state: 'failed' };
      if (i < m.completedSections) return { label, final, state: 'done' };
      if (i === m.completedSections && !finished) return { label, final, state: 'current' };
      return { label, final, state: 'locked' };
    });
  });
}
