import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Certificate, CertificateVerification } from '../models/lot2.models';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  generateForEvent(eventId: string): Observable<ApiResponse<{ generated: number; skipped: number }>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/generate/${eventId}`, {});
  }

  getMyCertificates(): Observable<ApiResponse<{ certificates: Certificate[] }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my`);
  }

  /** Returns the download URL for direct link usage */
  getDownloadUrl(certificateId: string): string {
    return `${this.apiUrl}/download/${certificateId}`;
  }

  downloadCertificate(certificateId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${certificateId}`, { responseType: 'blob' });
  }

  verify(code: string): Observable<ApiResponse<CertificateVerification>> {
    return this.http.get<ApiResponse<CertificateVerification>>(`${this.apiUrl}/verify/${code}`);
  }
}
