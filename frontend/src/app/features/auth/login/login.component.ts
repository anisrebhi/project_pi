import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  loading = false;
  serverError = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
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

    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success(`Bienvenue, ${res.data.user.fullName} !`);
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
<<<<<<< HEAD
        const target = redirect || (res.data.user.role === 'ADMIN' || res.data.user.role === 'ORGANIZER' ? '/backoffice' : '/events');
=======
        const target = redirect || (res.data.user.role === 'ADMIN' ? '/admin/events' : '/events');
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
        this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err?.error?.message || 'Email ou mot de passe incorrect.';
      },
    });
  }
}
