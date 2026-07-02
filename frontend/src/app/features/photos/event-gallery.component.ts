import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { PhotoService }       from '../../core/services/photo.service';
import { AuthService }        from '../../core/services/auth.service';
import { EventPhoto }         from '../../core/models/lot2.models';

@Component({
  selector: 'app-event-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-gallery.component.html',
  styleUrls: ['./event-gallery.component.css'],
})
export class EventGalleryComponent implements OnInit {
  @Input() eventId!: string;
  @Input() canUpload = false;
  @Input() isEventPast = false;

  photos        = signal<EventPhoto[]>([]);
  loading       = signal(true);
  uploading     = signal(false);
  uploadError   = signal<string | null>(null);
  pendingFiles  = signal<File[]>([]);
  lightboxIndex = signal<number | null>(null);
  caption       = '';
  dragging      = false;

  constructor(
    private photoService: PhotoService,
    public  auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.photoService.getPhotos(this.eventId).subscribe({
      next: (res) => { this.photos.set(res.data?.photos || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  photoUrl(url: string): string {
    return this.photoService.getPhotoUrl(url);
  }

  onFilePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.pendingFiles.set(Array.from(input.files));
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) this.pendingFiles.set(files);
  }

  clearPending(): void {
    this.pendingFiles.set([]);
    this.caption = '';
    this.uploadError.set(null);
  }

  uploadFiles(): void {
    if (!this.pendingFiles().length) return;
    this.uploading.set(true);
    this.uploadError.set(null);
    this.photoService.uploadPhotos(this.eventId, this.pendingFiles(), this.caption).subscribe({
      next: (res) => {
        this.photos.update(p => [...(res.data?.photos || []), ...p]);
        this.clearPending();
        this.uploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(err.error?.message || 'Échec de l\'upload.');
        this.uploading.set(false);
      },
    });
  }

  openLightbox(index: number): void  { this.lightboxIndex.set(index); }
  closeLightbox(): void              { this.lightboxIndex.set(null); }
  prevPhoto(): void { const i = this.lightboxIndex(); if (i !== null && i > 0) this.lightboxIndex.set(i - 1); }
  nextPhoto(): void { const i = this.lightboxIndex(); if (i !== null && i < this.photos().length - 1) this.lightboxIndex.set(i + 1); }

  /** Hide entire section when no photos and nothing actionable for the user */
  get showSection(): boolean {
    return this.loading() || this.photos().length > 0 || (this.canUpload && this.isEventPast);
  }

  scrollToUpload(): void {
    const el = document.querySelector('.upload-zone');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  deletePhoto(id: string): void {
    this.photoService.deletePhoto(id).subscribe({
      next: () => {
        this.photos.update(p => p.filter(ph => ph._id !== id));
        const idx = this.lightboxIndex();
        if (idx !== null) {
          if (this.photos().length === 0) this.closeLightbox();
          else this.lightboxIndex.set(Math.min(idx, this.photos().length - 1));
        }
      },
    });
  }
}
