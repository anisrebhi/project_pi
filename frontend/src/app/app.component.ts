import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ThemeService } from './core/services/theme.service';

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
export class AppComponent {
  // ThemeService is injected to initialize the effect (apply dark class on startup)
  constructor(private theme: ThemeService) {}
}
