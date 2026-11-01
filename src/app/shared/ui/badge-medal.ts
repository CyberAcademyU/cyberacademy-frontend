import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeCode } from '../../core/models/profile.model';

interface BadgeArt {
  /** Silueta de la insignia (viewBox 64×64). */
  shape: string;
  /** Degradado del metal, de arriba abajo. Identidad de la insignia, no estado. */
  from: string;
  to: string;
}

/** Polígono regular centrado en (32,32), con la primera punta arriba. */
function polygon(sides: number, radius: number): string {
  const points = Array.from({ length: sides }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    return `${(32 + radius * Math.cos(a)).toFixed(2)} ${(32 + radius * Math.sin(a)).toFixed(2)}`;
  });
  return `M${points.join('L')}Z`;
}

/** Sello con borde dentado (alterna dos radios). */
function seal(teeth: number, outer: number, inner: number): string {
  const points = Array.from({ length: teeth * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / teeth;
    const r = i % 2 === 0 ? outer : inner;
    return `${(32 + r * Math.cos(a)).toFixed(2)} ${(32 + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${points.join('L')}Z`;
}

const ART: Record<BadgeCode, BadgeArt> = {
  PRIMER_PASO: { shape: 'M32 4L54 12V30C54 44 44 54 32 60C20 54 10 44 10 30V12Z', from: '#a7adff', to: '#4a50c4' },
  PRIMER_MODULO: { shape: polygon(6, 29), from: '#ffb684', to: '#d9562a' },
  SIN_ERRORES: { shape: seal(16, 29.5, 26.5), from: '#ffe394', to: '#cf8f17' },
  RACHA_3: { shape: 'M32 3.5Q35 3.5 37 5.5L58.5 27Q61 32 58.5 37L37 58.5Q32 61 27 58.5L5.5 37Q3 32 5.5 27L27 5.5Q29 3.5 32 3.5Z', from: '#ff9d5c', to: '#d8304a' },
  CINCO_MODULOS: { shape: polygon(5, 30), from: '#77f2c6', to: '#178a69' },
  TEMARIO_COMPLETO: { shape: 'M32 5A26 26 0 1 1 31.99 5Z', from: '#dcbcff', to: '#6d43c9' },
  IDENTIDAD: { shape: 'M20 6H44C53 6 58 11 58 20V44C58 53 53 58 44 58H20C11 58 6 53 6 44V20C6 11 11 6 20 6Z', from: '#93dbff', to: '#2f6fcc' }
};

let nextId = 0;

/**
 * Insignia ilustrada: cada logro tiene su propia forma, metal y dibujo.
 * Conseguida = a color; bloqueada = la misma pieza apagada con un candado,
 * para que el estudiante vea qué puede ganar.
 */
@Component({
  selector: 'ca-badge-medal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.is-earned]': 'earned()' },
  template: `
    <svg viewBox="0 0 64 64" [attr.width]="size()" [attr.height]="size()" fill="none"
         stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient [attr.id]="gid + '-fill'" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" [attr.stop-color]="art().from" />
          <stop offset="1" [attr.stop-color]="art().to" />
        </linearGradient>
        <linearGradient [attr.id]="gid + '-shine'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.45" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g class="art">
        @if (code() === 'TEMARIO_COMPLETO') {
          <!-- Cintas del diploma, detrás del sello -->
          <path d="M22 46L16 61L22 58L26 63L30 50Z" fill="#c7a33a" />
          <path d="M42 46L48 61L42 58L38 63L34 50Z" fill="#a8861f" />
        }
        <path [attr.d]="art().shape" [attr.fill]="'url(#' + gid + '-fill)'" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5" />
        <path [attr.d]="art().shape" [attr.fill]="'url(#' + gid + '-shine)'" />
        <path [attr.d]="art().shape" stroke="rgb(255 255 255 / 0.45)" stroke-width="1.2"
              transform="translate(32 32) scale(0.82) translate(-32 -32)" />

        <g class="glyph">
          @switch (code()) {
            @case ('PRIMER_PASO') {
              <!-- Huellas: el primer paso -->
              <g fill="#fff">
                <ellipse cx="26" cy="39" rx="4.2" ry="6.4" transform="rotate(-14 26 39)" />
                <circle cx="22.6" cy="30.6" r="1.5" /><circle cx="25.6" cy="29.8" r="1.5" /><circle cx="28.5" cy="30.6" r="1.4" />
                <ellipse cx="38" cy="27" rx="4.2" ry="6.4" transform="rotate(14 38 27)" />
                <circle cx="35.5" cy="18.4" r="1.4" /><circle cx="38.4" cy="17.8" r="1.5" /><circle cx="41.4" cy="18.8" r="1.5" />
              </g>
            }
            @case ('PRIMER_MODULO') {
              <!-- Chip con visto bueno: primer módulo superado -->
              <g stroke="#fff" stroke-width="2.4">
                <rect x="21" y="21" width="22" height="22" rx="3.5" />
                <path d="M26 17v4M32 17v4M38 17v4M26 43v4M32 43v4M38 43v4M17 26h4M17 32h4M17 38h4M43 26h4M43 32h4M43 38h4" />
                <path d="M26.5 32.5l3.8 3.8 7.5-8" stroke-width="3" />
              </g>
            }
            @case ('SIN_ERRORES') {
              <!-- Diana con flecha en el centro: 100 puntos -->
              <g stroke="#fff" stroke-width="2.4">
                <circle cx="31" cy="33" r="13" />
                <circle cx="31" cy="33" r="7.5" />
                <path d="M31 33L46 18M41 17.5h5.5V23" />
              </g>
              <circle cx="31" cy="33" r="2.6" fill="#fff" />
            }
            @case ('RACHA_3') {
              <!-- Llama con tres marcas: tres días seguidos -->
              <path d="M32 44c-6 0-9.5-3.8-9.5-9 0-4.8 3.5-7.4 4.9-11.6 2.2 1.8 3.3 3.8 3.6 5.9 1.8-2.4 2.9-5.6 2.2-9.8 5.3 3.4 8.8 8.8 8.8 15.5 0 5.2-3.6 9-10 9z" fill="#fff" />
              <path d="M32 44c-2.4 0-4-1.6-4-3.9 0-2.2 1.6-3.6 2.4-5.5 1.2 1 1.9 2.1 2.2 3.4.8-.8 1.3-1.9 1.3-3.3 1.8 1.5 3 3.2 3 5.3 0 2.4-2 4-4.9 4z" [attr.fill]="art().to" />
              <g fill="#fff"><circle cx="25" cy="51" r="2" /><circle cx="32" cy="51" r="2" /><circle cx="39" cy="51" r="2" /></g>
            }
            @case ('CINCO_MODULOS') {
              <!-- Cinco módulos: el número sobre un pentágono -->
              <text x="32" y="41.5" text-anchor="middle" fill="#fff" font-size="24" font-weight="700"
                    font-family="Sora, 'Segoe UI', sans-serif">5</text>
              <path d="M24 46h16" stroke="#fff" stroke-width="2.4" />
            }
            @case ('TEMARIO_COMPLETO') {
              <!-- Birrete: temario completo -->
              <g fill="#fff">
                <path d="M32 18L51 26L32 34L13 26Z" />
                <path d="M21 30.5v7c0 3.6 22 3.6 22 0v-7L32 35.5Z" />
              </g>
              <path d="M47.5 27.5v9" stroke="#ffd76a" stroke-width="2" />
              <circle cx="47.5" cy="38" r="2.2" fill="#ffd76a" />
            }
            @case ('IDENTIDAD') {
              <!-- Credencial con avatar: identidad completa -->
              <g stroke="#fff" stroke-width="2.4">
                <rect x="15" y="20" width="34" height="24" rx="3.5" />
                <path d="M33 28h10M33 33h10M33 38h6" />
              </g>
              <circle cx="24" cy="29" r="3.6" fill="#fff" />
              <path d="M17.8 40.5c.8-3.6 3.2-5.6 6.2-5.6s5.4 2 6.2 5.6z" fill="#fff" />
            }
          }
        </g>
      </g>

      @if (!earned()) {
        <g class="lock">
          <circle cx="50" cy="50" r="10" />
          <rect x="45.5" y="49" width="9" height="7" rx="1.2" />
          <path d="M47.5 49v-2a2.5 2.5 0 0 1 5 0v2" />
        </g>
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
    svg { overflow: visible; }
    .art {
      filter: grayscale(1) brightness(0.45) contrast(0.9);
      opacity: 0.75;
      transition: filter var(--ca-slow) var(--ca-ease-out), opacity var(--ca-slow) var(--ca-ease-out);
    }
    :host(.is-earned) .art {
      filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.45));
      opacity: 1;
    }
    .lock circle { fill: var(--ca-raised); stroke: var(--ca-line-strong); stroke-width: 1.5; }
    .lock rect, .lock path { stroke: var(--ca-text-dim); stroke-width: 1.6; }
  `
})
export class BadgeMedalComponent {
  code = input.required<BadgeCode>();
  earned = input(false);
  size = input(56);

  /** Ids únicos de los degradados: varias medallas conviven en la misma página. */
  protected readonly gid = `badge-${nextId++}`;
  protected readonly art = computed(() => ART[this.code()]);
}
