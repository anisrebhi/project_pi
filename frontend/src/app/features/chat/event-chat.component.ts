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
<<<<<<< HEAD
  <button class="chat-toggle" (click)="toggleChat()">
    <span class="material-icons toggle-icon">chat</span>
    <span class="toggle-label">Chat</span>
    <span class="unread-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
  </button>

  <div class="chat-panel" *ngIf="isOpen()" [class.chat-open]="isOpen()">
    <div class="chat-header">
      <div class="chat-header-left">
        <span class="material-icons header-icon">forum</span>
        <div>
          <h3>Chat de l'événement</h3>
          <div class="connection-indicator" [class.connected]="connected()">
            <span class="dot"></span>{{ connected() ? 'En direct' : 'Hors ligne' }}
          </div>
        </div>
      </div>
      <button class="close-btn" (click)="toggleChat()">
        <span class="material-icons">close</span>
      </button>
    </div>

    <div class="chat-messages" #messagesContainer>
      <div *ngIf="loading()" class="loading-chat">
        <div class="spinner spinner-sm"></div>
        <span>Chargement…</span>
      </div>
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

      <div *ngFor="let msg of messages()"
           class="message-bubble"
           [class.mine]="isMyMessage(msg)"
<<<<<<< HEAD
           [class.organizer]="msg.sender.role === 'ORGANIZER' || msg.sender.role === 'ADMIN'">
        <div class="bubble-meta" *ngIf="!isMyMessage(msg)">
          <div class="bubble-avatar">{{ msg.sender.fullName.charAt(0).toUpperCase() }}</div>
          <span class="sender-name">{{ msg.sender.fullName }}</span>
          <span class="sender-badge" *ngIf="msg.sender.role === 'ORGANIZER'">Organisateur</span>
          <span class="sender-badge admin" *ngIf="msg.sender.role === 'ADMIN'">Admin</span>
=======
           [class.organizer]="msg.sender?.role === 'ORGANIZER' || msg.sender?.role === 'ADMIN'">
        <div class="bubble-meta" *ngIf="!isMyMessage(msg)">
          <span class="sender-name">{{ msg.sender?.fullName }}</span>
          <span class="sender-badge" *ngIf="msg.sender?.role === 'ORGANIZER'">Organisateur</span>
          <span class="sender-badge admin" *ngIf="msg.sender?.role === 'ADMIN'">Admin</span>
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
        </div>
        <div class="bubble-content">{{ msg.content }}</div>
        <div class="bubble-time">{{ msg.createdAt | date:'HH:mm' }}</div>
      </div>

<<<<<<< HEAD
      <div *ngIf="typingUser()" class="typing-indicator">
        <span class="typing-dots"><span></span><span></span><span></span></span>
        <span class="typing-name">{{ typingUser() }}</span> écrit…
=======
      <!-- Typing indicator -->
      <div *ngIf="typingUser()" class="typing-indicator">
        <span class="typing-name">{{ typingUser() }}</span> écrit
        <span class="dots"><span></span><span></span><span></span></span>
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
      </div>
    </div>

    <div class="chat-input-area">
<<<<<<< HEAD
      <div class="input-wrap">
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
          <span class="material-icons">send</span>
        </button>
      </div>
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
    </div>
  </div>
</div>
  `,
  styles: [`
<<<<<<< HEAD
    :host { --chat-width: 380px; }
    .chat-container { position:fixed; bottom:0; right:0; z-index:1000; margin:0 var(--space-6) var(--space-6) 0; }
    .chat-toggle {
      display:inline-flex; align-items:center; gap:var(--space-2);
      background:var(--color-primary); color:#fff; border:none;
      border-radius:var(--radius-full); padding:.75rem 1.5rem .75rem 1rem;
      cursor:pointer; font-weight:700; font-size:.9rem;
      box-shadow:var(--shadow-brand); position:relative;
      transition:all var(--duration-base) var(--ease-out);
    }
    .chat-toggle:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,.45); }
    .toggle-icon { font-size:20px; }
    .toggle-label { display:inline; }
    @media(max-width:480px) { .toggle-label { display:none; } .chat-toggle { padding:.75rem; } }
    .unread-badge {
      position:absolute; top:-4px; right:-4px;
      background:var(--color-danger); color:#fff;
      border-radius:50%; min-width:20px; height:20px;
      font-size:.65rem; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      padding:0 4px; border:2px solid var(--color-surface);
    }
    .chat-panel {
      position:absolute; bottom:4.5rem; right:0;
      width:var(--chat-width); max-width:calc(100vw - 2rem);
      background:var(--color-surface); border-radius:var(--radius-xl);
      box-shadow:var(--shadow-2xl); display:flex; flex-direction:column;
      height:520px; border:1px solid var(--color-line); overflow:hidden;
      transform-origin:bottom right;
      animation:chatSlideIn var(--duration-slow) var(--ease-out);
    }
    @keyframes chatSlideIn {
      from { opacity:0; transform:translateY(16px) scale(.97); }
      to { opacity:1; transform:translateY(0) scale(1); }
    }
    .chat-header {
      padding:var(--space-4) var(--space-5);
      background:var(--color-surface);
      border-bottom:1px solid var(--color-line);
      display:flex; align-items:center; justify-content:space-between;
      flex-shrink:0;
    }
    .chat-header-left { display:flex; align-items:center; gap:var(--space-3); }
    .header-icon { color:var(--color-primary); font-size:22px; }
    .chat-header h3 { margin:0; font-size:.95rem; font-weight:700; color:var(--color-ink); }
    .connection-indicator { display:flex; align-items:center; gap:.3rem; font-size:.7rem; color:var(--color-muted); margin-top:1px; }
    .dot { width:7px; height:7px; border-radius:50%; background:var(--gray-300); display:inline-block; }
    .connection-indicator.connected .dot { background:var(--color-success); }
    .close-btn {
      background:none; border:none; cursor:pointer;
      color:var(--color-muted); padding:var(--space-1);
      border-radius:var(--radius-sm); transition:all var(--duration-fast);
      display:flex; align-items:center; justify-content:center;
    }
    .close-btn:hover { background:var(--gray-100); color:var(--color-ink); }
    :host-context(.dark) .close-btn:hover { background:var(--dark-surface-2); }
    .close-btn .material-icons { font-size:20px; }
    .chat-messages {
      flex:1; overflow-y:auto; padding:var(--space-4);
      display:flex; flex-direction:column; gap:var(--space-3);
      scroll-behavior:smooth;
    }
    .loading-chat { display:flex; align-items:center; justify-content:center; gap:var(--space-2); padding:var(--space-8); color:var(--color-muted); font-size:.85rem; }
    .message-bubble { max-width:80%; display:flex; flex-direction:column; animation:msgIn var(--duration-base) var(--ease-out); }
    @keyframes msgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .message-bubble.mine { align-self:flex-end; }
    .bubble-meta { display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-1); }
    .bubble-avatar {
      width:26px; height:26px; border-radius:var(--radius-full);
      background:linear-gradient(135deg,var(--brand-400),var(--color-primary));
      color:#fff; font-size:.7rem; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .mine .bubble-avatar { display:none; }
    .sender-name { font-size:.75rem; font-weight:600; color:var(--color-ink); }
    .sender-badge {
      font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
      background:var(--brand-50); color:var(--brand-700);
      padding:.1rem .45rem; border-radius:var(--radius-sm);
    }
    .sender-badge.admin { background:var(--color-warning-bg); color:#92400e; }
    .bubble-content {
      background:var(--gray-100); color:var(--color-ink);
      padding:.65rem 1rem; border-radius:var(--radius-lg);
      border-top-left-radius:var(--radius-sm);
      font-size:.875rem; line-height:1.5; word-break:break-word;
    }
    :host-context(.dark) .bubble-content { background:var(--dark-surface-2); }
    .mine .bubble-content {
      background:var(--color-primary); color:#fff;
      border-radius:var(--radius-lg); border-top-right-radius:var(--radius-sm);
      border-top-left-radius:var(--radius-lg);
    }
    .organizer .bubble-content { background:var(--brand-50); color:var(--brand-800); }
    :host-context(.dark) .organizer .bubble-content { background:rgba(99,102,241,.15); color:var(--brand-300); }
    .bubble-time { font-size:.65rem; color:var(--color-muted); margin-top:var(--space-1); padding:0 var(--space-1); }
    .mine .bubble-time { text-align:right; }
    .typing-indicator { display:flex; align-items:center; gap:var(--space-2); padding:var(--space-2) var(--space-3); color:var(--color-muted); font-size:.75rem; }
    .typing-name { font-weight:700; }
    .typing-dots { display:flex; gap:3px; }
    .typing-dots span { width:6px; height:6px; background:var(--gray-300); border-radius:50%; animation:bounce 1s infinite; }
    .typing-dots span:nth-child(2) { animation-delay:.15s; }
    .typing-dots span:nth-child(3) { animation-delay:.3s; }
    @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
    .chat-input-area {
      flex-shrink:0; padding:var(--space-3) var(--space-4);
      border-top:1px solid var(--color-line);
      background:var(--color-surface);
    }
    .input-wrap { display:flex; gap:var(--space-2); align-items:center; }
    .chat-input {
      flex:1;
      border:1.5px solid var(--color-line); border-radius:var(--radius-full);
      padding:.6rem 1.1rem; font-size:.85rem; outline:none;
      font-family:var(--font-body); color:var(--color-ink);
      background:var(--gray-50); transition:all var(--duration-fast);
    }
    :host-context(.dark) .chat-input { background:var(--dark-surface-2); border-color:var(--dark-line); color:var(--dark-ink); }
    .chat-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(99,102,241,.1); }
    .send-btn {
      background:var(--color-primary); color:#fff;
      border:none; border-radius:50%; width:38px; height:38px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:all var(--duration-fast) var(--ease-out);
      flex-shrink:0;
    }
    .send-btn:hover:not(:disabled) { background:var(--color-primary-dark); transform:scale(1.05); box-shadow:var(--shadow-brand); }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; }
    .send-btn .material-icons { font-size:18px; }
=======
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
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
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
<<<<<<< HEAD
    this.chatService.connect();   // async, fire-and-forget
=======
    this.chatService.connect();
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3

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
<<<<<<< HEAD
    return msg.sender._id === me?._id;
=======
    return msg.sender?._id === me?._id;
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
  }

  private scrollToBottom(): void {
    try { this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight; } catch {}
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chatService.leaveEventChat(this.eventId);
  }
}
