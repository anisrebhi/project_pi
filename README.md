# EventPass — Application complète (Backend + Frontend)

Ce dossier contient les **deux parties** de l'application Événements & Réservations :

```
event-pass-app/
├── backend/      → API Node.js / Express / MongoDB
└── frontend/     → Application Angular (4 interfaces : Événement/Réservation × Admin/Utilisateur)
```

Chaque sous-dossier est un projet Node indépendant avec son propre `package.json` —
il faut installer et lancer chacun séparément, dans deux terminaux différents.

## 1. Lancer le backend

```bash
cd backend
npm install
```

Avant de démarrer, vérifiez/complétez le fichier `.env` à la racine de `backend/`
(une copie d'exemple existe dans `.env.example`) :

```
MONGODB_URI=mongodb://127.0.0.1:27017/event_management
JWT_SECRET=changez_cette_valeur
PORT=5000
FRONTEND_URL=http://localhost:4200
```

Il faut une instance MongoDB qui tourne (locale via `mongod`, ou un cluster
Atlas — dans ce cas remplacez `MONGODB_URI` par votre URI Atlas).

Pour l'envoi d'emails (confirmation de réservation + QR code), complétez aussi
les variables `SMTP_*` dans `.env`. Si elles sont laissées vides, les emails
sont simplement affichés dans la console du serveur (pratique pour tester
sans vraie boîte mail).

Démarrage :

```bash
npm start
# ou, si le script "dev" existe dans package.json :
npm run dev
```

Le serveur backend tourne par défaut sur `http://localhost:5000`. La
documentation Swagger est généralement disponible sur
`http://localhost:5000/api-docs` (à vérifier selon la config dans `app.js`).

## 2. Lancer le frontend (dans un second terminal)

```bash
cd frontend
npm install
npm start
```

L'application Angular démarre sur `http://localhost:4200` et appelle l'API à
l'URL définie dans `frontend/src/environments/environment.ts` :

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
};
```

Si votre backend tourne sur un port différent, modifiez cette valeur avant de
lancer `npm start`.

## 3. Ordre de démarrage recommandé

1. Démarrer MongoDB.
2. Démarrer le backend (`backend/`, port 5000).
3. Démarrer le frontend (`frontend/`, port 4200).
4. Ouvrir `http://localhost:4200` dans le navigateur.

## 4. Créer un compte administrateur

L'inscription publique (`/register`) crée toujours un compte avec le rôle
`PARTICIPANT`. Pour tester les interfaces Admin (`/admin/events`,
`/admin/reservations`), il faut promouvoir un utilisateur en `ADMIN`
directement dans MongoDB, par exemple avec `mongosh` :

```js
use event_management
db.users.updateOne(
  { email: "votre-email@exemple.com" },
  { $set: { role: "ADMIN" } }
)
```

Déconnectez-vous puis reconnectez-vous ensuite dans l'application pour que le
nouveau rôle soit pris en compte (le rôle est inclus dans le token JWT émis à
la connexion).

## 5. Documentation détaillée

- `backend/` : voir les commentaires dans `app.js`, `routes/*.js` et
  `controllers/*.js` pour le détail des endpoints et règles métier
  (validation des dates, contrôle d'accès par rôle, génération de QR code,
  envoi d'email, génération de PDF).
- `frontend/README.md` : structure du projet Angular, détail des guards/
  intercepteurs/validateurs, et correspondance avec les règles backend.
