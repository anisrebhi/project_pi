import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChatMessage } from '../models/lot2.models';
import { AuthService } from './auth.service';

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly apiUrl    = `${environment.apiUrl}/messages`;
  private readonly socketUrl = environment.apiUrl.replace('/api', '');
  private socket: any        = null;

  readonly messages$    = new Subject<ChatMessage>();
  readonly typing$      = new Subject<{ userId: string; fullName: string }>();
  readonly stopTyping$  = new Subject<{ userId: string }>();
  readonly connected$   = new BehaviorSubject<boolean>(false);
<<<<<<< HEAD
=======
=======
// Dynamic import of socket.io-client to avoid SSR issues
declare const require: any;

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/messages`;
  private socket: any = null;
  private readonly socketUrl = environment.apiUrl.replace('/api', '');

  readonly messages$ = new Subject<ChatMessage>();
  readonly typing$   = new Subject<{ userId: string; fullName: string }>();
  readonly stopTyping$ = new Subject<{ userId: string }>();
  readonly connected$ = new BehaviorSubject<boolean>(false);
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

<<<<<<< HEAD
  // ─── REST fallback methods ────────────────────────────────────────────────
=======
<<<<<<< HEAD
  // ─── REST fallback methods ────────────────────────────────────────────────
=======
  // ─── REST ─────────────────────────────────────────────────────────────────
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
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

<<<<<<< HEAD
  // ─── Socket.IO — dynamic import avoids SSR / test issues ─────────────────
  async connect(): Promise<void> {
=======
<<<<<<< HEAD
  // ─── Socket.IO — dynamic import avoids SSR / test issues ─────────────────
  async connect(): Promise<void> {
=======
  // ─── Socket.IO ────────────────────────────────────────────────────────────
  connect(): void {
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    if (this.socket?.connected) return;
    const token = this.auth.getToken();
    if (!token) return;

    try {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      // Dynamic import — works with Angular build system
      const { io } = await import('socket.io-client');
      this.socket = io(this.socketUrl, {
        auth:              { token },
        transports:        ['websocket', 'polling'],
        reconnection:      true,
<<<<<<< HEAD
=======
=======
      const { io } = require('socket.io-client');
      this.socket = io(this.socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
      this.socket.on('connect',          () => this.connected$.next(true));
      this.socket.on('disconnect',       () => this.connected$.next(false));
      this.socket.on('new-message',      (msg: ChatMessage) => this.messages$.next(msg));
      this.socket.on('user-typing',      (d: any) => this.typing$.next(d));
      this.socket.on('user-stop-typing', (d: any) => this.stopTyping$.next(d));
    } catch (err) {
      console.warn('[ChatService] Socket.IO unavailable — REST-only mode.', err);
<<<<<<< HEAD
=======
=======
      this.socket.on('connect',    () => this.connected$.next(true));
      this.socket.on('disconnect', () => this.connected$.next(false));
      this.socket.on('new-message',      (msg: ChatMessage) => this.messages$.next(msg));
      this.socket.on('user-typing',      (data: any)        => this.typing$.next(data));
      this.socket.on('user-stop-typing', (data: any)        => this.stopTyping$.next(data));
    } catch {
      // Socket.IO not available (SSR or test env) — REST-only mode
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
    }
  }

  joinEventChat(eventId: string): void {
    this.socket?.emit('join-event-chat', { eventId });
  }

  leaveEventChat(eventId: string): void {
    this.socket?.emit('leave-event-chat', { eventId });
  }

<<<<<<< HEAD
  /** Send via socket if connected, otherwise falls back to HTTP in component */
=======
<<<<<<< HEAD
  /** Send via socket if connected, otherwise falls back to HTTP in component */
=======
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
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
