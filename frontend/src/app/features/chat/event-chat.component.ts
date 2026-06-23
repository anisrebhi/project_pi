import { Component, Input, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService }  from '../../core/services/chat.service';
import { AuthService }  from '../../core/services/auth.service';
import { ChatMessage }  from '../../core/models/lot2.models';

@Component({
  selector: 'app-event-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="chat-container" [class.chat-open]="isOpen()">
  <!-- Toggle button -->
  <button class="chat-toggle" (click)="toggleChat()">
    💬 Chat
    <span class="unread-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
  </button>

  <!-- Chat panel -->
  <div class="chat-panel" *ngIf="isOpen()">
    <div class="chat-header">
      <h3>💬 Chat de l'événement</h3>
      <div class="connection-indicator" [class.connected]="connected()">
        <span class="dot"></span>{{ connected() ? 'En direct' : 'Hors ligne' }}
      </div>
      <button class="close-btn" (click)="toggleChat()">✕</button>
    </div>

    <div class="chat-messages" #messagesContainer>
      <div *ngIf="loading()" class="loading-chat">Chargement…</div>

      <div *ngFor="let msg of messages()"
           class="message-bubble"
           [class.mine]="isMyMessage(msg)"
           [class.organizer]="msg.sender?.role === 'ORGANIZER' || msg.sender?.role === 'ADMIN'">
        <div class="bubble-meta" *ngIf="!isMyMessage(msg)">
          <span class="sender-name">{{ msg.sender?.fullName }}</span>
          <span class="sender-badge" *ngIf="msg.sender?.role === 'ORGANIZER'">Organisateur</span>
          <span class="sender-badge admin" *ngIf="msg.sender?.role === 'ADMIN'">Admin</span>
        </div>
        <div class="bubble-content">{{ msg.content }}</div>
        <div class="bubble-time">{{ msg.createdAt | date:'HH:mm' }}</div>
      </div>

      <!-- Typing indicator -->
      <div *ngIf="typingUser()" class="typing-indicator">
        <span class="typing-name">{{ typingUser() }}</span> écrit
        <span class="dots"><span></span><span></span><span></span></span>
      </div>
    </div>

    <div class="chat-input-area">
      <input
        #inputEl
        type="text"
        [(ngModel)]="newMessage"
        placeholder="Votre message…"
        class="chat-input"
        (keyup.enter)="send()"
        (input)="onTyping()"
        maxlength="2000"
      />
      <button class="send-btn" (click)="send()" [disabled]="!newMessage.trim()">
        ➤
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .chat-container { position:fixed; bottom:2rem; right:2rem; z-index:1000; }
    .chat-toggle { background:#6366f1; color:#fff; border:none; border-radius:50px; padding:.75rem 1.5rem; cursor:pointer; font-weight:700; font-size:1rem; box-shadow:0 4px 20px rgba(99,102,241,.4); position:relative; transition:transform .2s; }
    .chat-toggle:hover { transform:scale(1.05); }
    .unread-badge { background:#ef4444; color:#fff; border-radius:50%; width:20px; height:20px; font-size:.7rem; font-weight:800; display:inline-flex; align-items:center; justify-content:center; position:absolute; top:-6px; right:-6px; }
    .chat-panel { position:absolute; bottom:4rem; right:0; width:360px; background:#fff; border-radius:20px; box-shadow:0 16px 64px rgba(0,0,0,.18); display:flex; flex-direction:column; height:500px; border:1px solid #e2e8f0; overflow:hidden; }
    .chat-header { padding:1rem 1.25rem; background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; display:flex; align-items:center; gap:.75rem; }
    .chat-header h3 { margin:0; font-size:.95rem; flex:1; }
    .connection-indicator { display:flex; align-items:center; gap:.35rem; font-size:.75rem; }
    .dot { width:8px; height:8px; border-radius:50%; background:#94a3b8; }
    .connection-indicator.connected .dot { background:#4ade80; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
    .close-btn { background:none; border:none; color:rgba(255,255,255,.8); cursor:pointer; font-size:1.1rem; padding:.25rem; }
    .close-btn:hover { color:#fff; }
    .chat-messages { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:.75rem; scroll-behavior:smooth; }
    .loading-chat { text-align:center; color:#94a3b8; font-size:.85rem; padding:1rem; }
    .message-bubble { max-width:75%; display:flex; flex-direction:column; }
    .message-bubble.mine { align-self:flex-end; }
    .bubble-meta { display:flex; align-items:center; gap:.35rem; margin-bottom:.2rem; }
    .sender-name { font-size:.75rem; font-weight:600; color:#475569; }
    .sender-badge { font-size:.65rem; background:#ede9fe; color:#6366f1; padding:.1rem .4rem; border-radius:4px; font-weight:700; }
    .sender-badge.admin { background:#fef3c7; color:#d97706; }
    .bubble-content { background:#f1f5f9; padding:.6rem .85rem; border-radius:16px; border-top-left-radius:4px; font-size:.88rem; color:#1e293b; line-height:1.45; word-break:break-word; }
    .mine .bubble-content { background:#6366f1; color:#fff; border-radius:16px; border-top-right-radius:4px; border-top-left-radius:16px; }
    .organizer .bubble-content { background:#ede9fe; color:#3730a3; }
    .bubble-time { font-size:.7rem; color:#94a3b8; margin-top:.2rem; align-self:flex-end; }
    .mine .bubble-time { align-self:flex-end; }
    .typing-indicator { display:flex; align-items:center; gap:.4rem; padding:.4rem .85rem; }
    .typing-name { font-size:.78rem; color:#64748b; font-weight:600; }
    .dots { display:flex; gap:3px; }
    .dots span { width:6px; height:6px; background:#94a3b8; border-radius:50%; animation:bounce .8s infinite; }
    .dots span:nth-child(2) { animation-delay:.15s; }
    .dots span:nth-child(3) { animation-delay:.3s; }
    @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-6px); } }
    .chat-input-area { padding:.75rem; border-top:1px solid #e2e8f0; display:flex; gap:.5rem; }
    .chat-input { flex:1; border:1.5px solid #e2e8f0; border-radius:24px; padding:.5rem 1rem; font-size:.875rem; outline:none; font-family:inherit; }
    .chat-input:focus { border-color:#6366f1; }
    .send-btn { background:#6366f1; color:#fff; border:none; border-radius:50%; width:38px; height:38px; cursor:pointer; font-size:1rem; transition:background .2s; flex-shrink:0; }
    .send-btn:hover:not(:disabled) { background:#4f46e5; }
    .send-btn:disabled { opacity:.5; cursor:not-allowed; }
    @media(max-width:480px) { .chat-panel { width:calc(100vw - 2rem); right:-1rem; } }
  `],
})
export class EventChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() eventId!: string;
  @ViewChild('messagesContainer') msgContainer!: ElementRef;

  messages     = signal<ChatMessage[]>([]);
  isOpen       = signal(false);
  loading      = signal(false);
  connected    = signal(false);
  unreadCount  = signal(0);
  typingUser   = signal<string | null>(null);
  newMessage   = '';
  private typingTimeout: any;
  private subs: Subscription[] = [];
  private shouldScroll = false;

  constructor(
    public  auth: AuthService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.chatService.connect();

    this.subs.push(
      this.chatService.connected$.subscribe(c => this.connected.set(c)),
      this.chatService.messages$.subscribe(msg => {
        if (msg.event === this.eventId || (msg as any).event?._id === this.eventId) {
          this.messages.update(m => [...m, msg]);
          this.shouldScroll = true;
          if (!this.isOpen()) this.unreadCount.update(n => n + 1);
        }
      }),
      this.chatService.typing$.subscribe(data => {
        if (data.userId !== this.auth.currentUser()?._id) {
          this.typingUser.set(data.fullName);
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => this.typingUser.set(null), 3000);
        }
      }),
    );

    this.chatService.getUnreadCount(this.eventId).subscribe({
      next: (res) => this.unreadCount.set(res.data?.count || 0),
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  toggleChat(): void {
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening) {
      this.unreadCount.set(0);
      this.loadMessages();
      this.chatService.joinEventChat(this.eventId);
    } else {
      this.chatService.leaveEventChat(this.eventId);
    }
  }

  loadMessages(): void {
    this.loading.set(true);
    this.chatService.getMessages(this.eventId).subscribe({
      next: (res) => {
        this.messages.set(res.data?.messages || []);
        this.loading.set(false);
        this.shouldScroll = true;
      },
      error: () => this.loading.set(false),
    });
  }

  send(): void {
    const content = this.newMessage.trim();
    if (!content) return;
    this.newMessage = '';
    this.chatService.emitStopTyping(this.eventId);

    if (this.chatService.isSocketConnected()) {
      this.chatService.sendMessage(this.eventId, content);
    } else {
      this.chatService.sendMessageHttp(this.eventId, content).subscribe({
        next: (res) => {
          if (res.data?.message) {
            this.messages.update(m => [...m, res.data.message]);
            this.shouldScroll = true;
          }
        },
      });
    }
  }

  onTyping(): void {
    this.chatService.emitTyping(this.eventId);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => this.chatService.emitStopTyping(this.eventId), 2000);
  }

  isMyMessage(msg: ChatMessage): boolean {
    const me = this.auth.currentUser();
    return msg.sender?._id === me?._id;
  }

  private scrollToBottom(): void {
    try { this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight; } catch {}
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chatService.leaveEventChat(this.eventId);
  }
}
