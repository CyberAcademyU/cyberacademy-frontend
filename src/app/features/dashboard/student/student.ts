import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import {
  ModuleProgress,
  ModuleSummary,
  ProgressStatus,
  SectionProgress
} from '../../../core/models/course-module.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student.html',
  styleUrl: './student.css'
})
export class StudentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private modulesService = inject(ModulesService);
  private router = inject(Router);

  user = this.authService.currentUserSignal;
  studentName = computed(() => this.user()?.firstName || 'Estudiante');

  // Catálogo con mi progreso
  summaries = signal<ModuleSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Detalle del módulo seleccionado
  selectedProgress = signal<ModuleProgress | null>(null);
  loadingDetail = signal(false);
  scores = signal<Record<string, number | null>>({});
  savingSectionId = signal<string | null>(null);
  modalMessage = signal<string | null>(null);

  // Resultados
  showResultsModal = signal(false);

  completedCount = computed(() => this.summaries().filter(m => m.status === 'COMPLETED').length);

  averageScore = computed<number | null>(() => {
    const scored = this.summaries().filter(m => m.score !== null);
    if (!scored.length) return null;
    const total = scored.reduce((sum, m) => sum + Number(m.score), 0);
    return Math.round((total / scored.length) * 10) / 10;
  });

  overallProgress = computed<number>(() => {
    const list = this.summaries();
    if (!list.length) return 0;
    const total = list.reduce((sum, m) => sum + Number(m.progressPercent), 0);
    return Math.round((total / list.length) * 10) / 10;
  });

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress(): void {
    this.loading.set(true);
    this.error.set(null);

    this.modulesService.getMyProgress().subscribe({
      next: (res) => {
        this.summaries.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.readError(err, 'No se pudo cargar tu progreso.'));
      }
    });
  }

  openModule(summary: ModuleSummary): void {
    this.loadingDetail.set(true);
    this.selectedProgress.set(null);
    this.modalMessage.set(null);

    this.modulesService.getModuleProgress(summary.moduleId).subscribe({
      next: (res) => {
        const progress = res.data;
        if (!progress) {
          this.loadingDetail.set(false);
          this.error.set('No se recibió el detalle del módulo.');
          return;
        }
        this.selectedProgress.set(progress);
        this.scores.set(this.buildScoreDrafts(progress.sections));
        this.loadingDetail.set(false);
      },
      error: (err) => {
        this.loadingDetail.set(false);
        this.error.set(this.readError(err, 'No se pudo cargar el módulo.'));
      }
    });
  }

  closeModule(): void {
    this.selectedProgress.set(null);
    this.loadingDetail.set(false);
    this.modalMessage.set(null);
  }

  setDraft(sectionId: string, value: number | string | null): void {
    const parsed = value === null || value === '' ? null : Number(value);
    this.scores.update((drafts) => ({ ...drafts, [sectionId]: parsed }));
  }

  saveScore(section: SectionProgress): void {
    const progress = this.selectedProgress();
    if (!progress) return;

    const score = this.scores()[section.sectionId];
    if (score === null || score === undefined || Number.isNaN(score)) {
      this.modalMessage.set('Ingresa una nota entre 0 y 100.');
      return;
    }
    if (score < 0 || score > 100) {
      this.modalMessage.set('La nota debe estar entre 0 y 100.');
      return;
    }

    this.savingSectionId.set(section.sectionId);
    this.modalMessage.set(null);

    this.modulesService
      .recordScore(progress.summary.moduleId, section.sectionId, { score, completed: true })
      .subscribe({
        next: (res) => {
          const updated = res.data;
          if (!updated) {
            this.savingSectionId.set(null);
            this.modalMessage.set('No se recibió la respuesta del servidor.');
            return;
          }
          this.selectedProgress.set(updated);
          this.scores.set(this.buildScoreDrafts(updated.sections));
          this.summaries.update((list) =>
            list.map((item) => (item.moduleId === updated.summary.moduleId ? updated.summary : item))
          );
          this.savingSectionId.set(null);
          this.modalMessage.set('Nota guardada. El estado del módulo se actualizó automáticamente.');
        },
        error: (err) => {
          this.savingSectionId.set(null);
          this.modalMessage.set(this.readError(err, 'No se pudo guardar la nota.'));
        }
      });
  }

  openResults(): void {
    this.showResultsModal.set(true);
  }

  closeResults(): void {
    this.showResultsModal.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  statusLabel(status: ProgressStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'IN_PROGRESS':
        return 'En curso';
      case 'FAILED':
        return 'No aprobado';
      default:
        return 'Disponible';
    }
  }

  cardLabel(summary: ModuleSummary): string {
    if (summary.status === 'COMPLETED') {
      return `Completado · ${summary.score ?? summary.progressPercent} pts`;
    }
    if (summary.status === 'FAILED') {
      return `No aprobado · ${summary.score ?? 0} pts`;
    }
    if (summary.status === 'IN_PROGRESS') {
      return `En curso · ${summary.progressPercent}%`;
    }
    return 'Disponible';
  }

  statusClass(status: ProgressStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'badge-completed';
      case 'IN_PROGRESS':
        return 'badge-in-progress';
      case 'FAILED':
        return 'badge-failed';
      default:
        return 'badge-not-started';
    }
  }

  sectionLabel(section: SectionProgress): string {
    return section.type === 'PRACTICE' ? 'Práctica' : `Teoría ${section.order}`;
  }

  private buildScoreDrafts(sections: SectionProgress[]): Record<string, number | null> {
    const drafts: Record<string, number | null> = {};
    for (const section of sections) {
      drafts[section.sectionId] = section.score;
    }
    return drafts;
  }

  private readError(err: unknown, fallback: string): string {
    const error = err as { status?: number; error?: { message?: string } };
    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    return error?.error?.message || fallback;
  }
}

// Exportación con el nombre que usan las rutas
export { StudentDashboardComponent as StudentComponent };
