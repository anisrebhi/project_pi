import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChatMessage } from '../models/lot2.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly apiUrl    = `${environment.apiUrl}/messages`;
  private readonly socketUrl = environment.apiUrl.replace('/api', '');
  private socket: any        = null;

  readonly messages$    = new Subject<ChatMessage>();
  readonly typing$      = new Subject<{ userId: string; fullName: string }>();
  readonly stopTyping$  = new Subject<{ userId: string }>();
  readonly connected$   = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  // ─── REST fallback methods ────────────────────────────────────────────────
  getMessages(eventId: string, page = 1, limit = 50): Observable<ApiResponse<{ messages: ChatMessage[] }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${eventId}?page=${page}&limit=${limit}`);
  }

  sendMessageHttp(eventId: string, content: string): Observable<ApiResponse<{ message: ChatMessage }>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${eventId}`, { content });
  }

  getUnreadCount(eventId: string): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${eventId}/unread-count`);
  }

  deleteMessage(messageId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${messageId}`);
  }

  // ─── Socket.IO — dynamic import avoids SSR / test issues ─────────────────
  async connect(): Promise<void> {
    if (this.socket?.connected) return;
    const token = this.auth.getToken();
    if (!token) return;

    try {
      // Dynamic import — works with Angular build system
      const { io } = await import('socket.io-client');
      this.socket = io(this.socketUrl, {
        auth:              { token },
        transports:        ['websocket', 'polling'],
        reconnection:      true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect',          () => this.connected$.next(true));
      this.socket.on('disconnect',       () => this.connected$.next(false));
      this.socket.on('new-message',      (msg: ChatMessage) => this.messages$.next(msg));
      this.socket.on('user-typing',      (d: any) => this.typing$.next(d));
      this.socket.on('user-stop-typing', (d: any) => this.stopTyping$.next(d));
    } catch (err) {
      console.warn('[ChatService] Socket.IO unavailable — REST-only mode.', err);
    }
  }

  joinEventChat(eventId: string): void {
    this.socket?.emit('join-event-chat', { eventId });
  }

  leaveEventChat(eventId: string): void {
    this.socket?.emit('leave-event-chat', { eventId });
  }

  /** Send via socket if connected, otherwise falls back to HTTP in component */
  sendMessage(eventId: string, content: string): void {
    this.socket?.emit('send-message', { eventId, content });
  }

  emitTyping(eventId: string): void {
    this.socket?.emit('typing', { eventId });
  }

  emitStopTyping(eventId: string): void {
    this.socket?.emit('stop-typing', { eventId });
  }

  isSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
