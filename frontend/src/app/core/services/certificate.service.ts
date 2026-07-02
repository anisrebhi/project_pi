/**
 * @file core/services/certificate.service.ts
 * @description Service Angular pour la gestion complète des certificats.
 *   - Toutes les requêtes vers /api/certificates
 *   - Gestion d'erreurs HTTP avec messages explicites en français
 *   - Le token JWT est injecté automatiquement par l'authInterceptor
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Certificate, CertificateVerification, ConfirmedParticipant } from '../models/lot2.models';

export interface CertStats {
  total: number;
  pending: number;
  validated: number;
  sent: number;
  downloaded: number;
}

export interface InitResult   { created: number; skipped: number }
export interface BulkResult   { validated?: number; sent?: number; errors?: number }

@Injectable({ providedIn: 'root' })
export class CertificateService {

  private readonly api = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  // ── Admin / Organizer ──────────────────────────────────────────────────────

  /** 
   * Initialise les certificats.
   * @param userIds - IDs des participants sélectionnés (si vide : tous les participants confirmés)
   * @param force   - Bypass la vérification date de fin d'événement
   */
  initializeForEvent(
    eventId: string,
    force = false,
    userIds: string[] = []
  ): Observable<ApiResponse<InitResult & { certificates?: any[] }>> {
    const url = `${this.api}/initialize/${eventId}${force ? '?force=true' : ''}`;
    const body = userIds.length > 0 ? { userIds } : {};
    return this.http
      .post<ApiResponse<any>>(url, body)
      .pipe(catchError(this.handleError));
  }

  /** Génère + valide un certificat pour un seul participant */
  generateForOne(
    eventId: string,
    userId: string
  ): Observable<ApiResponse<{ certificate: Certificate; alreadyExisted: boolean }>> {
    return this.http
      .post<ApiResponse<any>>(`${this.api}/generate-one`, { eventId, userId })
      .pipe(catchError(this.handleError));
  }

  /** Liste tous les certificats d'un événement (Admin/Organizer) */
  getEventCertificates(
    eventId: string
  ): Observable<ApiResponse<{ certificates: Certificate[]; stats: CertStats }>> {
    return this.http
      .get<ApiResponse<any>>(`${this.api}/event/${eventId}`)
      .pipe(catchError(this.handleError));
  }

  /** Liste tous les certificats — tous événements (Admin) */
  getAllCertificates(params?: {
    page?: number; limit?: number; status?: string; eventId?: string;
  }): Observable<ApiResponse<{ certificates: Certificate[]; pagination: any }>> {
    const q = new URLSearchParams();
    if (params?.page)    q.set('page',    String(params.page));
    if (params?.limit)   q.set('limit',   String(params.limit));
    if (params?.status)  q.set('status',  params.status);
    if (params?.eventId) q.set('eventId', params.eventId);
    const qs = q.toString();
    return this.http
      .get<ApiResponse<any>>(`${this.api}/all${qs ? '?' + qs : ''}`)
      .pipe(catchError(this.handleError));
  }

  /** Valide un certificat (pending → validated) */
  validate(
    certId: string
  ): Observable<ApiResponse<{ certificate: Certificate }>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.api}/${certId}/validate`, {})
      .pipe(catchError(this.handleError));
  }

  /** Valide tous les certificats en attente d'un événement */
  bulkValidate(
    eventId: string
  ): Observable<ApiResponse<BulkResult>> {
    return this.http
      .patch<ApiResponse<BulkResult>>(`${this.api}/bulk-validate/${eventId}`, {})
      .pipe(catchError(this.handleError));
  }

  /** Génère le PDF et envoie par email (validated → sent) */
  sendByEmail(
    certId: string
  ): Observable<ApiResponse<{ certificate: Certificate }>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.api}/${certId}/send`, {})
      .pipe(catchError(this.handleError));
  }

  /** Envoie tous les certificats validés d'un événement */
  bulkSend(
    eventId: string
  ): Observable<ApiResponse<BulkResult>> {
    return this.http
      .post<ApiResponse<BulkResult>>(`${this.api}/bulk-send/${eventId}`, {})
      .pipe(catchError(this.handleError));
  }

  /** Supprime un certificat */
  delete(
    certId: string
  ): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/${certId}`)
      .pipe(catchError(this.handleError));
  }

  // ── Participant + Manager ──────────────────────────────────────────────────

  /** Télécharge le PDF d'un certificat (renvoie un Blob) */
  downloadCertificate(certId: string): Observable<Blob> {
    return this.http
      .get(`${this.api}/download/${certId}`, { responseType: 'blob' })
      .pipe(catchError(this.handleError));
  }

  /** Retourne l'URL d'aperçu inline (ouvre dans un nouvel onglet) */
  getPreviewUrl(certId: string): string {
    return `${this.api}/preview/${certId}`;
  }

  // ── Participant ────────────────────────────────────────────────────────────

  /** Mes certificats (participant connecté) */
  getMyCertificates(): Observable<ApiResponse<{ certificates: Certificate[] }>> {
    return this.http
      .get<ApiResponse<any>>(`${this.api}/my`)
      .pipe(catchError(this.handleError));
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  /** Vérifie l'authenticité d'un certificat par son code (public) */
  verify(code: string): Observable<ApiResponse<CertificateVerification>> {
    return this.http
      .get<ApiResponse<CertificateVerification>>(`${this.api}/verify/${code}`)
      .pipe(catchError(this.handleError));
  }

  // ── Error handler ──────────────────────────────────────────────────────────

  private handleError(err: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur inattendue est survenue.';

    if (err.status === 0) {
      message = 'Impossible de contacter le serveur. Vérifiez votre connexion réseau.';
    } else if (err.status === 400) {
      message = err.error?.message || 'Requête invalide.';
    } else if (err.status === 401) {
      message = 'Session expirée — veuillez vous reconnecter.';
    } else if (err.status === 403) {
      // Afficher le message précis du backend (il est explicite maintenant)
      message = err.error?.message || 'Accès refusé — permissions insuffisantes.';
    } else if (err.status === 404) {
      message = err.error?.message || 'Ressource introuvable.';
    } else if (err.status === 409) {
      message = err.error?.message || 'Conflit — cette ressource existe déjà.';
    } else if (err.status >= 500) {
      message = err.error?.message || 'Erreur serveur — réessayez dans un instant.';
    }

    console.error('[CertificateService]', err.status, message, err);

    // On enrichit l'erreur avec le message utilisateur pour qu'il soit
    // accessible dans les composants via e.userMessage
    const enriched = Object.assign(new Error(message), {
      status:      err.status,
      userMessage: message,
      originalErr: err,
    });
    return throwError(() => enriched);
  }

  // ── Confirmed participants preview ─────────────────────────────────────────

  /** 
   * Récupère les participants confirmés d'un événement avec leur statut certificat.
   * Utilisé pour afficher le tableau de prévisualisation avant initialisation.
   */
  getConfirmedParticipants(
    eventId: string
  ): Observable<ApiResponse<{
    participants: ConfirmedParticipant[];
    total: number;
    withCert: number;
    withoutCert: number;
    event: { _id: string; title: string; endDate: string };
  }>> {
    return this.http
      .get<ApiResponse<any>>(`${this.api}/event/${eventId}/participants`)
      .pipe(catchError(this.handleError));
  }
}
