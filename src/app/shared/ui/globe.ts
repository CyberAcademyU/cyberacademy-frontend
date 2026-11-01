import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Dot { x: number; y: number; r: number; o: number; land: boolean; }
interface Arc { d: string; length: number; delay: number; }
interface Node { x: number; y: number; delay: number; }

const SIZE = 1000;
const C = SIZE / 2;
const R = 430;
const TILT = (-22 * Math.PI) / 180;   // inclinación hacia el espectador
const TURN = (35 * Math.PI) / 180;    // giro sobre el eje vertical

type Vec = [number, number, number];

/** Rota un punto de la esfera y lo deja listo para proyectar (z > 0 = cara visible). */
function orient([x, y, z]: Vec): Vec {
  const x1 = x * Math.cos(TURN) + z * Math.sin(TURN);
  const z1 = -x * Math.sin(TURN) + z * Math.cos(TURN);
  const y2 = y * Math.cos(TILT) - z1 * Math.sin(TILT);
  const z2 = y * Math.sin(TILT) + z1 * Math.cos(TILT);
  return [x1, y2, z2];
}

const project = ([x, y]: Vec, scale = R): [number, number] => [C + x * scale, C - y * scale];

/** "Continentes" inventados: un campo suave de senos que agrupa los puntos en manchas. */
function isLand(lat: number, lon: number): boolean {
  const f = Math.sin(lat * 3.1 + 0.6) * Math.cos(lon * 2.2)
    + 0.7 * Math.sin(lon * 4.7 + lat * 1.9)
    + 0.45 * Math.cos(lat * 6.3 - lon * 1.3);
  return f > 0.15;
}

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  const n = 1400;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const p: Vec = [Math.cos(theta) * ring, y, Math.sin(theta) * ring];
    const [ox, oy, oz] = orient(p);
    if (oz <= 0.02) continue;
    const land = isLand(Math.asin(y), theta % (2 * Math.PI));
    const [sx, sy] = project([ox, oy, oz]);
    dots.push({
      x: +sx.toFixed(1),
      y: +sy.toFixed(1),
      r: +(land ? 2.2 + oz * 1.8 : 1.2 + oz).toFixed(2),
      o: +(land ? 0.25 + oz * 0.6 : 0.06 + oz * 0.12).toFixed(2),
      land
    });
  }
  return dots;
}

/**
 * Ciudades ficticias unidas por arcos. Coordenadas (lat, lon en grados) ya vistas desde la
 * cámara: lat 0 / lon 0 es el centro del disco. La portada solo muestra el casquete superior.
 */
const CITIES: [number, number][] = [
  [48, -38], [34, -8], [58, 12], [26, 30], [44, 46], [18, -44], [64, -14], [30, 62], [52, 74]
];
const LINKS: [number, number][] = [[0, 1], [1, 3], [1, 2], [2, 4], [3, 4], [5, 1], [6, 2], [4, 7], [0, 6], [4, 8], [3, 7]];

function fromLatLon(lat: number, lon: number): Vec {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function buildNetwork(): { arcs: Arc[]; nodes: Node[] } {
  const points = CITIES.map(([lat, lon]) => fromLatLon(lat, lon));
  const nodes = points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p[2] > 0.05)
    .map(({ p, i }) => {
      const [x, y] = project(p);
      return { x: +x.toFixed(1), y: +y.toFixed(1), delay: 1.4 + i * 0.12 };
    });

  const arcs = LINKS
    .filter(([a, b]) => points[a][2] > 0.05 && points[b][2] > 0.05)
    .map(([a, b], i) => {
      const pa = points[a];
      const pb = points[b];
      const mid: Vec = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2];
      const len = Math.hypot(...mid) || 1;
      const chord = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
      const lift = 1 + chord * 0.45; // cuanto más lejos, más alto el arco
      const ctrl = project([mid[0] / len * lift, mid[1] / len * lift, mid[2] / len * lift]);
      const [x0, y0] = project(pa);
      const [x1, y1] = project(pb);
      const length = Math.hypot(ctrl[0] - x0, ctrl[1] - y0) + Math.hypot(x1 - ctrl[0], y1 - ctrl[1]);
      return {
        d: `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
        length: Math.ceil(length),
        delay: 0.9 + i * 0.14
      };
    });

  return { arcs, nodes };
}

/**
 * Globo de puntos con una red de conexiones: la imagen de la portada.
 * Se calcula una vez (geometría fija). La animación es una única secuencia de
 * arranque (aparece el globo, se trazan los arcos, se encienden los nodos) y
 * después un pulso lento por los arcos; todo se desactiva con reduced-motion.
 */
@Component({
  selector: 'ca-globe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" fill="none">
      <defs>
        <radialGradient id="globe-body" cx="42%" cy="30%" r="75%">
          <stop offset="0" stop-color="#1a1c33" />
          <stop offset="0.6" stop-color="#0d0d14" />
          <stop offset="1" stop-color="#070709" />
        </radialGradient>
        <radialGradient id="globe-limb" cx="50%" cy="50%" r="50%">
          <stop offset="0.86" stop-color="rgb(143 151 255)" stop-opacity="0" />
          <stop offset="0.985" stop-color="rgb(143 151 255)" stop-opacity="0.35" />
          <stop offset="1" stop-color="rgb(143 151 255)" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="arc-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--ca-warn)" />
          <stop offset="1" stop-color="var(--ca-signal)" />
        </linearGradient>
      </defs>

      <g class="body">
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r + 26" fill="url(#globe-limb)" />
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="url(#globe-body)" />
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" class="rim" />
        @for (dot of dots; track $index) {
          <circle [attr.cx]="dot.x" [attr.cy]="dot.y" [attr.r]="dot.r" [attr.opacity]="dot.o"
                  [class.land]="dot.land" class="dot" />
        }
      </g>

      <g class="network">
        @for (arc of network.arcs; track $index) {
          <path [attr.d]="arc.d" class="arc" [style.--len]="arc.length" [style.animation-delay.s]="arc.delay" />
          <path [attr.d]="arc.d" class="pulse" [style.--len]="arc.length"
                [style.animation-delay.s]="arc.delay + 1.2 + $index * 0.7" />
        }
        @for (node of network.nodes; track $index) {
          <circle [attr.cx]="node.x" [attr.cy]="node.y" r="14" class="halo" [style.animation-delay.s]="node.delay" />
          <circle [attr.cx]="node.x" [attr.cy]="node.y" r="5" class="node" [style.animation-delay.s]="node.delay" />
        }
      </g>
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; overflow: visible; }

    .body { animation: rise 1.4s var(--ca-ease-out) both; transform-origin: 50% 60%; }
    .rim { stroke: rgb(143 151 255 / 0.28); stroke-width: 1.5; }
    .dot { fill: #c9cdf5; }
    .dot.land { fill: #d9dcff; }

    .arc {
      stroke: url(#arc-light);
      stroke-width: 2;
      stroke-linecap: round;
      opacity: 0.75;
      stroke-dasharray: var(--len);
      stroke-dashoffset: var(--len);
      animation: draw 1.1s var(--ca-ease-out) forwards;
    }
    .pulse {
      stroke: #fff;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-dasharray: 26 var(--len);
      stroke-dashoffset: 26;
      opacity: 0;
      filter: drop-shadow(0 0 6px var(--ca-warn));
      animation: travel 5.5s linear infinite;
    }
    .node {
      fill: var(--ca-warn);
      opacity: 0;
      animation: appear 0.4s ease forwards;
    }
    .halo {
      fill: rgb(255 138 76 / 0.22);
      opacity: 0;
      animation: appear 0.6s ease forwards;
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
    }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes appear { to { opacity: 1; } }
    @keyframes travel {
      0% { stroke-dashoffset: 26; opacity: 0; }
      8% { opacity: 1; }
      45% { stroke-dashoffset: calc(var(--len) * -1); opacity: 1; }
      50%, 100% { stroke-dashoffset: calc(var(--len) * -1); opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .body { animation: none; }
      .arc { stroke-dashoffset: 0; animation: none; }
      .node, .halo { opacity: 1; animation: none; }
      .pulse { display: none; }
    }
  `
})
export class GlobeComponent {
  protected readonly size = SIZE;
  protected readonly c = C;
  protected readonly r = R;
  protected readonly dots = buildDots();
  protected readonly network = buildNetwork();
}
