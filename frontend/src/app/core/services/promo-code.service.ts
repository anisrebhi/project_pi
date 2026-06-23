import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface PromoCode {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  event?: { _id: string; title: string } | string | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CreatePromoCodeInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  eventId?: string;
  maxUses?: number;
  expiresAt?: string;
}

export interface PromoCodeValidation {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly apiUrl = `${environment.apiUrl}/promo-codes`;

  constructor(private http: HttpClient) {}

  list(eventId?: string): Observable<ApiResponse<PromoCode[]>> {
    let params = new HttpParams();
    if (eventId) params = params.set('eventId', eventId);
    return this.http.get<ApiResponse<PromoCode[]>>(this.apiUrl, { params });
  }

  create(payload: CreatePromoCodeInput): Observable<ApiResponse<PromoCode>> {
    return this.http.post<ApiResponse<PromoCode>>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<CreatePromoCodeInput> & { isActive?: boolean }): Observable<ApiResponse<PromoCode>> {
    return this.http.patch<ApiResponse<PromoCode>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${id}`);
  }

  /** Validates a promo code for a given event before/while booking. */
  validate(code: string, eventId: string): Observable<ApiResponse<PromoCodeValidation>> {
    const params = new HttpParams().set('code', code).set('eventId', eventId);
    return this.http.get<ApiResponse<PromoCodeValidation>>(`${this.apiUrl}/validate`, { params });
  }
}
