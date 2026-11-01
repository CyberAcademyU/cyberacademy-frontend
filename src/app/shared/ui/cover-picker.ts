import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MODULE_COVERS, ModuleCoverComponent, ModuleCoverKey } from './module-cover';

/**
 * Selector de portada del catálogo cerrado: miniaturas como radios nativos (teclado y lector
 * de pantalla funcionan solos). "Automática" deja la portada sin elegir ('').
 */
@Component({
  selector: 'ca-cover-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModuleCoverComponent],
  template: `
    <fieldset class="picker" [disabled]="disabled()">
      <legend>{{ legend() }}</legend>
      <div class="grid">
        <label class="item" [class.is-selected]="!value()">
          <input type="radio" [name]="name()" value="" [checked]="!value()" (change)="valueChange.emit('')" />
          <ca-module-cover class="thumb" [seed]="seed()" />
          <span>Automática</span>
        </label>
        @for (c of covers; track c.key) {
          <label class="item" [class.is-selected]="value() === c.key">
            <input type="radio" [name]="name()" [value]="c.key" [checked]="value() === c.key"
                   (change)="valueChange.emit(c.key)" />
            <ca-module-cover class="thumb" [cover]="c.key" />
            <span>{{ c.label }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
  styles: `
    .picker { margin: 0; padding: 0; border: 0; min-width: 0; }
    .picker[disabled] { opacity: 0.6; }
    legend {
      margin-bottom: var(--ca-space-2);
      padding: 0;
      color: var(--ca-text-dim);
      font-size: var(--ca-text-sm);
      font-weight: 500;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
      gap: var(--ca-space-2);
    }
    .item {
      position: relative;
      display: grid;
      gap: var(--ca-space-1);
      padding: 4px;
      border: 1px solid var(--ca-line);
      border-radius: var(--ca-radius-sm);
      background: var(--ca-deck);
      color: var(--ca-text-dim);
      font-size: var(--ca-text-xs);
      cursor: pointer;
      transition: border-color var(--ca-fast) var(--ca-ease-out), color var(--ca-fast) var(--ca-ease-out);
    }
    .item:hover { border-color: var(--ca-line-strong); color: var(--ca-text); }
    .item.is-selected {
      border-color: var(--ca-signal);
      color: var(--ca-text);
      box-shadow: 0 0 0 1px var(--ca-signal);
    }
    .item:has(input:focus-visible) { box-shadow: var(--ca-focus); }
    .item span { padding: 0 4px 2px; line-height: 1.3; }
    input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .thumb {
      aspect-ratio: 16 / 9;
      border-radius: 6px;
    }
  `
})
export class CoverPickerComponent {
  value = input<string | null | undefined>('');
  /** Código del módulo: decide qué abstracta se ve en "Automática". */
  seed = input('');
  name = input('cover');
  legend = input('Portada');
  disabled = input(false);

  valueChange = output<ModuleCoverKey | ''>();

  protected readonly covers = MODULE_COVERS;
}
