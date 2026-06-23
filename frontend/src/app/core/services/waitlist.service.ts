import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { WaitlistEntry, JoinWaitlistInput, WaitlistPositionResult } from '../models/waitlist.model';

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly apiUrl = `${environment.apiUrl}/waitlist`;

  constructor(private http: HttpClient) {}

  join(payload: JoinWaitlistInput): Observable<ApiResponse<{ entry: WaitlistEntry; position: number }>> {
    return this.http.post<ApiResponse<{ entry: WaitlistEntry; position: number }>>(this.apiUrl, payload);
  }

  leave(eventId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/events/${eventId}`);
  }

  getMyWaitlist(): Observable<ApiResponse<WaitlistEntry[]>> {
    return this.http.get<ApiResponse<WaitlistEntry[]>>(`${this.apiUrl}/my`);
  }

  checkPosition(eventId: string): Observable<ApiResponse<WaitlistPositionResult>> {
    return this.http.get<ApiResponse<WaitlistPositionResult>>(`${this.apiUrl}/events/${eventId}/position`);
  }

  getEventWaitlist(eventId: string, page = 1, limit = 20): Observable<ApiResponse<WaitlistEntry[]>> {
    return this.http.get<ApiResponse<WaitlistEntry[]>>(
      `${this.apiUrl}/events/${eventId}?page=${page}&limit=${limit}`
    );
  }
}
