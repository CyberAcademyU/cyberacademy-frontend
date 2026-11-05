import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-theory-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imageUrls().length || videoUrl()) {
      <section class="resources" aria-label="Recursos de la teoría">
        <h4>Recursos para aprender</h4>
        @if (imageUrls().length) {
          <div class="images">
            @for (url of imageUrls(); track $index; let i = $index) {
              <figure><img [src]="url" [alt]="'Imagen de apoyo ' + (i + 1) + ' para ' + title()" loading="lazy" referrerpolicy="no-referrer" /></figure>
            }
          </div>
        }
        @if (youtubeEmbed(); as embed) {
          <iframe [src]="embed" [title]="'Video de apoyo para ' + title()" loading="lazy"
                  referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>
        } @else if (directVideo(); as video) {
          <video controls preload="metadata" [src]="video" [attr.aria-label]="'Video de apoyo para ' + title()"></video>
        } @else if (safeVideoUrl(); as link) {
          <a [href]="link" target="_blank" rel="noopener noreferrer" class="ca-link">Abrir video de apoyo</a>
        }
      </section>
    }
  `,
  styles: `
    .resources { display: grid; gap: var(--ca-space-4); margin-block: var(--ca-space-6); }
    h4 { margin: 0; font-family: var(--ca-font-display); font-size: var(--ca-text-md); }
    .images { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--ca-space-3); }
    figure { margin: 0; overflow: hidden; border: 1px solid var(--ca-line); border-radius: var(--ca-radius-sm); background: var(--ca-deck); }
    img { display: block; width: 100%; max-height: 360px; object-fit: contain; }
    iframe, video { width: 100%; max-width: 760px; aspect-ratio: 16 / 9; border: 1px solid var(--ca-line); border-radius: var(--ca-radius-sm); background: var(--ca-void); }
  `
})
export class TheoryMediaComponent {
  private sanitizer = inject(DomSanitizer);
  title = input.required<string>();
  imageUrl1 = input<string | null>(null);
  imageUrl2 = input<string | null>(null);
  videoUrl = input<string | null>(null);

  private httpsUrl(value: string | null): URL | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url : null;
    } catch { return null; }
  }

  imageUrls = computed(() => [this.imageUrl1(), this.imageUrl2()]
    .map(value => this.httpsUrl(value)?.href).filter((value): value is string => !!value));
  safeVideoUrl = computed(() => this.httpsUrl(this.videoUrl())?.href ?? null);
  directVideo = computed(() => {
    const url = this.httpsUrl(this.videoUrl());
    return url && /\.(mp4|webm)$/i.test(url.pathname) ? url.href : null;
  });
  youtubeEmbed = computed(() => {
    const url = this.httpsUrl(this.videoUrl());
    if (!url) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/embed\/([^/]+)$/)?.[1] ?? null;
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${id}`)
      : null;
  });
}
