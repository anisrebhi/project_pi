import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { WaitlistService }   from '../../core/services/waitlist.service';
import { WaitlistEntry }     from '../../core/models/waitlist.model';
import { EventModel }        from '../../core/models/event.model';
import { ToastService }      from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-waitlist-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './waitlist-list.component.html',
  styleUrls: ['./waitlist-list.component.css'],
})
export class WaitlistListComponent implements OnInit {
  entries: WaitlistEntry[] = [];
  loading = true;
  error = '';
  leavingId: string | null = null;

  constructor(
    private waitlistService: WaitlistService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.waitlistService.getMyWaitlist().subscribe({
      next: (res) => { this.entries = res.data; this.loading = false; },
      error: () => { this.error = 'Impossible de charger votre liste d\'attente.'; this.loading = false; },
    });
  }

  asEvent(val: any): EventModel { return val as EventModel; }

  leave(entry: WaitlistEntry): void {
    const eventId = typeof entry.event === 'string' ? entry.event : (entry.event as EventModel)._id;
    this.leavingId = entry._id;
    this.waitlistService.leave(eventId).subscribe({
      next: () => {
        this.leavingId = null;
        this.entries = this.entries.filter((e) => e._id !== entry._id);
        this.toast.show('Vous avez quitté la liste d\'attente.', 'info');
      },
      error: (err) => {
        this.leavingId = null;
        this.toast.error(err?.error?.message || 'Erreur lors de la suppression.');
      },
    });
  }
}
