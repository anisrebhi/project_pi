import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
<<<<<<< HEAD
import { ThemeService } from './core/services/theme.service';
=======
<<<<<<< HEAD
import { ThemeService } from './core/services/theme.service';
=======
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
export class AppComponent {
  // ThemeService is injected to initialize the effect (apply dark class on startup)
  constructor(private theme: ThemeService) {}
}
<<<<<<< HEAD
=======
=======
export class AppComponent {}
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
