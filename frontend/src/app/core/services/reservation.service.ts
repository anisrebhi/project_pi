import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateReservationInput,
  Reservation,
  ReservationNotification,
  ReservationQueryParams,
} from '../models/reservation.model';

interface UserReservationsData {
  user: { id: string; fullName: string };
  reservations: Reservation[];
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly apiUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  /**
   * List reservations. The backend filters by role automatically:
   *  - ADMIN sees everything (optionally filtered by the given params)
   *  - any other role only ever receives their own reservations.
   */
  list(params: ReservationQueryParams = {}): Observable<ApiResponse<Reservation[]>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<Reservation[]>>(this.apiUrl, { params: httpParams });
  }

  /** "My reservations" — also usable by an ADMIN for any userId. */
  listForUser(userId: string, params: ReservationQueryParams = {}): Observable<ApiResponse<UserReservationsData>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ApiResponse<UserReservationsData>>(`${this.apiUrl}/user/${userId}`, { params: httpParams });
  }

  create(payload: CreateReservationInput): Observable<ApiResponse<Reservation> & { notification?: ReservationNotification }> {
    return this.http.post<ApiResponse<Reservation> & { notification?: ReservationNotification }>(this.apiUrl, payload);
  }

  cancel(id: string, cancellationReason?: string): Observable<ApiResponse<Reservation>> {
    return this.http.put<ApiResponse<Reservation>>(`${this.apiUrl}/${id}/cancel`, { cancellationReason });
  }

  /** Downloads the PDF ticket (with embedded QR code) as a Blob. */
  downloadTicket(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/ticket`, { responseType: 'blob' });
  }
}
