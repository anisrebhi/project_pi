import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe }    from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { HttpClient, HttpParams }    from '@angular/common/http';
import { environment }               from '../../../../environments/environment';

@Component({
  selector: 'app-bo-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './bo-users.component.html',
  styleUrls: ['./bo-users.component.css'],
})
export class BoUsersComponent implements OnInit {
  users      = signal<any[]>([]);
  loading    = signal(true);
  acting     = signal<string|null>(null);
  total      = signal(0);
  page       = signal(1);
  totalPages = signal(1);
  toast      = signal<string|null>(null);
  errMsg     = signal<string|null>(null);
  search     = '';
  roleFilter = '';
  limit      = 20;

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    let params = new HttpParams().set('page', this.page()).set('limit', this.limit);
    if (this.search)     params = params.set('search', this.search);
    if (this.roleFilter) params = params.set('role', this.roleFilter);
    this.http.get<any>(`${environment.apiUrl}/users`, { params }).subscribe({
      next: r => { this.users.set(r.data || []); this.total.set(r.pagination?.total || 0); this.totalPages.set(r.pagination?.totalPages || 1); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeRole(user: any, newRole: string): void {
    if (user.role === newRole) return;
    this.acting.set(user._id);
    this.http.patch<any>(`${environment.apiUrl}/users/${user._id}/role`, { role: newRole }).subscribe({
      next: () => { user.role = newRole; this.acting.set(null); this.showToast('Rôle mis à jour.'); },
      error: e => { this.acting.set(null); this.showErr(e?.error?.message || 'Erreur.'); },
    });
  }

  toggleActive(user: any): void {
    this.acting.set(user._id);
    const endpoint = user.isActive !== false
      ? `${environment.apiUrl}/users/${user._id}/deactivate`
      : `${environment.apiUrl}/users/${user._id}/activate`;
    this.http.patch<any>(endpoint, {}).subscribe({
      next: () => { user.isActive = !user.isActive; this.acting.set(null); this.showToast('Statut mis à jour.'); },
      error: e => { this.acting.set(null); this.showErr(e?.error?.message || 'Erreur.'); },
    });
  }

  roleColor(role: string): string {
    return { ADMIN: 'linear-gradient(135deg,#ef4444,#f97316)', ORGANIZER: 'linear-gradient(135deg,#6366f1,#818cf8)', PARTICIPANT: 'linear-gradient(135deg,#10b981,#34d399)' }[role] || '#64748b';
  }

  setPage(p: number): void { if (p < 1 || p > this.totalPages()) return; this.page.set(p); this.load(); }
  private showToast(msg: string): void { this.toast.set(msg); setTimeout(() => this.toast.set(null), 3500); }
  private showErr(msg: string): void   { this.errMsg.set(msg); setTimeout(() => this.errMsg.set(null), 5000); }
}
