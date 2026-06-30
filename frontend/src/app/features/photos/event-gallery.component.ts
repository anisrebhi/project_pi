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
<<<<<<< HEAD
  templateUrl: './event-gallery.component.html',
  styleUrls: ['./event-gallery.component.css'],
=======
  template: `
<div class="gallery-section">
  <div class="gallery-header">
    <h2>📸 Galerie Photos</h2>
    <span class="photo-count" *ngIf="photos().length > 0">{{ photos().length }} photo(s)</span>
  </div>

  <!-- Upload zone (organizer/admin only, event must be past) -->
  <div class="upload-zone" *ngIf="canUpload && isEventPast">
    <label class="upload-label" [class.dragging]="dragging">
      <input type="file" multiple accept="image/*" (change)="onFilePick($event)" hidden />
      <div class="upload-inner" (dragover)="dragging=true" (dragleave)="dragging=false" (drop)="onDrop($event)">
        <span class="upload-icon">☁️</span>
        <p>Glissez des photos ici ou <strong>cliquez pour choisir</strong></p>
        <small>JPEG, PNG, WEBP — max 8 Mo par photo</small>
      </div>
    </label>
    <div *ngIf="pendingFiles().length > 0" class="pending-preview">
      <p><strong>{{ pendingFiles().length }} fichier(s) sélectionné(s)</strong></p>
      <input type="text" [(ngModel)]="caption" placeholder="Légende (optionnelle)" class="caption-input" />
      <div class="pending-actions">
        <button class="btn btn-primary" (click)="uploadFiles()" [disabled]="uploading()">
          {{ uploading() ? 'Envoi…' : 'Envoyer' }}
        </button>
        <button class="btn btn-outline" (click)="clearPending()">Annuler</button>
      </div>
    </div>
    <p class="upload-error" *ngIf="uploadError()">{{ uploadError() }}</p>
  </div>

  <div *ngIf="loading()" class="loading-gallery">
    <div class="spinner"></div>Chargement de la galerie…
  </div>

  <div *ngIf="!loading() && photos().length === 0" class="empty-gallery">
    <div class="empty-icon">📷</div>
    <p>Aucune photo pour le moment.</p>
    <small *ngIf="canUpload && isEventPast">Ajoutez les souvenirs de l'événement !</small>
  </div>

  <!-- Photo grid -->
  <div class="photo-grid" *ngIf="!loading() && photos().length > 0">
    <div *ngFor="let photo of photos(); let i = index" class="photo-tile" (click)="openLightbox(i)">
      <img [src]="photoUrl(photo.url)" [alt]="photo.caption || photo.originalName" loading="lazy" />
      <div class="photo-overlay">
        <span class="zoom-icon">🔍</span>
        <p *ngIf="photo.caption" class="tile-caption">{{ photo.caption }}</p>
      </div>
    </div>
  </div>

  <!-- Lightbox -->
  <div class="lightbox" *ngIf="lightboxIndex() !== null" (click)="closeLightbox()">
    <div class="lightbox-inner" (click)="$event.stopPropagation()">
      <button class="lb-nav lb-prev" (click)="prevPhoto()">‹</button>
      <div class="lb-image-wrap">
        <img [src]="photoUrl(photos()[lightboxIndex()!].url)" [alt]="photos()[lightboxIndex()!].caption || ''" />
        <div class="lb-info">
          <p *ngIf="photos()[lightboxIndex()!].caption">{{ photos()[lightboxIndex()!].caption }}</p>
          <span>{{ lightboxIndex()! + 1 }} / {{ photos().length }}</span>
        </div>
      </div>
      <button class="lb-nav lb-next" (click)="nextPhoto()">›</button>
      <button class="lb-close" (click)="closeLightbox()">✕</button>
      <button *ngIf="canUpload" class="lb-delete" (click)="deletePhoto(photos()[lightboxIndex()!]._id)">🗑</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .gallery-section { background:#fff; border-radius:16px; padding:1.5rem; border:1px solid #e2e8f0; margin-top:1.5rem; }
    .gallery-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.25rem; }
    .gallery-header h2 { font-size:1.25rem; font-weight:700; color:#1e293b; margin:0; }
    .photo-count { background:#ede9fe; color:#6366f1; padding:.25rem .75rem; border-radius:20px; font-size:.8rem; font-weight:700; }
    .upload-zone { background:#f8fafc; border:2px dashed #cbd5e1; border-radius:12px; padding:1rem; margin-bottom:1.25rem; }
    .upload-label { cursor:pointer; display:block; }
    .upload-inner { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem; border-radius:8px; transition:background .2s; text-align:center; }
    .upload-inner:hover, .upload-zone .dragging .upload-inner { background:#ede9fe; }
    .upload-icon { font-size:2.5rem; margin-bottom:.5rem; }
    .pending-preview { padding:.75rem; background:#fff; border-radius:8px; border:1px solid #e2e8f0; margin-top:.75rem; }
    .caption-input { width:100%; border:1.5px solid #e2e8f0; border-radius:8px; padding:.5rem .75rem; font-size:.9rem; margin:.5rem 0; box-sizing:border-box; }
    .pending-actions { display:flex; gap:.5rem; margin-top:.5rem; }
    .upload-error { color:#dc2626; font-size:.85rem; margin-top:.5rem; }
    .loading-gallery { display:flex; align-items:center; gap:.75rem; color:#94a3b8; padding:2rem; justify-content:center; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-gallery { text-align:center; padding:3rem; color:#94a3b8; }
    .empty-icon { font-size:3rem; margin-bottom:.75rem; }
    .photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.75rem; }
    .photo-tile { position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; cursor:pointer; }
    .photo-tile img { width:100%; height:100%; object-fit:cover; transition:transform .3s; }
    .photo-tile:hover img { transform:scale(1.06); }
    .photo-overlay { position:absolute; inset:0; background:rgba(0,0,0,0); display:flex; flex-direction:column; align-items:center; justify-content:center; transition:background .2s; }
    .photo-tile:hover .photo-overlay { background:rgba(0,0,0,.4); }
    .zoom-icon { font-size:1.5rem; opacity:0; transition:opacity .2s; }
    .photo-tile:hover .zoom-icon { opacity:1; }
    .tile-caption { color:#fff; font-size:.75rem; text-align:center; padding:.25rem .5rem; max-width:90%; opacity:0; transition:opacity .2s; }
    .photo-tile:hover .tile-caption { opacity:1; }
    /* Lightbox */
    .lightbox { position:fixed; inset:0; background:rgba(0,0,0,.92); z-index:9999; display:flex; align-items:center; justify-content:center; }
    .lightbox-inner { position:relative; display:flex; align-items:center; gap:1rem; max-width:90vw; }
    .lb-image-wrap { max-width:80vw; max-height:85vh; }
    .lb-image-wrap img { max-width:100%; max-height:80vh; border-radius:8px; display:block; }
    .lb-info { color:#94a3b8; font-size:.85rem; margin-top:.5rem; text-align:center; }
    .lb-nav { background:rgba(255,255,255,.1); color:#fff; border:none; border-radius:50%; width:44px; height:44px; font-size:1.8rem; cursor:pointer; line-height:1; transition:background .2s; }
    .lb-nav:hover { background:rgba(255,255,255,.25); }
    .lb-close,.lb-delete { position:absolute; border:none; border-radius:50%; cursor:pointer; }
    .lb-close { top:-16px; right:-16px; background:#fff; color:#1e293b; width:32px; height:32px; font-size:.9rem; }
    .lb-delete { top:-16px; right:20px; background:#ef4444; color:#fff; width:32px; height:32px; font-size:.9rem; }
    .btn { padding:.5rem 1.2rem; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-size:.875rem; }
    .btn-primary { background:#6366f1; color:#fff; } .btn-primary:hover:not(:disabled) { background:#4f46e5; }
    .btn-outline { background:transparent; border:1.5px solid #6366f1; color:#6366f1; } .btn-outline:hover { background:#ede9fe; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    @media(max-width:480px) { .photo-grid { grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); } }
  `],
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
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
