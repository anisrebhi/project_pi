/**
 * @file config/swagger.js
 * @description Swagger/OpenAPI 3.0 configuration for API documentation
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management API",
      version: "1.0.0",
      description:
        "REST API for Event Management Platform — User & Event Management Module",
      contact: {
        name: "API Support",
        email: "support@eventmanagement.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token: Bearer <token>",
        },
      },
      schemas: {
        // ─── User Schemas ────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            fullName: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "ORGANIZER", "PARTICIPANT"],
              example: "PARTICIPANT",
            },
            phone: { type: "string", example: "+21698765432" },
            profileImage: {
              type: "string",
              example: "uploads/profiles/photo.jpg",
            },
            isActive: { type: "boolean", example: true },
            events: {
              type: "array",
              items: { type: "string" },
              example: ["64f1a2b3c4d5e6f7a8b9c0d2"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-20T14:45:00.000Z",
            },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", minLength: 6, example: "Password123!" },
            phone: { type: "string", example: "+21698765432" },
            role: {
              type: "string",
              enum: ["ADMIN", "ORGANIZER", "PARTICIPANT"],
              example: "PARTICIPANT",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "Password123!" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        // ─── Event Schemas ───────────────────────────────────────
        Event: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            title: { type: "string", example: "Tech Conference 2024" },
            description: {
              type: "string",
              example: "Annual technology conference",
            },
            location: { type: "string", example: "Tunis, Tunisia" },
            date: {
              type: "string",
              format: "date-time",
              example: "2024-06-15T09:00:00.000Z",
            },
            capacity: { type: "number", example: 200 },
            organizer: { $ref: "#/components/schemas/User" },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        EventInput: {
          type: "object",
          required: ["title", "location", "date", "capacity"],
          properties: {
            title: { type: "string", example: "Tech Conference 2024" },
            description: {
              type: "string",
              example: "Annual technology conference",
            },
            location: { type: "string", example: "Tunis, Tunisia" },
            date: {
              type: "string",
              format: "date-time",
              example: "2024-06-15T09:00:00.000Z",
            },
            capacity: { type: "number", example: 200 },
          },
        },
        // ─── Generic Response Schemas ────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "An error occurred" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                total: { type: "number", example: 50 },
                page: { type: "number", example: 1 },
                limit: { type: "number", example: 10 },
                pages: { type: "number", example: 5 },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management endpoints" },
      { name: "Events", description: "Event management endpoints" },
      {
        name: "Relations",
        description: "User-Event relationship management",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to route files with JSDoc annotations
};

module.exports = swaggerJsdoc(options);
