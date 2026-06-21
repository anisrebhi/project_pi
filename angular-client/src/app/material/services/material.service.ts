import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material, MaterialFormData, ApiResponse, Category, Project } from '../models/material.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private api = '/api/materials';

  constructor(private http: HttpClient) {}

  getAll(params?: { [key: string]: string | number }): Observable<ApiResponse<Material[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<ApiResponse<Material[]>>(this.api, { params: httpParams });
  }

  getById(id: string): Observable<ApiResponse<Material>> {
    return this.http.get<ApiResponse<Material>>(`${this.api}/${id}`);
  }

  create(data: MaterialFormData): Observable<ApiResponse<Material>> {
    return this.http.post<ApiResponse<Material>>(this.api, data);
  }

  update(id: string, data: Partial<MaterialFormData>): Observable<ApiResponse<Material>> {
    return this.http.put<ApiResponse<Material>>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.api}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Material>> {
    return this.http.patch<ApiResponse<Material>>(`${this.api}/${id}/status`, { status });
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>('/api/categories');
  }

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>('/api/projects');
  }
}
