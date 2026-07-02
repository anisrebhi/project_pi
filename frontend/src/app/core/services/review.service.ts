import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Review, ReviewInput, ReviewStats } from '../models/lot2.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getEventReviews(eventId: string): Observable<ApiResponse<ReviewStats>> {
    return this.http.get<ApiResponse<ReviewStats>>(`${this.apiUrl}/event/${eventId}`);
  }

  createReview(input: ReviewInput): Observable<ApiResponse<{ review: Review }>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, input);
  }

  deleteReview(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
