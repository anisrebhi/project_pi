import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../../../core/services/event.service';
import { EventModel } from '../../../../core/models/event.model';
import { ApiResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-event-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class AdminEventDetailComponent implements OnInit {
  event: EventModel | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant d\'événement manquant.';
      this.loading = false;
      return;
    }
    this.eventService.getById(id).subscribe({
      next: (res: ApiResponse<EventModel>) => {
        this.event = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Impossible de charger l\'événement.';
        this.loading = false;
      },
    });
  }

  organizerName(): string {
    const o = this.event?.organizer;
    return typeof o === 'object' && o ? (o.fullName || o.email) : '—';
  }

  organizerEmail(): string {
    const o = this.event?.organizer;
    return typeof o === 'object' && o ? (o.email || '') : '';
  }
}
