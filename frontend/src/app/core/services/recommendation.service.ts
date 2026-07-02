import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { RecommendationResult } from '../models/lot2.models';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getRecommendations(): Observable<ApiResponse<RecommendationResult>> {
    return this.http.get<ApiResponse<RecommendationResult>>(`${this.apiUrl}/recommendations`);
  }

<<<<<<< HEAD
  getSimilarEvents(
    eventId: string,
    filters?: { category?: string | null; excludeTitle?: string | null }
  ): Observable<ApiResponse<{ events: any[] }>> {
    const params = {
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.excludeTitle ? { excludeTitle: filters.excludeTitle } : {}),
    };

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/events/${eventId}/similar`, { params });
=======
  getSimilarEvents(eventId: string): Observable<ApiResponse<{ events: any[] }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/events/${eventId}/similar`);
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  }
}
