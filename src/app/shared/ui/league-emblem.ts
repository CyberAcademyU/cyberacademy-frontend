import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LeagueCode } from '../../core/models/profile.model';

const TIERS: LeagueCode[] = ['RECLUTA', 'ANALISTA', 'DEFENSOR', 'CENTINELA', 'ELITE'];

/**
 * Emblema hexagonal de la liga: cada liga suma un galón, y Élite corona con un rombo.
 * La forma distingue la liga aunque no se perciba el color.
 */
@Component({
  selector: 'ca-league-emblem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.--tier]': 'color()' },
  template: `
    <svg viewBox="0 0 48 48" [attr.width]="size()" [attr.height]="size()" fill="none">
      <path class="plate" d="M24 3l18 10.5v21L24 45 6 34.5v-21z" />
      <path class="rim" d="M24 7.5l14.2 8.3v16.4L24 40.5 9.8 32.2V15.8z" />
      @for (y of chevrons(); track y) {
        <path class="chevron" [attr.d]="'M16 ' + y + 'l8 4.6 8-4.6'" />
      }
      @if (code() === 'ELITE') {
        <path class="crown" d="M24 10.5l3 3.5-3 3.5-3-3.5z" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
    .plate { fill: color-mix(in srgb, var(--tier) 14%, transparent); stroke: var(--tier); stroke-width: 1.8; stroke-linejoin: round; }
    .rim { stroke: color-mix(in srgb, var(--tier) 45%, transparent); stroke-width: 1; stroke-dasharray: 2 3; }
    .chevron { stroke: var(--tier); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
    .crown { fill: var(--tier); filter: drop-shadow(0 0 3px var(--tier)); }
  `
})
export class LeagueEmblemComponent {
  code = input.required<LeagueCode>();
  size = input(40);

  protected color = computed(() => `var(--ca-tier-${this.code().toLowerCase()})`);

  /** Galones centrados verticalmente: 1 en Recluta … 4 en Centinela y Élite. */
  protected chevrons = computed(() => {
    const count = Math.min(TIERS.indexOf(this.code()) + 1, 4);
    const gap = 6;
    const start = 24 - ((count - 1) * gap) / 2 - 2;
    return Array.from({ length: count }, (_, i) => start + i * gap + (this.code() === 'ELITE' ? 3 : 0));
  });
}
