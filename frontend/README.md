# EventPass — Frontend Angular (Événements & Réservations)

Application Angular (standalone components, Angular 18) consommant l'API backend
Node/Express (`backend_with_qrcode_updated.zip`) du module Événement & Réservation.

Conformément au cahier des charges, l'application expose **4 interfaces** réparties en
2 modules :

| Module       | Interface Administrateur                  | Interface Utilisateur                        |
|--------------|--------------------------------------------|------------------------------------------------|
| Événement    | `/admin/events` — CRUD complet              | `/events` — catalogue + détail + réservation   |
| Réservation  | `/admin/reservations` — vue globale, filtres | `/my-reservations` — mes réservations, billet PDF |

## Démarrage

```bash
npm install
npm start            # équivalent à: ng serve  →  http://localhost:4200
```

L'application appelle l'API sur l'URL définie dans
`src/environments/environment.ts` (`apiUrl: 'http://localhost:5000/api'` par défaut —
adaptez-la si votre backend tourne sur un autre port/host). Pour la build de
production, modifiez `src/environments/environment.production.ts`.

```bash
npm run build         # build de production dans dist/event-reservation-app
```

## Authentification & rôles

- Connexion / inscription : `POST /api/auth/login`, `POST /api/auth/register`.
- Le token JWT est stocké côté client (`localStorage`) et injecté automatiquement
  sur chaque requête via `core/interceptors/auth.interceptor.ts`.
- `core/interceptors/error.interceptor.ts` déconnecte l'utilisateur et le redirige
  vers `/login` en cas de réponse `401`.
- `core/guards/auth.guard.ts` protège toutes les routes de l'application (sauf
  login/register).
- `core/guards/role.guard.ts` restreint `/admin/*` au rôle `ADMIN` (redirection
  vers `/unauthorized` sinon).

## Règle : date future obligatoire (Module Événement)

Le formulaire de création/modification d'événement
(`features/events/admin/event-form`) applique :

- `futureDateValidator` (`shared/validators/date.validators.ts`) : la date de
  début doit être strictement postérieure à l'instant présent. Un message
  d'erreur explicite est affiché si la date choisie est dans le passé.
- `dateRangeValidator` : la date de fin doit être postérieure à la date de début.
- L'attribut `min` du champ `datetime-local` empêche aussi la sélection d'une
  date passée dans le sélecteur natif du navigateur.

Ces règles reproduisent côté client celles déjà appliquées côté backend
(`express-validator` + hooks Mongoose), pour un retour immédiat à l'utilisateur
sans attendre la réponse serveur — le backend reste la source de vérité en cas
de contournement du formulaire.

## Réservations : contrôle d'accès par rôle

- `GET /api/reservations` (interface Admin) renvoie toutes les réservations.
- `GET /api/reservations/user/:userId` (interface Utilisateur, "Mes
  réservations") ne renvoie que les réservations de l'utilisateur connecté —
  le backend vérifie que `userId` correspond bien à l'utilisateur authentifié
  (ou que l'appelant est `ADMIN`).
- Il n'existe **aucune route `GET /api/reservations/:id`** : conformément à la
  consigne « pas d'accès direct par ID », le détail d'une réservation
  (`features/reservations/user/reservation-detail`) est résolu en filtrant la
  liste des réservations de l'utilisateur courant.

## QR Code & PDF

- Après confirmation d'une réservation, un email contenant le QR code et les
  détails de la réservation est envoyé automatiquement (géré côté backend).
- La page de détail de réservation affiche le QR code retourné par l'API
  (`reservation.qrCode`, une image `data:image/png;base64,...`) dans un encart
  façon "souche de billet".
- Le bouton **Télécharger le billet (PDF + QR code)** appelle
  `GET /api/reservations/:id/ticket` (réponse `Blob`) et déclenche le
  téléchargement du PDF côté navigateur.

## Structure du projet

```
src/app/
├── core/
│   ├── models/          # Interfaces TypeScript miroir des schémas API
│   ├── services/         # AuthService, EventService, ReservationService
│   ├── interceptors/      # JWT + gestion des erreurs 401
│   └── guards/            # authGuard, roleGuard, guestGuard
├── layout/
│   ├── navbar/            # Navigation contextuelle selon le rôle
│   └── main-layout/       # Coquille applicative (navbar + router-outlet)
├── shared/
│   ├── components/        # StatusBadge, Toast, ConfirmDialog
│   ├── validators/         # futureDateValidator, dateRangeValidator
│   └── utils/               # Conversion ISO ↔ datetime-local
└── features/
    ├── auth/                  # login, register
    ├── events/
    │   ├── admin/              # event-list (CRUD), event-form
    │   └── user/                 # event-list (catalogue), event-detail (+ réservation)
    ├── reservations/
    │   ├── admin/                # reservation-list (vue globale, filtres, annulation)
    │   └── user/                   # reservation-list ("Mes réservations"), reservation-detail (QR + PDF)
    └── misc/                        # not-found (404), unauthorized (403)
```

## Notes

- Aucune donnée sensible (mot de passe, token complet) n'est journalisée côté
  client.
- Les montants sont affichés en DT (Dinar tunisien) — à adapter si nécessaire
  selon votre devise.
- Le projet n'inclut pas encore de tests unitaires (`*.spec.ts`) ; à ajouter
  selon vos standards de qualité internes.
