import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="state-screen">
      <div class="state-block">
        <span class="eyebrow">403</span>
        <h3>Accès refusé</h3>
        <p>Vous n'avez pas l'autorisation nécessaire pour accéder à cette page.</p>
        <a routerLink="/" class="btn btn-primary mt-16">Retour à l'accueil</a>
      </div>
    </div>
  `,
  styleUrl: './unauthorized.component.css',
})
export class UnauthorizedComponent {}
