import { ModuleCoverKey } from '../../shared/ui/module-cover';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type SectionType = 'THEORY' | 'PRACTICE';

export interface SectionResponse {
  id: string;
  type: SectionType;
  order: number;
  title: string;
  weightPercent: number;
}

export interface CourseModuleResponse {
  id: string;
  code: string;
  title: string;
  description: string | null;
  cover: ModuleCoverKey | null;
  orderIndex: number;
  passingScore: number;
  active: boolean;
  sections: SectionResponse[];
}

export interface ModuleSummary {
  moduleId: string;
  code: string;
  title: string;
  description: string | null;
  cover: ModuleCoverKey | null;
  orderIndex: number;
  status: ProgressStatus;
  score: number | null;
  passingScore: number;
  totalSections: number;
  completedSections: number;
  progressPercent: number;
  passed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
  saved: boolean;
  locked: boolean;
  /** Intentos usados en la práctica; al llegar al máximo se cierra hasta que el admin los reanude. */
  practiceAttempts: number;
  maxPracticeAttempts: number;
}

export interface SectionProgress {
  sectionId: string;
  type: SectionType;
  order: number;
  title: string;
  weightPercent: number;
  status: ProgressStatus;
  score: number | null;
  attempts: number;
  completedAt: string | null;
  accessible: boolean;
  locked: boolean;
  questionCount: number;
}

export interface ModuleProgress {
  summary: ModuleSummary;
  sections: SectionProgress[];
}

export interface CreateModuleRequest {
  code: string;
  title: string;
  description?: string;
  cover?: ModuleCoverKey | '';
  orderIndex?: number;
  passingScore?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  /** '' quita la portada elegida. */
  cover?: ModuleCoverKey | '';
  orderIndex?: number;
  passingScore?: number;
  active?: boolean;
}

// --- Contenido y cuestionarios ---

export interface QuizOption {
  id: string;
  order: number;
  text: string;
}

export interface QuizQuestion {
  id: string;
  order: number;
  prompt: string;
  options: QuizOption[];
}

export interface SectionContent {
  sectionId: string;
  type: SectionType;
  order: number;
  title: string;
  content: string | null;
  imageUrl1: string | null;
  imageUrl2: string | null;
  videoUrl: string | null;
  status: ProgressStatus;
  accessible: boolean;
  questions: QuizQuestion[];
}

export interface CheckAnswerRequest {
  questionId: string;
  optionId: string;
}

export interface CheckAnswerResponse {
  correct: boolean;
  sectionCompleted: boolean;
  message: string;
  /** Por qué la opción elegida es correcta o no. */
  feedback: string | null;
  /** La lección completa de la pregunta; solo llega si la respuesta es correcta. */
  explanation: string | null;
}

export interface PracticeAnswer {
  questionId: string;
  optionId: string;
}

export interface SubmitPracticeRequest {
  answers: PracticeAnswer[];
}

/** Corrección de la práctica ya enviada (GET /modules/{id}/practice/review). */
export interface PracticeReviewOption {
  id: string;
  order: number;
  text: string;
  /** null mientras la práctica no esté aprobada (se puede reintentar). */
  correct: boolean | null;
  chosen: boolean;
}

export interface PracticeReviewQuestion {
  id: string;
  order: number;
  prompt: string;
  correct: boolean;
  feedback: string | null;
  explanation: string | null;
  options: PracticeReviewOption[];
}

export interface PracticeReview {
  score: number;
  passingScore: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  questions: PracticeReviewQuestion[];
}

// --- Editor del administrador ---

export interface AdminOption {
  id: string;
  order: number;
  text: string;
  correct: boolean;
  feedback: string | null;
}

export interface AdminQuestion {
  id: string;
  order: number;
  prompt: string;
  explanation: string | null;
  options: AdminOption[];
}

export interface AdminSectionContent {
  sectionId: string;
  type: SectionType;
  order: number;
  title: string;
  content: string | null;
  imageUrl1: string | null;
  imageUrl2: string | null;
  videoUrl: string | null;
  questions: AdminQuestion[];
}

export interface SaveOptionRequest {
  text: string;
  correct: boolean;
  feedback?: string | null;
}

export interface SaveQuestionRequest {
  prompt: string;
  explanation?: string | null;
  options: SaveOptionRequest[];
}

export interface SaveSectionContentRequest {
  title: string;
  content: string;
  imageUrl1?: string | null;
  imageUrl2?: string | null;
  videoUrl?: string | null;
  questions: SaveQuestionRequest[];
}
