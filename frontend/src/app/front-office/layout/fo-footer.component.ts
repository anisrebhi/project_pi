import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fo-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
<footer class="fo-footer">
  <div class="fo-footer-inner">
    <div class="fo-footer-brand">
      <div class="fo-brand-icon">EP</div>
      <span class="fo-footer-name">EventPass</span>
      <p>La plateforme de gestion d'événements professionnels.</p>
    </div>
    <div class="fo-footer-links">
      <div class="fo-footer-col">
        <h4>Plateforme</h4>
        <a routerLink="/events">Événements</a>
        <a routerLink="/register">S'inscrire</a>
        <a routerLink="/login">Se connecter</a>
      </div>
    </div>
  </div>
  <div class="fo-footer-bottom">
    <span>© {{ year }} EventPass. Tous droits réservés.</span>
  </div>
</footer>
  `,
  styles: [`
    .fo-footer { background:#0f172a; color:#94a3b8; padding:var(--space-12) 0 0; }
    .fo-footer-inner { max-width:var(--max-w); margin:0 auto; padding:0 var(--space-6) var(--space-10); display:flex; gap:var(--space-12); flex-wrap:wrap; }
    .fo-footer-brand { flex:1; min-width:200px; }
    .fo-brand-icon { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,var(--color-primary),var(--brand-400)); color:#fff; font-weight:900; display:flex; align-items:center; justify-content:center; font-size:.9rem; margin-bottom:var(--space-3); }
    .fo-footer-name { display:block; font-size:1.1rem; font-weight:700; color:#f1f5f9; margin-bottom:var(--space-3); }
    .fo-footer-brand p { font-size:.875rem; line-height:1.6; max-width:240px; color:#64748b; }
    .fo-footer-links { display:flex; gap:var(--space-10); flex-wrap:wrap; }
    .fo-footer-col { display:flex; flex-direction:column; gap:var(--space-3); min-width:140px; }
    .fo-footer-col h4 { color:#e2e8f0; font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; font-weight:700; margin-bottom:var(--space-2); }
    .fo-footer-col a { color:#64748b; text-decoration:none; font-size:.875rem; transition:color var(--duration-fast); }
    .fo-footer-col a:hover { color:#94a3b8; }
    .fo-footer-bottom { border-top:1px solid #1e293b; padding:var(--space-5) var(--space-6); max-width:var(--max-w); margin:0 auto; font-size:.8rem; color:#475569; }
  `],
})
export class FoFooterComponent {
  year = new Date().getFullYear();
}
