import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  template: `<span class="status-badge" [class]="badgeClass">{{ label }}</span>`,
  styles: [`
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: .25rem .75rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 700; letter-spacing: .04em;
      white-space: nowrap; text-transform: uppercase;
      transition: all var(--duration-fast) var(--ease-out);
    }
    .status-badge::before {
      content: ''; width: 6px; height: 6px;
      border-radius: 50%; background: currentColor; opacity: .7;
    }
    .badge-confirmed { background: var(--color-success-bg); color: #065f46; }
    .badge-pending   { background: var(--color-warning-bg); color: #92400e; }
    .badge-cancelled { background: var(--color-danger-bg); color: #991b1b; }
    .badge-free      { background: #d1fae5; color: #065f46; }
    .badge-paid      { background: var(--brand-100); color: var(--brand-700); }
    :host-context(.dark) .badge-confirmed { background: rgba(16,185,129,.15); color: #34d399; }
    :host-context(.dark) .badge-pending   { background: rgba(245,158,11,.15); color: #fbbf24; }
    :host-context(.dark) .badge-cancelled { background: rgba(239,68,68,.15); color: #f87171; }
    :host-context(.dark) .badge-free      { background: rgba(16,185,129,.12); color: #34d399; }
    :host-context(.dark) .badge-paid      { background: rgba(99,102,241,.15); color: var(--brand-300); }
  `],
<<<<<<< HEAD
=======
=======
  template: `<span class="badge" [class]="badgeClass">{{ label }}</span>`,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  private readonly labels: Record<string, string> = {
    confirmed: 'Confirmée',
    pending: 'En attente',
    cancelled: 'Annulée',
    free: 'Gratuit',
    paid: 'Payant',
  };

  get label(): string {
    return this.labels[this.status] ?? this.status;
  }

  get badgeClass(): string {
    return `badge-${this.status}`;
  }
}
