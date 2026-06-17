import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);

  loading = false;
  serverError = '';

  /** Roles a visitor is allowed to self-select at sign-up. ADMIN is excluded
   *  and enforced server-side regardless of what is submitted here. */
  readonly availableRoles: { value: UserRole; label: string }[] = [
    { value: 'PARTICIPANT', label: 'Participant' },
    { value: 'ORGANIZER', label: 'Organisateur' },
  ];

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['PARTICIPANT' as UserRole, [Validators.required]],
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.serverError = '';

    const raw = this.form.getRawValue();
    this.auth
      .register({
        fullName: raw.fullName!,
        email: raw.email!,
        password: raw.password!,
        phone: raw.phone || undefined,
        role: raw.role!,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.success(`Compte créé. Bienvenue, ${res.data.user.fullName} !`);
          this.router.navigateByUrl(res.data.user.role === 'ADMIN' ? '/admin/events' : '/events');
        },
        error: (err) => {
          this.loading = false;
          this.serverError = err?.error?.message || "Une erreur est survenue lors de l'inscription.";
        },
      });
  }
}
