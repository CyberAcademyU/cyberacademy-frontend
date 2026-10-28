import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import { AdminDashboardService } from '../../../core/services/admin-dashboard';
import {
  AdminSectionContent,
  CourseModuleResponse,
  ModuleSummary,
  ProgressStatus,
  SectionType
} from '../../../core/models/course-module.model';
import { AdminOverview, StudentOverview } from '../../../core/models/admin-dashboard.model';
import { UserStatus } from '../../../core/models/user.model';

interface OptionDraft {
  text: string;
  correct: boolean;
}

interface QuestionDraft {
  prompt: string;
  options: OptionDraft[];
}

interface SectionDraft {
  sectionId: string;
  type: SectionType;
  order: number;
  title: string;
  content: string;
  questions: QuestionDraft[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private modulesService = inject(ModulesService);
  private adminDashboardService = inject(AdminDashboardService);
  private router = inject(Router);

  user = this.authService.currentUserSignal;
  activeTab = signal<'resumen' | 'modulos' | 'usuarios'>('resumen');
  exportSuccess = signal(false);

  // --- Resumen global (datos reales) ---
  overview = signal<AdminOverview | null>(null);
  overviewLoading = signal(true);
  overviewError = signal<string | null>(null);

  // --- Estudiantes (datos reales) ---
  students = signal<StudentOverview[]>([]);
  studentsLoading = signal(true);
  studentsError = signal<string | null>(null);

  // --- Detalle del progreso de un estudiante ---
  selectedStudent = signal<StudentOverview | null>(null);
  studentProgress = signal<ModuleSummary[] | null>(null);
  studentProgressLoading = signal(false);
  studentProgressError = signal<string | null>(null);

  // --- Gestión de módulos ---
  realModules = signal<CourseModuleResponse[]>([]);
  modulesLoading = signal(false);
  modulesError = signal<string | null>(null);
  modulesMessage = signal<string | null>(null);

  showCreateForm = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);
  newModule = { code: '', title: '', description: '', orderIndex: 1, passingScore: 70 };

  // --- Editor de contenido y preguntas ---
  editingModule = signal<CourseModuleResponse | null>(null);
  editorSections = signal<SectionDraft[]>([]);
  editorLoading = signal(false);
  editorError = signal<string | null>(null);
  editorMessage = signal<string | null>(null);
  savingSectionId = signal<string | null>(null);

  completionRate = computed(() => {
    const data = this.overview();
    if (!data || data.totalStudents === 0) return 0;
    return Math.round((data.studentsCompletedAll / data.totalStudents) * 100);
  });

  ngOnInit(): void {
    this.loadOverview();
    this.loadStudents();
    this.loadModules();
  }

  selectTab(tab: 'resumen' | 'modulos' | 'usuarios'): void {
    this.activeTab.set(tab);
    if (tab === 'resumen') {
      this.loadOverview();
    } else if (tab === 'modulos') {
      this.loadModules();
    } else {
      this.loadStudents();
    }
  }

  // =========================================================================
  // Resumen
  // =========================================================================

  loadOverview(): void {
    this.overviewLoading.set(true);
    this.overviewError.set(null);

    this.adminDashboardService.getOverview().subscribe({
      next: (res) => {
        this.overview.set(res.data ?? null);
        this.overviewLoading.set(false);
      },
      error: (err) => {
        this.overviewLoading.set(false);
        this.overviewError.set(this.readError(err, 'No se pudo cargar el resumen.'));
      }
    });
  }

  // =========================================================================
  // Estudiantes
  // =========================================================================

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);

    this.adminDashboardService.getStudents().subscribe({
      next: (res) => {
        this.students.set(res.data ?? []);
        this.studentsLoading.set(false);
      },
      error: (err) => {
        this.studentsLoading.set(false);
        this.studentsError.set(this.readError(err, 'No se pudieron cargar los estudiantes.'));
      }
    });
  }

  openStudentDetail(student: StudentOverview): void {
    this.selectedStudent.set(student);
    this.studentProgress.set(null);
    this.studentProgressError.set(null);
    this.studentProgressLoading.set(true);

    this.modulesService.getStudentProgress(student.userId).subscribe({
      next: (res) => {
        this.studentProgress.set(res.data ?? []);
        this.studentProgressLoading.set(false);
      },
      error: (err) => {
        this.studentProgressLoading.set(false);
        this.studentProgressError.set(this.readError(err, 'No se pudo cargar el progreso del estudiante.'));
      }
    });
  }

  closeStudentDetail(): void {
    this.selectedStudent.set(null);
    this.studentProgress.set(null);
    this.studentProgressError.set(null);
  }

  // =========================================================================
  // Gestión de módulos
  // =========================================================================

  loadModules(): void {
    this.modulesLoading.set(true);
    this.modulesError.set(null);

    this.modulesService.getModules(true).subscribe({
      next: (res) => {
        this.realModules.set(res.data ?? []);
        this.modulesLoading.set(false);
      },
      error: (err) => {
        this.modulesLoading.set(false);
        this.modulesError.set(this.readError(err, 'No se pudieron cargar los módulos.'));
      }
    });
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.createError.set(null);
    this.modulesMessage.set(null);
  }

  cancelCreateForm(): void {
    this.showCreateForm.set(false);
    this.createError.set(null);
  }

  createModule(): void {
    const code = this.newModule.code.trim();
    const title = this.newModule.title.trim();

    if (!code || !title) {
      this.createError.set('El código y el título son obligatorios.');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.modulesService
      .createModule({
        code,
        title,
        description: this.newModule.description.trim() || undefined,
        orderIndex: Number(this.newModule.orderIndex) || 1,
        passingScore: Number(this.newModule.passingScore)
      })
      .subscribe({
        next: (res) => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.newModule = { code: '', title: '', description: '', orderIndex: 1, passingScore: 70 };
          this.loadModules();
          this.loadOverview();
          this.modulesMessage.set(
            `Módulo ${res.data?.code ?? code} creado. Ahora redacta sus teorías y preguntas con “Contenido y preguntas”.`
          );
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(this.readError(err, 'No se pudo crear el módulo.'));
        }
      });
  }

  toggleActive(module: CourseModuleResponse): void {
    this.modulesService.updateModule(module.id, { active: !module.active }).subscribe({
      next: () => {
        this.loadModules();
        this.loadOverview();
        this.modulesMessage.set(
          `Módulo ${module.code} ${module.active ? 'desactivado' : 'activado'} correctamente.`
        );
      },
      error: (err) => this.modulesMessage.set(this.readError(err, 'No se pudo cambiar el estado del módulo.'))
    });
  }

  // =========================================================================
  // Editor de contenido y preguntas
  // =========================================================================

  openContentEditor(module: CourseModuleResponse): void {
    this.editingModule.set(module);
    this.editorSections.set([]);
    this.editorLoading.set(true);
    this.editorError.set(null);
    this.editorMessage.set(null);
    this.savingSectionId.set(null);

    this.modulesService.getModuleContent(module.id).subscribe({
      next: (res) => {
        this.editorSections.set((res.data ?? []).map((section) => this.toDraft(section)));
        this.editorLoading.set(false);
      },
      error: (err) => {
        this.editorLoading.set(false);
        this.editorError.set(this.readError(err, 'No se pudo cargar el contenido del módulo.'));
      }
    });
  }

  closeContentEditor(): void {
    this.editingModule.set(null);
    this.editorSections.set([]);
    this.editorError.set(null);
    this.editorMessage.set(null);
    this.savingSectionId.set(null);
  }

  setEditorTitle(sectionId: string, value: string): void {
    this.updateSection(sectionId, (draft) => ({ ...draft, title: value }));
  }

  setEditorContent(sectionId: string, value: string): void {
    this.updateSection(sectionId, (draft) => ({ ...draft, content: value }));
  }

  setQuestionPrompt(sectionId: string, questionIndex: number, value: string): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.map((question, index) =>
        index === questionIndex ? { ...question, prompt: value } : question
      )
    }));
  }

  setOptionText(sectionId: string, questionIndex: number, optionIndex: number, value: string): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oIndex) =>
                oIndex === optionIndex ? { ...option, text: value } : option
              )
            }
          : question
      )
    }));
  }

  setCorrectOption(sectionId: string, questionIndex: number, optionIndex: number): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oIndex) => ({
                ...option,
                correct: oIndex === optionIndex
              }))
            }
          : question
      )
    }));
  }

  addQuestion(sectionId: string): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: [...draft.questions, this.emptyQuestion()]
    }));
  }

  removeQuestion(sectionId: string, questionIndex: number): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.filter((_, index) => index !== questionIndex)
    }));
  }

  addOption(sectionId: string, questionIndex: number): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, { text: '', correct: false }] }
          : question
      )
    }));
  }

  removeOption(sectionId: string, questionIndex: number, optionIndex: number): void {
    this.updateSection(sectionId, (draft) => ({
      ...draft,
      questions: draft.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: question.options.filter((_, oIndex) => oIndex !== optionIndex) }
          : question
      )
    }));
  }

  saveSection(draft: SectionDraft): void {
    const module = this.editingModule();
    if (!module) return;

    const validationError = this.validateDraft(draft);
    if (validationError) {
      this.editorMessage.set(null);
      this.editorError.set(validationError);
      return;
    }

    const request = {
      title: draft.title.trim(),
      content: draft.content.trim(),
      questions: draft.questions.map((question) => ({
        prompt: question.prompt.trim(),
        options: question.options.map((option) => ({
          text: option.text.trim(),
          correct: option.correct
        }))
      }))
    };

    this.savingSectionId.set(draft.sectionId);
    this.editorMessage.set(null);
    this.editorError.set(null);

    this.modulesService.saveSectionContent(module.id, draft.sectionId, request).subscribe({
      next: (res) => {
        this.savingSectionId.set(null);
        const updated = res.data;
        if (!updated) {
          this.editorError.set('No se recibió la respuesta del servidor.');
          return;
        }
        this.editorSections.update((sections) =>
          sections.map((section) =>
            section.sectionId === updated.sectionId ? this.toDraft(updated) : section
          )
        );
        this.editorMessage.set(`Sesión “${updated.title}” guardada correctamente.`);
        this.loadModules();
      },
      error: (err) => {
        this.savingSectionId.set(null);
        this.editorError.set(this.readError(err, 'No se pudo guardar la sesión.'));
      }
    });
  }

  // =========================================================================
  // Exportación y sesión
  // =========================================================================

  exportResults(): void {
    const header = [
      'Nombre',
      'Correo',
      'Estado',
      'Modulos completados',
      'Total modulos',
      'Modulos calificados',
      'Nota total',
      'Total posible',
      'Nota media',
      'Avance',
      'Ultima actividad'
    ];
    const rows = this.students().map((student) => [
      `${student.firstName} ${student.lastName}`,
      student.email,
      this.userStatusLabel(student.status),
      String(student.modulesCompleted),
      String(student.modulesTotal),
      String(student.gradedModules),
      student.totalScore === null ? '' : String(student.totalScore),
      String(student.modulesTotal * 100),
      student.averageScore === null ? '' : String(student.averageScore),
      `${student.progressPercent}%`,
      this.formatDate(student.lastActivityAt)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resultados_estudiantes_cyberacademy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.exportSuccess.set(true);
    setTimeout(() => this.exportSuccess.set(false), 3000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // =========================================================================
  // Utilidades de presentación
  // =========================================================================

  fullName(student: StudentOverview): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  userStatusLabel(status: UserStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'SUSPENDED':
        return 'Suspendido';
      default:
        return 'Pendiente';
    }
  }

  userStatusClass(status: UserStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'SUSPENDED':
        return 'status-suspended';
      default:
        return 'status-pending';
    }
  }

  moduleStatusLabel(status: ProgressStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'IN_PROGRESS':
        return 'En curso';
      case 'FAILED':
        return 'No aprobado';
      default:
        return 'Sin empezar';
    }
  }

  moduleStatusClass(status: ProgressStatus): string {
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

  formatScore(value: number | null): string {
    return value === null || value === undefined ? '—' : String(value);
  }

  formatTotal(student: StudentOverview): string {
    if (student.totalScore === null) return '—';
    return `${student.totalScore} / ${student.modulesTotal * 100}`;
  }

  relativeTime(iso: string | null): string {
    if (!iso) return 'Sin actividad';

    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;

    return this.formatDate(iso);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // =========================================================================
  // Internos
  // =========================================================================

  private updateSection(sectionId: string, updater: (draft: SectionDraft) => SectionDraft): void {
    this.editorSections.update((sections) =>
      sections.map((section) => (section.sectionId === sectionId ? updater(section) : section))
    );
  }

  private toDraft(section: AdminSectionContent): SectionDraft {
    const questions: QuestionDraft[] = section.questions.length
      ? section.questions.map((question) => ({
          prompt: question.prompt,
          options: question.options.map((option) => ({
            text: option.text,
            correct: option.correct
          }))
        }))
      : [this.emptyQuestion()];

    return {
      sectionId: section.sectionId,
      type: section.type,
      order: section.order,
      title: section.title,
      content: section.content ?? '',
      questions
    };
  }

  private emptyQuestion(): QuestionDraft {
    return {
      prompt: '',
      options: [
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false }
      ]
    };
  }

  private validateDraft(draft: SectionDraft): string | null {
    if (!draft.title.trim()) {
      return 'El título de la sesión es obligatorio.';
    }
    if (!draft.content.trim()) {
      return 'El contenido o las instrucciones de la sesión son obligatorios.';
    }
    if (draft.type === 'THEORY' && draft.questions.length !== 1) {
      return 'Cada teoría debe tener exactamente una pregunta de comprensión.';
    }
    if (draft.type === 'PRACTICE' && draft.questions.length === 0) {
      return 'La práctica debe tener al menos una pregunta.';
    }

    for (let index = 0; index < draft.questions.length; index++) {
      const question = draft.questions[index];
      if (!question.prompt.trim()) {
        return `La pregunta ${index + 1} necesita un enunciado.`;
      }
      if (question.options.length < 2) {
        return `La pregunta ${index + 1} debe tener al menos dos opciones.`;
      }
      if (question.options.some((option) => !option.text.trim())) {
        return `Completa el texto de todas las opciones de la pregunta ${index + 1}.`;
      }
      const correct = question.options.filter((option) => option.correct).length;
      if (correct !== 1) {
        return `Marca exactamente una opción correcta en la pregunta ${index + 1}.`;
      }
    }

    return null;
  }

  private readError(err: unknown, fallback: string): string {
    const error = err as { status?: number; error?: { message?: string } };
    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    if (error?.status === 403) {
      return 'Tu usuario no tiene permisos de administrador.';
    }
    return error?.error?.message || fallback;
  }
}
