import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { PublicModule } from '../models/catalog.model';

/** Catálogo visible sin sesión (páginas públicas). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPublicModules(): Observable<ApiResponse<PublicModule[]>> {
    return this.http.get<ApiResponse<PublicModule[]>>(`${this.apiUrl}/public/modules`);
  }
}
