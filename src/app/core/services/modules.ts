import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  CourseModuleResponse,
  CreateModuleRequest,
  ModuleProgress,
  ModuleSummary,
  RecordScoreRequest,
  SectionResponse,
  UpdateModuleRequest,
  UpdateSectionRequest,
  UpdateWeightsRequest
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

  updateSection(
    moduleId: string,
    sectionId: string,
    data: UpdateSectionRequest
  ): Observable<ApiResponse<SectionResponse>> {
    return this.http.put<ApiResponse<SectionResponse>>(
      `${this.apiUrl}/modules/${moduleId}/sections/${sectionId}`,
      data
    );
  }

  updateWeights(moduleId: string, data: UpdateWeightsRequest): Observable<ApiResponse<SectionResponse[]>> {
    return this.http.put<ApiResponse<SectionResponse[]>>(
      `${this.apiUrl}/modules/${moduleId}/weights`,
      data
    );
  }

  // --- Progreso ---

  getMyProgress(): Observable<ApiResponse<ModuleSummary[]>> {
    return this.http.get<ApiResponse<ModuleSummary[]>>(`${this.apiUrl}/progress`);
  }

  getModuleProgress(moduleId: string): Observable<ApiResponse<ModuleProgress>> {
    return this.http.get<ApiResponse<ModuleProgress>>(`${this.apiUrl}/modules/${moduleId}/progress`);
  }

  recordScore(
    moduleId: string,
    sectionId: string,
    data: RecordScoreRequest
  ): Observable<ApiResponse<ModuleProgress>> {
    return this.http.put<ApiResponse<ModuleProgress>>(
      `${this.apiUrl}/modules/${moduleId}/sections/${sectionId}/score`,
      data
    );
  }

  getStudentProgress(userId: string): Observable<ApiResponse<ModuleSummary[]>> {
    return this.http.get<ApiResponse<ModuleSummary[]>>(`${this.apiUrl}/progress/student/${userId}`);
  }
}
