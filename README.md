# Event Management API — v2

REST API complète construite avec **Node.js**, **Express.js** et **MongoDB (Mongoose)**.

## Modules
- **Events** — CRUD complet avec images, géolocalisation, type free/paid
- **Users** — gestion des utilisateurs et relation Many-to-Many avec les événements
- **Reservations** — réservation, annulation, participants, calcul automatique du prix

---

## Structure du projet

```
event-mgmt-v2/
├── config/
│   └── db.js                          MongoDB connection
├── models/
│   ├── User.js                        Schéma utilisateur
│   ├── Event.js                       Schéma événement (location, images, type)
│   └── Reservation.js                 Schéma réservation
├── controllers/
│   ├── eventController.js             CRUD events + participants
│   ├── userController.js              CRUD users
│   └── reservationController.js       Réservations + annulation
├── routes/
│   ├── eventRoutes.js
│   ├── userRoutes.js
│   └── reservationRoutes.js
├── middleware/
│   ├── errorMiddleware.js             Gestion erreurs centralisée
│   ├── uploadMiddleware.js            Multer — upload images
│   └── validationMiddleware.js        express-validator
├── uploads/                           Images uploadées
├── .env
├── server.js
└── package.json
```

---

## Installation

```bash
cd event-mgmt-v2
npm install
# Configurer .env (voir ci-dessous)
npm run dev
```

### Fichier `.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/event_management_v2
BASE_URL=http://localhost:5000
```

---

## Endpoints

### Events

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/events` | Créer un événement (+ upload images) |
| GET | `/api/events` | Lister (pagination, search, filter, sort) |
| GET | `/api/events/:id` | Détail d'un événement |
| PUT | `/api/events/:id` | Modifier un événement |
| DELETE | `/api/events/:id` | Supprimer un événement |
| GET | `/api/events/:id/participants` | Participants d'un événement |

### Users

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/users` | Créer un utilisateur |
| GET | `/api/users` | Lister les utilisateurs |
| GET | `/api/users/:id` | Détail utilisateur |
| PUT | `/api/users/:id` | Modifier un utilisateur |
| DELETE | `/api/users/:id` | Supprimer un utilisateur |
| GET | `/api/users/:userId/reservations` | Réservations d'un utilisateur |

### Reservations

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/reservations` | Créer une réservation |
| GET | `/api/reservations` | Lister toutes les réservations |
| GET | `/api/reservations/:id` | Détail d'une réservation |
| PUT | `/api/reservations/:id/cancel` | Annuler une réservation |

---

## Query Parameters — GET /api/events

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page (défaut: 1) |
| `limit` | number | Résultats/page max 100 (défaut: 10) |
| `search` | string | Recherche plein texte titre |
| `category` | string | conference, workshop, meeting, sport, other |
| `type` | string | free ou paid |
| `sortBy` | string | startDate, endDate, createdAt, title, price |
| `order` | string | asc (défaut) ou desc |
| `startFrom` | date | Filtre date début (ISO 8601) |
| `startTo` | date | Filtre date fin (ISO 8601) |

---

## Schémas MongoDB

### Event
```json
{
  "title": "string (required, min 3)",
  "description": "string",
  "location": {
    "address": "string",
    "latitude": "number [-90, 90]",
    "longitude": "number [-180, 180]"
  },
  "startDate": "Date (required)",
  "endDate": "Date (required)",
  "category": "conference|workshop|meeting|sport|other",
  "capacity": "number",
  "type": "free|paid",
  "price": "number (0 si free, >0 si paid)",
  "images": [{ "url": "string", "filename": "string", "isUploaded": "boolean" }],
  "participants": ["ObjectId → User"]
}
```

### User
```json
{
  "firstName": "string (required, min 2)",
  "lastName": "string (required, min 2)",
  "email": "string (required, unique)",
  "phone": "string",
  "events": ["ObjectId → Event"]
}
```

### Reservation
```json
{
  "user": "ObjectId → User (required)",
  "event": "ObjectId → Event (required)",
  "numberOfTickets": "number [1-20] (required)",
  "totalPrice": "number (auto-calculé)",
  "reservationDate": "Date",
  "status": "pending|confirmed|cancelled",
  "cancelledAt": "Date",
  "cancellationReason": "string"
}
```
