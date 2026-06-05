# 🎫 Event Management API — User Management Module

Backend REST API professionnel pour une plateforme de gestion d'événements.  
Construit avec **Node.js**, **Express.js**, **MongoDB/Mongoose** et **JWT**.

---

## 📋 Table des matières

- [Technologies](#-technologies)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Variables d'environnement](#-variables-denvironnement)
- [Lancement](#-lancement)
- [API Reference](#-api-reference)
- [Rôles & Permissions](#-rôles--permissions)
- [Relation Many-to-Many](#-relation-many-to-many)
- [Fonctionnalités bonus](#-fonctionnalités-bonus)

---

## 🛠 Technologies

| Technologie | Usage |
|---|---|
| Node.js | Runtime JavaScript |
| Express.js | Framework HTTP |
| MongoDB + Mongoose | Base de données NoSQL + ODM |
| JWT (jsonwebtoken) | Authentification stateless |
| bcryptjs | Hachage des mots de passe |
| dotenv | Variables d'environnement |
| express-validator | Validation des entrées |
| multer | Upload d'images |
| swagger-ui-express | Documentation interactive |
| helmet | Sécurité HTTP headers |
| morgan | Logs HTTP |
| express-rate-limit | Protection anti-bruteforce |
| cors | Cross-Origin Resource Sharing |

---

## 🏗 Architecture

```
src/
├── config/
│   ├── db.js               # Connexion MongoDB avec retry & graceful shutdown
│   └── swagger.js          # Configuration OpenAPI 3.0
│
├── models/
│   ├── User.js             # Schéma User (soft delete, méthodes, indexes)
│   └── Event.js            # Schéma Event (virtuals, soft delete, Many-to-Many)
│
├── controllers/
│   ├── authController.js   # register, login, getMe
│   ├── userController.js   # CRUD + upload image + getUserEvents
│   └── eventController.js  # CRUD + register/unregister + participants
│
├── routes/
│   ├── authRoutes.js       # POST /api/auth/register|login, GET /api/auth/me
│   ├── userRoutes.js       # GET|POST|PUT|DELETE /api/users
│   └── eventRoutes.js      # GET|POST|PUT|DELETE /api/events + relations
│
├── middlewares/
│   ├── authMiddleware.js   # JWT protect + optionalAuth
│   ├── roleMiddleware.js   # RBAC: authorize(), adminOnly, selfOrAdmin
│   ├── errorMiddleware.js  # AppError class + global error handler
│   └── validationMiddleware.js  # express-validator chains
│
├── utils/
│   ├── generateToken.js    # JWT sign/verify/extract
│   ├── apiResponse.js      # sendSuccess / sendError / buildPagination
│   └── multerConfig.js     # Multer diskStorage + fileFilter
│
├── uploads/profiles/       # Images de profil uploadées
├── app.js                  # Configuration Express (middlewares, routes)
└── server.js               # Entrée principale (DB + HTTP server)
```

---

## ⚙️ Installation

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

## 🔐 Variables d'environnement

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/event_management

JWT_SECRET=votre_secret_jwt_minimum_32_caracteres
JWT_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12

MAX_FILE_SIZE=5242880       # 5 MB en octets
UPLOAD_PATH=src/uploads/profiles
```

---

## 🚀 Lancement

```bash
# Développement (hot reload)
npm run dev

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
