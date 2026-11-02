import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog';
import { AuthService } from '../../core/services/auth';
import { PublicModule } from '../../core/models/catalog.model';
import { PublicNavComponent } from '../../shared/ui/public-nav';
import { ModuleCoverComponent } from '../../shared/ui/module-cover';
import { IconComponent } from '../../shared/ui/icon';

/** Catálogo público de módulos: lo que se puede aprender antes de crear una cuenta. */
@Component({
  selector: 'app-explore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PublicNavComponent, IconComponent, ModuleCoverComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class ExploreComponent implements OnInit {
  private catalog = inject(CatalogService);
  private auth = inject(AuthService);

  modules = signal<PublicModule[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  protected readonly signedIn = computed(() => !!this.auth.currentUserSignal() && this.auth.isAuthenticated());
  /** Con sesión, "Empezar" lleva al panel; sin sesión, al login (que luego redirige al panel). */
  protected readonly startLink = computed(() =>
    !this.signedIn() ? '/auth/login' : this.auth.isAdmin() ? '/dashboard/admin' : '/dashboard/student'
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.getPublicModules().subscribe({
      next: res => {
        this.modules.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el catálogo. Comprueba tu conexión e inténtalo de nuevo.');
      }
    });
  }
}
