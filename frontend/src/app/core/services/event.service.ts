import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EventModel, EventInput, EventQueryParams } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  /** List events with pagination/filters. Used by both admin & user catalogs. */
  list(params: EventQueryParams = {}): Observable<ApiResponse<EventModel[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<EventModel[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Convenience helper for the user-facing catalog: only events that
   * start in the future and are not full.
   */
  listUpcoming(params: EventQueryParams = {}): Observable<ApiResponse<EventModel[]>> {
    return this.list({
      ...params,
      startFrom: new Date().toISOString(),
      sortBy: 'startDate',
      order: 'asc',
    });
  }

  getById(id: string): Observable<ApiResponse<EventModel>> {
    return this.http.get<ApiResponse<EventModel>>(`${this.apiUrl}/${id}`);
  }

  create(payload: EventInput): Observable<ApiResponse<EventModel>> {
    return this.http.post<ApiResponse<EventModel>>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<EventInput>): Observable<ApiResponse<EventModel>> {
    return this.http.put<ApiResponse<EventModel>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<{ id: string; deletedAt: string }>> {
    return this.http.delete<ApiResponse<{ id: string; deletedAt: string }>>(`${this.apiUrl}/${id}`);
  }

  getQRCode(id: string): Observable<ApiResponse<{ eventId: string; title: string; qrCode: string }>> {
    return this.http.get<ApiResponse<{ eventId: string; title: string; qrCode: string }>>(`${this.apiUrl}/${id}/qrcode`);
  }
}
