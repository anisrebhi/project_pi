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
  <div class="messages-container" #messagesContainer>
    <div *ngFor="let msg of messages()" class="message-bubble" [class.mine]="isMyMessage(msg)">
      <div class="bubble-content">{{ msg.content }}</div>
      <div class="bubble-time">{{ msg.createdAt | date:'HH:mm' }}</div>
    </div>
    <div *ngIf="typingUser()" class="typing-indicator">
      <span class="typing-dots"><span></span><span></span><span></span></span>
      <span class="typing-name">{{ typingUser() }}</span> écrit…
    </div>
  </div>
  <div class="chat-input-area">
  </div>
</div>
  `,
  styles: [`
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
    this.chatService.connect();   // async, fire-and-forget

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
    return msg.sender._id === me?._id;
  }

  private scrollToBottom(): void {
    try { this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight; } catch {}
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.chatService.leaveEventChat(this.eventId);
  }
}
