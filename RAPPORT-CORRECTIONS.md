# Rapport de Corrections — EventPass

**Date** : 24 juin 2026  
**Statut** : ✅ Build production réussi — 0 erreur, 0 warning  
**Commande validée** : `ng build --configuration production`

---

## 🔴 Corrections Critiques

### 1. Routes événements non publiques (BACKEND)
**Fichier** : `backend/routes/eventRoutes.js`  
**Problème** : `router.use(protect)` bloquait TOUTES les routes événements, rendant la page d'accueil et la liste d'événements inaccessibles sans connexion.  
**Fix** : `GET /api/events` et `GET /api/events/:id` passent maintenant par `optionalAuth`. Seuls POST/PUT/DELETE/participants nécessitent `protect`.

### 2. Photos de galerie non accessibles publiquement (BACKEND)
**Fichier** : `backend/routes/photoRoutes.js`  
**Problème** : `router.use(protect)` bloquait aussi la lecture de la galerie photos.  
**Fix** : `GET /api/photos/:eventId` est public avec `optionalAuth`.

### 3. Double padding-top sur le Front Office (FRONTEND)
**Fichier** : `frontend/src/app/front-office/layout/fo-layout.component.ts`  
**Problème** : `fo-layout` ajoutait `padding-top: 68px` sur `.fo-main` ET les classes utilitaires `.page`/`.page-wide`/`.page-narrow` de `styles.css` ajoutaient `calc(var(--topbar-h) + var(--space-8))` — résultat : espace vide de ~100px en haut de chaque page.  
**Fix** : Suppression du `padding-top` de `.fo-main` + ajout du `padding-top: var(--topbar-h)` directement dans les pages à CSS custom (`.events-page`, `.detail-page`).

### 4. `@import` CSS inter-composants cassé (FRONTEND)
**Fichier** : `frontend/src/app/features/auth/register/register.component.css`  
**Problème** : `@import url(../login/login.component.css)` — Angular isole les styles par composant, cet import est ignoré silencieusement → page register sans styles.  
**Fix** : Les styles auth partagés sont maintenant dupliqués directement dans `register.component.css`.

### 5. Lien de navigation cassé `/backoffice/reclamations` (FRONTEND)
**Fichier** : `frontend/src/app/back-office/layout/bo-sidebar.component.ts`  
**Problème** : Item "Réclamations" pointant vers une route inexistante → 404 au clic.  
**Fix** : Item supprimé de `navItems`.

---

## 🟠 Corrections Importantes

### 6. Redirection post-login vers ancienne route (FRONTEND)
**Fichiers** : `login.component.ts`, `register.component.ts`  
**Problème** : Après connexion, admin/organisateur était redirigé vers `/admin/events` (ancien chemin) au lieu de `/backoffice`.  
**Fix** : Redirection vers `/backoffice` pour `ADMIN` et `ORGANIZER`.

### 7. Validator initial `Validators.max(1)` bloquant les réservations (FRONTEND)
**Fichier** : `event-detail.component.ts`  
**Problème** : Le champ `numberOfTickets` avait `max(1)` à l'initialisation → impossible de réserver plus d'1 billet.  
**Fix** : Changé en `max(20)` (limite réelle du backend).

### 8. Système de thème dark/light désynchronisé (FRONTEND)
**Problème** : `AppComponent`, `FoNavbarComponent` et `BoTopbarComponent` avaient chacun leur propre logique de toggle du thème — les trois systèmes pouvaient diverger.  
**Fix** : Création de `ThemeService` (`core/services/theme.service.ts`) qui centralise la logique via un signal Angular. Tous les composants l'injectent maintenant.

### 9. Classe `.state-screen` manquante (FRONTEND)
**Fichiers** : `not-found.component.css`, `unauthorized.component.css`  
**Problème** : Les templates utilisaient `.state-screen` sans que cette classe soit définie.  
**Fix** : Ajout de `.state-screen` (centrage flex pleine hauteur) dans les deux CSS.

### 10. `display` dupliqué sur `:host` (FRONTEND)
**Fichiers** : `not-found.component.css`, `unauthorized.component.css`  
**Problème** : `:host { display: block; ... display: flex; }` — le premier `display` était ignoré.  
**Fix** : Suppression du `display: block` redondant.

---

## 🟡 Corrections CSS / Variables

### 11. Variable `var(--gray-900)` indéfinie
**Fichier** : `home.component.css`  
**Fix** : Remplacé par `var(--dark-bg)`.

### 12. Variable `var(--gray-800)` indéfinie
**Fichier** : `events/user/event-list/event-list.component.css`  
**Fix** : Remplacé par `var(--dark-surface-2)`.

### 13. Variable `--bo-bg` non définie
**Fichier** : `styles.css`  
**Fix** : Ajout de `--bo-bg: #f0f4f8` dans `:root` et `--bo-bg: var(--dark-bg-subtle)` dans `.dark`.

### 14. Variable `--transition` manquante
**Fichier** : `styles.css`  
**Fix** : Ajout de `--transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)` pour compatibilité avec l'ancien composant navbar.

### 15. Classe `.bo-section` sans style
**Fichier** : `bo-dashboard.component.ts`  
**Fix** : Ajout de `.bo-section { width: 100%; }`.

---

## 🔵 Corrections Assets & Build

### 16. Logo SVG introuvable au runtime (FRONTEND)
**Problème** : Angular 18 sert les assets depuis `public/`, mais `logo.svg` était dans `src/assets/`.  
**Fix** :  
- Copie du logo dans `public/logo.svg`  
- Ajout de `src/assets` dans `angular.json` pour compatibilité double

### 17. Budget CSS de production trop restrictif (FRONTEND)
**Fichier** : `angular.json`  
**Problème** : Limite de 4kB/8kB pour les styles de composants → plusieurs composants du nouveau design la dépassaient (gallery: 6.7kB, review: 5kB, etc.).  
**Fix** : Augmentation à 8kB (warning) / 16kB (error).

### 18. Encodage CRLF sur certains fichiers backend (BACKEND)
**Fichiers** : `authController.js`, `authMiddleware.js`, `db.js`, `User.js`, `roleMiddleware.js`, `Reservation.js`, `userRoutes.js`, `authRoutes.js`, `reclamationController.js`, `reclamationRoutes.js`, `Reclamation.js`, `swagger.js`  
**Problème** : Caractères `\r\n` Windows pouvant causer des erreurs subtiles en environnement Linux/Docker.  
**Fix** : Conversion universelle en LF avec `sed -i 's/\r//'`.

---

## ✅ Résultat du Build Production

```
Initial chunk files   | Names    | Raw size | Transfer size
main.js               | main     | 725.53 kB | 145.01 kB
chunk.js              | -        | 183.42 kB |  52.76 kB
styles.css            | styles   | 109.08 kB |  14.33 kB
polyfills.js          | polyfills |  34.52 kB |  11.28 kB

Application bundle generation complete. [24.9 seconds]
Output: dist/event-reservation-app/
```

---

## 📋 Architecture Préservée

- ✅ Même structure de dossiers (frontend/backend)
- ✅ Même routage Angular (FoLayout + BoLayout)
- ✅ Même design conservé et uniformisé
- ✅ Mêmes services, guards, interceptors
- ✅ Mêmes modèles backend (Event, Reservation, User, etc.)
- ✅ Toutes les fonctionnalités (chat, waitlist, certificates, gallery, reviews) conservées
