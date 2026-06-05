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
# 1. Cloner le dépôt
git clone <repo-url>
cd event-management-backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs
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

# Production
npm start
```

Sortie attendue :
```
✅ MongoDB Connected: localhost
📦 Database: event_management

========================================
  🎫  Event Management API
========================================
  🚀 Server     : http://localhost:5000
  📚 API Docs   : http://localhost:5000/api-docs
  ❤️  Health     : http://localhost:5000/health
  🌍 Environment: development
========================================
```

---

## 📡 API Reference

### 🔑 AUTH

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Inscription |
| POST | `/api/auth/login` | Public | Connexion → JWT |
| GET | `/api/auth/me` | Privé | Profil courant |

**Register — Body :**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password1",
  "phone": "+21698765432",
  "role": "PARTICIPANT"
}
```

**Login — Body :**
```json
{
  "email": "john@example.com",
  "password": "Password1"
}
```

**Réponse Auth :**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "_id": "...", "fullName": "John Doe", "role": "PARTICIPANT" }
  }
}
```

---

### 👤 USERS

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/users` | ADMIN | Liste paginée + recherche |
| POST | `/api/users` | ADMIN | Créer un utilisateur |
| GET | `/api/users/:id` | ADMIN / soi-même | Détail utilisateur |
| PUT | `/api/users/:id` | ADMIN / soi-même | Modifier utilisateur |
| DELETE | `/api/users/:id` | ADMIN | Soft delete |
| GET | `/api/users/:userId/events` | ADMIN / soi-même | Événements d'un user |
| PUT | `/api/users/:id/profile-image` | ADMIN / soi-même | Upload photo |

**Query params GET /api/users :**
```
?page=1&limit=10&search=john&role=ORGANIZER&sortBy=createdAt&order=desc
```

---

### 🎭 EVENTS

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/events` | Privé | Liste paginée + filtres |
| POST | `/api/events` | ADMIN, ORGANIZER | Créer un événement |
| GET | `/api/events/:id` | Privé | Détail événement |
| PUT | `/api/events/:id` | ADMIN / organisateur | Modifier |
| DELETE | `/api/events/:id` | ADMIN / organisateur | Soft delete |

**Query params GET /api/events :**
```
?page=1&limit=10&search=tech&location=Tunis&from=2024-01-01&to=2024-12-31&sortBy=date&order=asc
```

---

### 🔗 RELATIONS (Many-to-Many)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/events/:eventId/register/:userId` | Privé | Inscrire un user |
| DELETE | `/api/events/:eventId/unregister/:userId` | Privé | Désinscrire un user |
| GET | `/api/events/:eventId/participants` | ADMIN / organisateur | Liste participants |
| GET | `/api/users/:userId/events` | ADMIN / soi-même | Événements d'un user |

---

## 🎭 Rôles & Permissions

| Action | ADMIN | ORGANIZER | PARTICIPANT |
|---|:---:|:---:|:---:|
| Voir tous les users | ✅ | ❌ | ❌ |
| Modifier n'importe quel user | ✅ | ❌ | ❌ |
| Supprimer un user | ✅ | ❌ | ❌ |
| Créer un événement | ✅ | ✅ | ❌ |
| Modifier son événement | ✅ | ✅ (sien) | ❌ |
| Voir les participants | ✅ | ✅ (sien) | ❌ |
| S'inscrire à un événement | ✅ | ✅ | ✅ |
| Voir son profil | ✅ | ✅ | ✅ |

---

## 🔗 Relation Many-to-Many

```
User.events[]  ←──────────────────→  Event.participants[]
     ↑                                        ↑
     │         $addToSet (atomic)              │
     └────────────────────────────────────────┘
```

Lors d'une inscription (`POST /api/events/:eventId/register/:userId`) :
```js
// Mise à jour atomique des deux côtés
await Promise.all([
  Event.findByIdAndUpdate(eventId, { $addToSet: { participants: userId } }),
  User.findByIdAndUpdate(userId,   { $addToSet: { events: eventId } }),
]);
```

---

## ✨ Fonctionnalités bonus

| Feature | Implémentation |
|---|---|
| **Pagination** | `page`, `limit`, `skip` + métadonnées `buildPagination()` |
| **Recherche** | `$regex` sur `fullName`, `email`, `title`, `location` |
| **Upload photo** | Multer diskStorage, JPEG/PNG/WebP, max 5 MB |
| **Swagger Docs** | OpenAPI 3.0 sur `/api-docs` + JSON sur `/api-docs.json` |
| **Soft Delete** | `isActive: false` + `deletedAt` sur User et Event |
| **Logs** | Morgan `dev` (développement) / `combined` (production) |
| **Rate Limiting** | 200 req/15min global, 20 req/15min sur `/api/auth` |
| **Sécurité** | Helmet, CORS configuré, hash bcrypt (12 rounds) |
| **Graceful Shutdown** | SIGTERM/SIGINT → fermeture propre HTTP + MongoDB |
| **Virtuals Mongoose** | `participantCount`, `availableSpots`, `isFull`, `isPast` |

---

## 🧪 Test rapide avec curl

```bash
# 1. S'inscrire
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Admin User","email":"admin@test.com","password":"Admin123"}'

# 2. Se connecter
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123"}' | node -e "
    let d=''; process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>console.log(JSON.parse(d).data.token));
  ")

# 3. Créer un événement
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tech Day","location":"Tunis","date":"2025-09-01T09:00:00Z","capacity":100}'
```
