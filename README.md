# Event Management API — Events Module

A production-ready REST API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

---

## Project Structure

```
event-management-api/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   └── eventController.js       # CRUD business logic
├── middleware/
│   ├── errorMiddleware.js       # Global error handler
│   └── validationMiddleware.js  # express-validator chains
├── models/
│   └── Event.js                 # Mongoose schema & model
├── routes/
│   └── eventRoutes.js           # Express router
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js                    # Entry point
```

---

## Installation

```bash
# 1. Clone / enter project directory
cd event-management-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env .env.local    # or edit .env directly
```

### Required environment variables (`.env`)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/event_management
```

---

## Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Endpoints

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/health`         | Health check                             |
| POST   | `/api/events`     | Create a new event                       |
| GET    | `/api/events`     | Get all events (pagination/search/filter)|
| GET    | `/api/events/:id` | Get a single event                       |
| PUT    | `/api/events/:id` | Update an event                          |
| DELETE | `/api/events/:id` | Delete an event                          |

---

## Query Parameters — GET /api/events

| Parameter   | Type   | Default    | Description                                      |
|-------------|--------|------------|--------------------------------------------------|
| `page`      | number | 1          | Page number                                      |
| `limit`     | number | 10         | Results per page (max 100)                       |
| `search`    | string | —          | Full-text search on title                        |
| `category`  | string | —          | Filter: conference, workshop, meeting, sport, other |
| `sortBy`    | string | startDate  | Sort field: startDate, endDate, createdAt, title |
| `order`     | string | asc        | Sort direction: asc or desc                      |
| `startFrom` | date   | —          | Filter events starting on or after this date     |
| `startTo`   | date   | —          | Filter events starting on or before this date    |

---

## Event Schema

```json
{
  "title":       "string (required, min 3 chars)",
  "description": "string",
  "location":    "string",
  "startDate":   "ISO 8601 date (required)",
  "endDate":     "ISO 8601 date (required, must be after startDate)",
  "category":    "conference | workshop | meeting | sport | other",
  "capacity":    "number (positive integer)"
}
```

---

## Postman Examples

### 1. Create Event — POST /api/events

```json
{
  "title": "Node.js Advanced Workshop",
  "description": "Deep dive into async patterns, streams and performance tuning.",
  "location": "Tunis, Tunisia",
  "startDate": "2025-09-15T09:00:00.000Z",
  "endDate":   "2025-09-15T17:00:00.000Z",
  "category":  "workshop",
  "capacity":  50
}
```

**Response 201:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Event created successfully",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "title": "Node.js Advanced Workshop",
    ...
  }
}
```

---

### 2. Get All Events — GET /api/events

```
GET /api/events?page=1&limit=5&category=workshop&sortBy=startDate&order=asc
```

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Events fetched successfully",
  "data": [...],
  "pagination": {
    "total": 23,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Event by ID — GET /api/events/:id

```
GET /api/events/665f1a2b3c4d5e6f7a8b9c0d
```

---

### 4. Update Event — PUT /api/events/:id

```json
{
  "capacity": 75,
  "location": "Sfax, Tunisia"
}
```

---

### 5. Delete Event — DELETE /api/events/:id

```
DELETE /api/events/665f1a2b3c4d5e6f7a8b9c0d
```

**Response 200:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Event deleted successfully",
  "data": { "id": "665f1a2b3c4d5e6f7a8b9c0d" }
}
```

---

### 6. Search by Title — GET /api/events?search=

```
GET /api/events?search=workshop&page=1&limit=10
```

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title must be at least 3 characters" },
    { "field": "endDate", "message": "End date must be after start date" }
  ]
}
```

---

## Tech Stack

| Package            | Purpose                  |
|--------------------|--------------------------|
| express            | HTTP framework           |
| mongoose           | MongoDB ODM              |
| express-validator  | Input validation         |
| dotenv             | Environment variables    |
| cors               | Cross-Origin support     |
| nodemon (dev)      | Auto-reload in dev mode  |
