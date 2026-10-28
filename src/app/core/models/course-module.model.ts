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

export interface UpdateSectionRequest {
  title?: string;
  weightPercent?: number;
}

export interface SectionWeight {
  sectionId: string;
  weightPercent: number;
}

export interface UpdateWeightsRequest {
  weights: SectionWeight[];
}

export interface RecordScoreRequest {
  score: number;
  completed?: boolean;
}
