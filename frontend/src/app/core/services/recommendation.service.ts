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

  getSimilarEvents(eventId: string): Observable<ApiResponse<{ events: any[] }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/events/${eventId}/similar`);
  }
}
