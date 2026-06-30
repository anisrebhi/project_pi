import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FoNavbarComponent } from './fo-navbar.component';
import { FoFooterComponent } from './fo-footer.component';

@Component({
  selector: 'app-fo-layout',
  standalone: true,
  imports: [RouterOutlet, FoNavbarComponent, FoFooterComponent],
  template: `
    <app-fo-navbar></app-fo-navbar>
    <main class="fo-main">
      <router-outlet></router-outlet>
    </main>
    <app-fo-footer></app-fo-footer>
  `,
  styles: [`
    .fo-main { min-height: calc(100vh - 68px - 72px); }
  `],
})
export class FoLayoutComponent {}
