import { ModuleCoverKey } from '../../shared/ui/module-cover';

/** Ficha pública de un módulo (GET /public/modules). Sin contenido ni respuestas. */
export interface PublicModule {
  code: string;
  title: string;
  description: string | null;
  cover: ModuleCoverKey | null;
  orderIndex: number;
  passingScore: number;
  /** Títulos de las 3 lecciones de teoría, en orden. */
  topics: string[];
}
