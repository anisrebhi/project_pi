import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="badgeClass">{{ label }}</span>`,
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
