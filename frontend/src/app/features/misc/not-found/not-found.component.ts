import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="state-screen">
      <div class="state-block">
        <span class="eyebrow">404</span>
        <h3>Page introuvable</h3>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <a routerLink="/" class="btn btn-primary mt-16">Retour à l'accueil</a>
      </div>
    </div>
  `,
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {}
