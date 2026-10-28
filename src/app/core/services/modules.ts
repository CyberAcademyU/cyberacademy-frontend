import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  AdminSectionContent,
  CheckAnswerRequest,
  CheckAnswerResponse,
  CourseModuleResponse,
  CreateModuleRequest,
  ModuleProgress,
  ModuleSummary,
  SaveSectionContentRequest,
  SectionContent,
  SubmitPracticeRequest,
  UpdateModuleRequest
} from '../models/course-module.model';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Catálogo ---

  getModules(includeInactive = false): Observable<ApiResponse<CourseModuleResponse[]>> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<ApiResponse<CourseModuleResponse[]>>(`${this.apiUrl}/modules`, { params });
  }

  getModule(id: string): Observable<ApiResponse<CourseModuleResponse>> {
    return this.http.get<ApiResponse<CourseModuleResponse>>(`${this.apiUrl}/modules/${id}`);
  }

  createModule(data: CreateModuleRequest): Observable<ApiResponse<CourseModuleResponse>> {
    return this.http.post<ApiResponse<CourseModuleResponse>>(`${this.apiUrl}/modules`, data);
  }

  updateModule(id: string, data: UpdateModuleRequest): Observable<ApiResponse<CourseModuleResponse>> {
    return this.http.put<ApiResponse<CourseModuleResponse>>(`${this.apiUrl}/modules/${id}`, data);
  }

  // --- Flujo del estudiante ---

  getMyProgress(): Observable<ApiResponse<ModuleSummary[]>> {
    return this.http.get<ApiResponse<ModuleSummary[]>>(`${this.apiUrl}/progress`);
  }

  getModuleProgress(moduleId: string): Observable<ApiResponse<ModuleProgress>> {
    return this.http.get<ApiResponse<ModuleProgress>>(`${this.apiUrl}/modules/${moduleId}/progress`);
  }

  getStudentProgress(userId: string): Observable<ApiResponse<ModuleSummary[]>> {
    return this.http.get<ApiResponse<ModuleSummary[]>>(`${this.apiUrl}/progress/student/${userId}`);
  }

  /** Sesión desbloqueada con su contenido y sus preguntas (sin respuestas). */
  getSection(moduleId: string, sectionId: string): Observable<ApiResponse<SectionContent>> {
    return this.http.get<ApiResponse<SectionContent>>(
      `${this.apiUrl}/modules/${moduleId}/sections/${sectionId}`
    );
  }

  /** Comprobar la mini-pregunta de una teoría. */
  checkAnswer(
    moduleId: string,
    sectionId: string,
    data: CheckAnswerRequest
  ): Observable<ApiResponse<CheckAnswerResponse>> {
    return this.http.post<ApiResponse<CheckAnswerResponse>>(
      `${this.apiUrl}/modules/${moduleId}/sections/${sectionId}/check`,
      data
    );
  }

  /** Enviar la práctica (único intento) y recibir la nota calculada. */
  submitPractice(
    moduleId: string,
    data: SubmitPracticeRequest
  ): Observable<ApiResponse<ModuleProgress>> {
    return this.http.post<ApiResponse<ModuleProgress>>(
      `${this.apiUrl}/modules/${moduleId}/practice/submit`,
      data
    );
  }

  // --- Editor del administrador ---

  getModuleContent(moduleId: string): Observable<ApiResponse<AdminSectionContent[]>> {
    return this.http.get<ApiResponse<AdminSectionContent[]>>(
      `${this.apiUrl}/modules/${moduleId}/content`
    );
  }

  saveSectionContent(
    moduleId: string,
    sectionId: string,
    data: SaveSectionContentRequest
  ): Observable<ApiResponse<AdminSectionContent>> {
    return this.http.put<ApiResponse<AdminSectionContent>>(
      `${this.apiUrl}/modules/${moduleId}/sections/${sectionId}/content`,
      data
    );
  }
}
