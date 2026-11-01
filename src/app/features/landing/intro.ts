import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicNavComponent } from '../../shared/ui/public-nav';
import { GlobeComponent } from '../../shared/ui/globe';
import { IconComponent } from '../../shared/ui/icon';

/** Video de fondo de la portada (public/intro/). Si no existe o falla, se usa el globo SVG. */
const INTRO_VIDEO = 'intro/earth.mp4';

/** Portada (ruta raíz): presentación y entrada al catálogo de módulos. */
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PublicNavComponent, GlobeComponent, IconComponent],
  templateUrl: './intro.html',
  styleUrl: './intro.css'
})
export class IntroComponent {
  protected readonly videoSrc = INTRO_VIDEO;

  /**
   * El video solo se descarga en pantallas anchas y sin "reducir movimiento":
   * en móvil ahorra datos y el globo SVG pesa unos pocos KB.
   */
  protected readonly useVideo = signal(
    typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(min-width: 761px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  protected readonly videoReady = signal(false);

  protected onVideoError(): void {
    this.useVideo.set(false);
  }
}
