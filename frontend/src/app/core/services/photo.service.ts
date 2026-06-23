import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EventPhoto } from '../models/lot2.models';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly apiUrl = `${environment.apiUrl}/photos`;

  constructor(private http: HttpClient) {}

  getPhotos(eventId: string): Observable<ApiResponse<{ photos: EventPhoto[]; total: number }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${eventId}`);
  }

  uploadPhotos(eventId: string, files: File[], caption?: string): Observable<ApiResponse<{ photos: EventPhoto[] }>> {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    if (caption) formData.append('caption', caption);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${eventId}`, formData);
  }

  updateCaption(photoId: string, caption: string): Observable<ApiResponse<{ photo: EventPhoto }>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${photoId}/caption`, { caption });
  }

  deletePhoto(photoId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${photoId}`);
  }

  getPhotoUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }
}
