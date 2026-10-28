import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { AdminOverview, StudentOverview } from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<ApiResponse<AdminOverview>> {
    return this.http.get<ApiResponse<AdminOverview>>(`${this.apiUrl}/admin/overview`);
  }

  getStudents(): Observable<ApiResponse<StudentOverview[]>> {
    return this.http.get<ApiResponse<StudentOverview[]>>(`${this.apiUrl}/admin/students`);
  }
}
