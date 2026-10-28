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
  orderIndex?: number;
  passingScore?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
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
}

export interface PracticeAnswer {
  questionId: string;
  optionId: string;
}

export interface SubmitPracticeRequest {
  answers: PracticeAnswer[];
}

// --- Editor del administrador ---

export interface AdminOption {
  id: string;
  order: number;
  text: string;
  correct: boolean;
}

export interface AdminQuestion {
  id: string;
  order: number;
  prompt: string;
  options: AdminOption[];
}

export interface AdminSectionContent {
  sectionId: string;
  type: SectionType;
  order: number;
  title: string;
  content: string | null;
  questions: AdminQuestion[];
}

export interface SaveOptionRequest {
  text: string;
  correct: boolean;
}

export interface SaveQuestionRequest {
  prompt: string;
  options: SaveOptionRequest[];
}

export interface SaveSectionContentRequest {
  title: string;
  content: string;
  questions: SaveQuestionRequest[];
}
