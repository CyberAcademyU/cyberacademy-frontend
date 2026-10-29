import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModuleStreamService } from '../../../core/services/module-stream';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import {
  ModuleProgress,
  ModuleSummary,
  ProgressStatus,
  SectionContent,
  SectionProgress
} from '../../../core/models/course-module.model';

interface ActionMessage {
  text: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student.html',
  styleUrl: './student.css'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private modulesService = inject(ModulesService);
  private router = inject(Router);
  private moduleStream = inject(ModuleStreamService);
  private streamSubscription?: Subscription;

  user = this.authService.currentUserSignal;
  studentName = computed(() => this.user()?.firstName || 'Estudiante');

  // Catálogo con mi progreso
  summaries = signal<ModuleSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Detalle del módulo seleccionado
  selectedProgress = signal<ModuleProgress | null>(null);
  loadingDetail = signal(false);

  // Sesión desbloqueada actual
  currentContent = signal<SectionContent | null>(null);
  loadingSection = signal(false);
  action = signal<ActionMessage | null>(null);

  // Pregunta de comprensión de la teoría
  theorySelection = signal<string | null>(null);
  checking = signal(false);

  // Práctica (un solo intento)
  practiceAnswers = signal<Record<string, string>>({});
  submittingPractice = signal(false);

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

  answeredCount = computed(() => {
    const content = this.currentContent();
    if (!content) return 0;
    const answers = this.practiceAnswers();
    return content.questions.filter((question) => !!answers[question.id]).length;
  });

  ngOnInit(): void {
    this.streamSubscription = this.moduleStream.connect().subscribe(() => this.syncNewModules());
    this.loadProgress();
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
  }

  private syncNewModules(): void {
    this.modulesService.getMyProgress().subscribe({
      next: res => this.mergeNewModules(res.data ?? []),
      error: () => { /* El siguiente evento o reconexión permitirá reintentar. */ }
    });
  }

  private mergeNewModules(incoming: ModuleSummary[]): void {
    this.summaries.update(current => {
      const known = new Set(current.map(item => item.moduleId));
      return [...current, ...incoming.filter(item => !known.has(item.moduleId))]
        .sort((a, b) => a.orderIndex - b.orderIndex);
    });
  }

  loadProgress(): void {
    this.loading.set(true);
    this.error.set(null);

    this.modulesService.getMyProgress().subscribe({
      next: (res) => {
        this.mergeNewModules(res.data ?? []);
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
    this.currentContent.set(null);
    this.action.set(null);
    this.theorySelection.set(null);
    this.practiceAnswers.set({});

    this.modulesService.getModuleProgress(summary.moduleId).subscribe({
      next: (res) => {
        const progress = res.data;
        if (!progress) {
          this.loadingDetail.set(false);
          this.error.set('No se recibió el detalle del módulo.');
          return;
        }
        this.selectedProgress.set(progress);
        this.loadingDetail.set(false);
        this.loadCurrentSection(progress);
      },
      error: (err) => {
        this.loadingDetail.set(false);
        this.error.set(this.readError(err, 'No se pudo cargar el módulo.'));
      }
    });
  }

  closeModule(): void {
    this.selectedProgress.set(null);
    this.currentContent.set(null);
    this.loadingDetail.set(false);
    this.loadingSection.set(false);
    this.action.set(null);
    this.theorySelection.set(null);
    this.practiceAnswers.set({});
  }

  selectTheoryOption(optionId: string): void {
    this.theorySelection.set(optionId);
  }

  checkTheory(): void {
    const content = this.currentContent();
    const progress = this.selectedProgress();
    const optionId = this.theorySelection();
    const question = content?.questions[0];

    if (!content || !progress || !question) return;
    if (!optionId) {
      this.action.set({ text: 'Selecciona una opción para comprobar tu respuesta.', type: 'error' });
      return;
    }

    this.checking.set(true);
    this.action.set(null);

    this.modulesService
      .checkAnswer(progress.summary.moduleId, content.sectionId, {
        questionId: question.id,
        optionId
      })
      .subscribe({
        next: (res) => {
          this.checking.set(false);
          const result = res.data;
          if (!result) {
            this.action.set({ text: 'No se recibió la respuesta del servidor.', type: 'error' });
            return;
          }

          if (result.correct) {
            this.action.set({ text: result.message, type: 'success' });
            this.refreshAfterAction(progress.summary.moduleId);
          } else {
            this.action.set({ text: result.message, type: 'error' });
            this.theorySelection.set(null);
          }
        },
        error: (err) => {
          this.checking.set(false);
          this.action.set({
            text: this.readError(err, 'No se pudo comprobar la respuesta.'),
            type: 'error'
          });
        }
      });
  }

  selectPracticeOption(questionId: string, optionId: string): void {
    this.practiceAnswers.update((answers) => ({ ...answers, [questionId]: optionId }));
  }

  submitPractice(): void {
    const content = this.currentContent();
    const progress = this.selectedProgress();
    if (!content || !progress) return;

    if (this.answeredCount() < content.questions.length) {
      this.action.set({
        text: 'Debes responder todas las preguntas antes de enviar la práctica.',
        type: 'error'
      });
      return;
    }

    const confirmed = window.confirm(
      '¿Enviar la práctica? Solo tienes un intento y después no podrás volver a las sesiones anteriores.'
    );
    if (!confirmed) return;

    const answers = content.questions.map((question) => ({
      questionId: question.id,
      optionId: this.practiceAnswers()[question.id]
    }));

    this.submittingPractice.set(true);
    this.action.set(null);

    this.modulesService.submitPractice(progress.summary.moduleId, { answers }).subscribe({
      next: (res) => {
        this.submittingPractice.set(false);
        const updated = res.data;
        if (!updated) {
          this.action.set({ text: 'No se recibió la nota de la práctica.', type: 'error' });
          return;
        }

        this.selectedProgress.set(updated);
        this.currentContent.set(null);
        this.theorySelection.set(null);
        this.practiceAnswers.set({});
        this.summaries.update((list) =>
          list.map((item) => (item.moduleId === updated.summary.moduleId ? updated.summary : item))
        );

        this.action.set({
          text: updated.summary.passed
            ? `Práctica enviada. Nota: ${updated.summary.score} pts. ¡Aprobaste el módulo!`
            : `Práctica enviada. Nota: ${updated.summary.score} pts. No alcanzaste la nota mínima de ${updated.summary.passingScore} pts.`,
          type: updated.summary.passed ? 'success' : 'error'
        });
      },
      error: (err) => {
        this.submittingPractice.set(false);
        this.action.set({
          text: this.readError(err, 'No se pudo enviar la práctica.'),
          type: 'error'
        });
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

  sectionStateLabel(section: SectionProgress): string {
    if (section.status === 'COMPLETED') return 'Completada';
    if (section.accessible) return 'Disponible ahora';
    return 'Bloqueada';
  }

  sectionStateClass(section: SectionProgress): string {
    if (section.status === 'COMPLETED') return 'badge-completed';
    if (section.accessible) return 'badge-in-progress';
    return 'badge-not-started';
  }

  moduleFinished(progress: ModuleProgress): boolean {
    return progress.summary.status === 'COMPLETED' || progress.summary.status === 'FAILED';
  }

  private loadCurrentSection(progress: ModuleProgress): void {
    const current = progress.sections.find((section) => section.accessible);
    this.theorySelection.set(null);
    this.practiceAnswers.set({});

    if (!current) {
      this.currentContent.set(null);
      return;
    }

    this.loadingSection.set(true);
    this.modulesService.getSection(progress.summary.moduleId, current.sectionId).subscribe({
      next: (res) => {
        this.currentContent.set(res.data ?? null);
        this.loadingSection.set(false);
      },
      error: (err) => {
        this.loadingSection.set(false);
        this.currentContent.set(null);
        this.action.set({
          text: this.readError(err, 'No se pudo cargar la sesión.'),
          type: 'error'
        });
      }
    });
  }

  private refreshAfterAction(moduleId: string): void {
    this.modulesService.getModuleProgress(moduleId).subscribe({
      next: (res) => {
        const progress = res.data;
        if (!progress) return;
        this.selectedProgress.set(progress);
        this.summaries.update((list) =>
          list.map((item) => (item.moduleId === progress.summary.moduleId ? progress.summary : item))
        );
        this.loadCurrentSection(progress);
      },
      error: (err) => {
        this.action.set({
          text: this.readError(err, 'No se pudo actualizar el progreso.'),
          type: 'error'
        });
      }
    });
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
