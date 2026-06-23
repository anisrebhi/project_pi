import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Thin wrapper around the free OpenStreetMap Nominatim API for
 * forward and reverse geocoding. No API key required.
 *
 * Note: Nominatim's public instance has a fair-use policy (max ~1 req/s,
 * no heavy/automated use). That's perfectly fine for occasional, user-triggered
 * lookups like "search this address" or "use my current location".
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  /** Address text -> coordinates (forward geocoding) */
  search(query: string): Observable<GeocodeResult | null> {
    const url = `${this.baseUrl}/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    return this.http.get<any[]>(url).pipe(
      map((results) => {
        if (!results?.length) return null;
        const r = results[0];
        return { address: r.display_name, latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) };
      }),
    );
  }

  /** Coordinates -> address text (reverse geocoding) */
  reverse(lat: number, lng: number): Observable<string | null> {
    const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=0`;
    return this.http.get<any>(url).pipe(
      map((result) => result?.display_name ?? null),
    );
  }
}
