import { ChangeDetectionStrategy, Component, Injector, OnInit, OnDestroy, afterNextRender, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModuleStreamService } from '../../../core/services/module-stream';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import {
  CheckAnswerResponse,
  ModuleProgress,
  ModuleSummary,
  PracticeReview,
  ProgressStatus,
  SectionContent,
  SectionProgress
} from '../../../core/models/course-module.model';
import { ProfileService } from '../../../core/services/profile';
import { ModuleCoverComponent } from '../../../shared/ui/module-cover';
import { IconComponent } from '../../../shared/ui/icon';
import { CircuitStep, CircuitTrackComponent } from '../../../shared/ui/circuit-track';
import { ProgressRingComponent } from '../../../shared/ui/progress-ring';
import { AppHeaderComponent } from '../../../shared/ui/app-header';
import { LeagueEmblemComponent } from '../../../shared/ui/league-emblem';
import { BadgeMedalComponent } from '../../../shared/ui/badge-medal';
import { ModuleCardComponent } from './module-card';

interface ActionMessage {
  text: string;
  type: 'success' | 'error';
}

export type LearningTab = 'current' | 'recent' | 'saved';

const RECENT_LIMIT = 6;

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    CircuitTrackComponent,
    ModuleCoverComponent,
    ProgressRingComponent,
    AppHeaderComponent,
    LeagueEmblemComponent,
    BadgeMedalComponent,
    ModuleCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  templateUrl: './student.html',
  styleUrl: './student.css'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private modulesService = inject(ModulesService);
  private profileService = inject(ProfileService);
  private moduleStream = inject(ModuleStreamService);
  private injector = inject(Injector);
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
  /** Retroalimentación de la última respuesta: qué pasó con la opción elegida y la lección. */
  theoryFeedback = signal<CheckAnswerResponse | null>(null);

  // Práctica (se puede reintentar mientras no esté aprobada)
  practiceAnswers = signal<Record<string, string>>({});
  submittingPractice = signal(false);
  confirmingPractice = signal(false);

  // Corrección de la práctica (solo después de enviarla)
  practiceReview = signal<PracticeReview | null>(null);
  loadingReview = signal(false);

  // Resultados
  showResultsModal = signal(false);

  // Mi aprendizaje
  learningTab = signal<LearningTab>('current');
  savingIds = signal<ReadonlySet<string>>(new Set());
  saveError = signal<string | null>(null);

  currentModules = computed(() => this.summaries().filter(m => m.status === 'IN_PROGRESS'));

  recentModules = computed(() =>
    this.summaries()
      .filter(m => m.lastActivityAt)
      .sort((a, b) => b.lastActivityAt!.localeCompare(a.lastActivityAt!))
      .slice(0, RECENT_LIMIT)
  );

  savedModules = computed(() => this.summaries().filter(m => m.saved));

  learningModules = computed(() => {
    switch (this.learningTab()) {
      case 'recent': return this.recentModules();
      case 'saved': return this.savedModules();
      default: return this.currentModules();
    }
  });

  // Liga e insignias (vienen del perfil)
  profile = this.profileService.profile;
  earnedBadges = computed(() => this.profile()?.badges.filter(b => b.earned).length ?? 0);

  /** Avance dentro de la liga actual hacia la siguiente (100 en la última). */
  leagueProgress = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    const { minXp, nextMinXp } = p.league;
    if (nextMinXp === null) return 100;
    return Math.min(100, Math.round(((p.xp - minXp) / (nextMinXp - minXp)) * 100));
  });

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

  /** Primer módulo sin terminar, en el orden del catálogo: es lo que el estudiante debería hacer ahora. */
  nextModule = computed(() =>
    this.summaries().find(m => !m.locked && m.status === 'IN_PROGRESS') ??
    this.summaries().find(m => !m.locked && m.status === 'NOT_STARTED') ??
    null
  );

  answeredCount = computed(() => {
    const content = this.currentContent();
    if (!content) return 0;
    const answers = this.practiceAnswers();
    return content.questions.filter((question) => !!answers[question.id]).length;
  });

  ngOnInit(): void {
    this.streamSubscription = this.moduleStream.connect().subscribe(() => this.syncNewModules());
    this.loadProgress();
    this.profileService.refresh();
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
    this.summaries.set(incoming);
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
    if (summary.locked) return;
    this.loadingDetail.set(true);
    this.selectedProgress.set(null);
    this.currentContent.set(null);
    this.action.set(null);
    this.theorySelection.set(null);
    this.theoryFeedback.set(null);
    this.practiceAnswers.set({});
    this.practiceReview.set(null);

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
    this.theoryFeedback.set(null);
    this.practiceAnswers.set({});
    this.practiceReview.set(null);
    this.confirmingPractice.set(false);
  }

  onEscape(): void {
    if (this.showResultsModal()) this.closeResults();
    else if (this.selectedProgress() || this.loadingDetail()) this.closeModule();
  }

  selectTheoryOption(optionId: string): void {
    // Tras acertar las opciones quedan fijas hasta pulsar "Continuar"
    if (this.theoryFeedback()?.correct) return;
    this.theorySelection.set(optionId);
    this.theoryFeedback.set(null);
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

          // La retroalimentación se muestra junto a la pregunta: el estudiante la lee
          // y decide cuándo avanzar (si acierta) o vuelve a intentarlo (si falla)
          this.theoryFeedback.set(result);
          // La explicación aparece bajo las opciones: se lleva a la vista
          afterNextRender(() => document.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
            { injector: this.injector });
          if (result.correct) {
            this.profileService.refresh();
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

  /** Tras leer la explicación de una respuesta correcta, pasa a la siguiente sesión. */
  continueAfterTheory(): void {
    const progress = this.selectedProgress();
    if (!progress) return;
    this.theoryFeedback.set(null);
    this.refreshAfterAction(progress.summary.moduleId);
  }

  cancelSubmitPractice(): void {
    this.confirmingPractice.set(false);
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

    // Primer clic: pedir confirmación dentro de la propia sesión (no se pueden cambiar las respuestas)
    if (!this.confirmingPractice()) {
      this.confirmingPractice.set(true);
      return;
    }
    this.confirmingPractice.set(false);

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
        this.profileService.refresh();
        this.currentContent.set(null);
        this.theorySelection.set(null);
        this.practiceAnswers.set({});
        this.summaries.update((list) =>
          list.map((item) => (item.moduleId === updated.summary.moduleId ? updated.summary : item))
        );
        this.syncNewModules();

        this.action.set({
          text: updated.summary.passed
            ? `Práctica enviada. Nota: ${updated.summary.score} pts. ¡Aprobaste el módulo!`
            : `Práctica enviada. Nota: ${updated.summary.score} pts. No alcanzaste la nota mínima de ${updated.summary.passingScore} pts.`,
          type: updated.summary.passed ? 'success' : 'error'
        });
        this.loadPracticeReview(updated.summary.moduleId);
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

  /** Carga la corrección de la práctica: qué respondió, cuál era la correcta y por qué. */
  loadPracticeReview(moduleId: string): void {
    this.loadingReview.set(true);
    this.modulesService.getPracticeReview(moduleId).subscribe({
      next: (res) => {
        this.loadingReview.set(false);
        // Si el estudiante cerró o cambió de módulo mientras cargaba, se descarta
        if (this.selectedProgress()?.summary.moduleId !== moduleId) return;
        this.practiceReview.set(res.data ?? null);
      },
      error: (err) => {
        this.loadingReview.set(false);
        this.action.set({ text: this.readError(err, 'No se pudo cargar la corrección.'), type: 'error' });
      }
    });
  }

  openResults(): void {
    this.showResultsModal.set(true);
  }

  closeResults(): void {
    this.showResultsModal.set(false);
  }

  setLearningTab(tab: LearningTab): void {
    this.learningTab.set(tab);
  }

  /** Cambio optimista: se marca al instante y se revierte si el servidor falla. */
  toggleSaved(summary: ModuleSummary): void {
    if (this.savingIds().has(summary.moduleId)) return;
    const saved = !summary.saved;
    this.saveError.set(null);
    this.setSavedLocally(summary.moduleId, saved);
    this.savingIds.update(ids => new Set(ids).add(summary.moduleId));

    this.modulesService.setSaved(summary.moduleId, saved).subscribe({
      next: () => this.clearSaving(summary.moduleId),
      error: (err) => {
        this.clearSaving(summary.moduleId);
        this.setSavedLocally(summary.moduleId, !saved);
        this.saveError.set(this.readError(err, 'No se pudo actualizar tus guardados.'));
      }
    });
  }

  private setSavedLocally(moduleId: string, saved: boolean): void {
    this.summaries.update(list => list.map(m => (m.moduleId === moduleId ? { ...m, saved } : m)));
    const open = this.selectedProgress();
    if (open?.summary.moduleId === moduleId) {
      this.selectedProgress.set({ ...open, summary: { ...open.summary, saved } });
    }
  }

  private clearSaving(moduleId: string): void {
    this.savingIds.update(ids => {
      const next = new Set(ids);
      next.delete(moduleId);
      return next;
    });
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

  sectionLabel(section: SectionProgress): string {
    return section.type === 'PRACTICE' ? 'Práctica' : `Teoría ${section.order}`;
  }

  sectionStateLabel(section: SectionProgress): string {
    if (section.status === 'COMPLETED') return 'Completada';
    if (section.accessible) return 'Disponible ahora';
    return 'Bloqueada';
  }

  sectionStateClass(section: SectionProgress): string {
    if (section.status === 'COMPLETED') return 'ca-badge--secure';
    if (section.accessible) return 'ca-badge--signal';
    return '';
  }

  sectionSteps(progress: ModuleProgress): CircuitStep[] {
    return progress.sections.map(section => {
      const final = section.type === 'PRACTICE';
      const label = this.sectionLabel(section);
      if (section.status === 'FAILED' || (final && progress.summary.status === 'FAILED')) {
        return { label, final, state: 'failed' };
      }
      if (section.status === 'COMPLETED') return { label, final, state: 'done' };
      if (section.accessible) return { label, final, state: 'current' };
      return { label, final, state: 'locked' };
    });
  }

  nextStepLabel(summary: ModuleSummary): string {
    return summary.completedSections >= summary.totalSections - 1
      ? 'Práctica final'
      : `Teoría ${summary.completedSections + 1}`;
  }

  attemptsLeft(progress: ModuleProgress): number {
    return Math.max(progress.summary.maxPracticeAttempts - progress.summary.practiceAttempts, 0);
  }

  moduleFinished(progress: ModuleProgress): boolean {
    return progress.summary.status === 'COMPLETED' || progress.summary.status === 'FAILED';
  }

  /** Vuelve a abrir la práctica suspendida para un nuevo intento. */
  retryPractice(progress: ModuleProgress): void {
    const practice = progress.sections.find((section) => section.type === 'PRACTICE' && section.accessible);
    if (!practice) return;
    this.practiceReview.set(null);
    this.action.set(null);
    this.loadSection(progress, practice);
  }

  private loadCurrentSection(progress: ModuleProgress): void {
    // Con la práctica suspendida se muestra primero el resultado; el reintento lo pide el estudiante
    const current = progress.summary.status === 'FAILED'
      ? undefined
      : progress.sections.find((section) => section.accessible);

    if (!current) {
      this.theorySelection.set(null);
      this.theoryFeedback.set(null);
      this.practiceAnswers.set({});
      this.currentContent.set(null);
      return;
    }
    this.loadSection(progress, current);
  }

  private loadSection(progress: ModuleProgress, current: SectionProgress): void {
    this.theorySelection.set(null);
    this.theoryFeedback.set(null);
    this.practiceAnswers.set({});
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
