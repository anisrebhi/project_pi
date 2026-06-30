# Rapport de corrections — EventPass v3

## Bugs identifiés et corrigés

### 🔴 Bug #1 — CRITIQUE : Dates non affichées dans les cartes événements
**Cause** : Le pipe Angular `date:'EEE d MMM yyyy':'':'fr-FR'` nécessite que la locale `fr-FR` soit enregistrée via `registerLocaleData()` ET que `LOCALE_ID` soit fourni dans `app.config.ts`. Ces deux éléments manquaient complètement.

**Symptôme** : Les dates s'affichaient vides (icône calendrier sans texte).

**Correction** (`frontend/src/app/app.config.ts`) :
```typescript
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr-FR');
// Dans providers:
{ provide: LOCALE_ID, useValue: 'fr-FR' }
```
Tous les pipes `date:'...':'':'fr-FR'` dans tous les composants ont été nettoyés (le paramètre locale explicite est désormais superflu car `LOCALE_ID` est global).

---

### 🔴 Bug #2 — Image placeholder vide pour "Workshop Node.js"
**Cause** : La `div.event-tile-img-placeholder` n'avait pas de hauteur CSS fixe. Sans image, le conteneur `.event-tile-img` avait une hauteur déclarée de `180px` mais le placeholder `position: static` ne la remplissait pas.

**Correction** (`event-list.component.css`) :
```css
.event-tile-img {
  position: relative;
  height: 200px;     /* hauteur fixe garantie */
  flex-shrink: 0;    /* jamais écrasé */
}
.event-tile-img-placeholder {
  position: absolute; inset: 0;  /* remplit toute la zone */
  width: 100%; height: 100%;
}
```

---

### 🔴 Bug #3 — Événements filtrés par `startFrom=now` (listUpcoming)
**Cause** : Le composant utilisait `eventService.listUpcoming()` qui ajoute `startFrom: new Date().toISOString()` — filtrant les événements passés. Des événements valides créés récemment pouvaient disparaître selon leur date.

**Correction** (`event-list.component.ts`) : Utilisation de `eventService.list()` avec `order: 'asc'` pour afficher tous les événements actifs.

---

### 🟡 Bug #4 — Virtuals Mongoose perdus avec `.lean()`
**Cause** : `getAllEvents` utilisait `.lean()` pour la performance, ce qui supprime les virtuels Mongoose (`isFull`, `isPast`, `availableSpots`, `participantCount`). Le frontend avait des fallbacks mais `isFull` ne s'affichait jamais.

**Correction** (`backend/controllers/eventController.js`) : Calcul manuel des champs après la requête lean :
```javascript
const enriched = events.map(ev => ({
  ...ev,
  participants: [],
  participantCount: Array.isArray(ev.participants) ? ev.participants.length : 0,
  availableSpots: Math.max(0, ev.capacity - participantCount),
  isFull: availableSpots <= 0,
  isPast: new Date(ev.endDate) < new Date(),
}));
```

---

### 🟡 Bug #5 — Recherche `$text` peu fiable
**Cause** : La recherche utilisait `filter.$text = { $search }` qui nécessite que l'index texte soit chaud. En développement, cela échouait souvent.

**Correction** : Remplacement par un filtre regex insensible à la casse sur `title` et `description`.

---

### 🟡 Bug #6 — Liens `/admin/events` invalides dans le back-office
**Cause** : Les templates admin pointaient vers `/admin/events` mais les routes Angular utilisent `/backoffice/events`.

**Correction** : Tous les liens corrigés vers `/backoffice/events` dans :
- `event-list.component.html` (admin)
- `event-form.component.ts`
- `event-form.component.html`

---

### 🟡 Bug #7 — `event.participants.length` sans null safety
**Cause** : `{{ event.participants.length }}` dans le template admin pouvait throw si `participants` était `undefined` ou `null` (ce qui est le cas depuis le bug #4 — `participants: []` est maintenant toujours vide).

**Correction** : `{{ event.participantCount ?? (event.participants?.length ?? 0) }}`

---

### 🟡 Bug #8 — Événements inactifs visibles publiquement
**Cause** : `getAllEvents` n'appliquait pas de filtre `isActive` pour les utilisateurs publics.

**Correction** : Filtre `isActive: true` ajouté pour les non-staff.

---

## Fichiers modifiés

### Frontend (Angular)
| Fichier | Modification |
|---|---|
| `app/app.config.ts` | LOCALE_ID + registerLocaleData fr-FR |
| `events/user/event-list/event-list.component.ts` | list() au lieu de listUpcoming(), takeUntil, fix erreurs |
| `events/user/event-list/event-list.component.html` | Date pipe, placeholder, icônes, organisateur |
| `events/user/event-list/event-list.component.css` | Hauteur image fixe, placeholder position:absolute |
| `events/user/event-detail/event-detail.component.html` | Date pipe format |
| `events/admin/event-list/event-list.component.html` | Liens backoffice, participants null-safe |
| `events/admin/event-form/event-form.component.ts` | Liens backoffice |
| `events/admin/event-form/event-form.component.html` | Liens backoffice |
| `reservations/user/reservation-list/reservation-list.component.html` | Date pipe |
| `reservations/user/reservation-detail/reservation-detail.component.html` | Date pipe |
| `reservations/admin/reservation-list/reservation-list.component.html` | Date pipe |
| `certificates/verify-certificate.component.ts` | Date pipe |
| `certificates/my-certificates.component.ts` | Date pipe |
| `recommendations/similar-events.component.ts` | Date pipe |
| `recommendations/recommended-events.component.html` | Date pipe |
| `waitlist/waitlist-list.component.html` | Date pipe |

### Backend (Node.js/Express)
| Fichier | Modification |
|---|---|
| `controllers/eventController.js` | Calcul enriched (isFull/isPast/participantCount), filtre isActive, regex search |
