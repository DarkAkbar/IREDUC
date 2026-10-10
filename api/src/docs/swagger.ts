import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API IREDUC",
      version: "1.0.0",
      description:
        "API d'authentification et de profils — plateforme immobilière et services de l'habitat (Kinshasa).",
    },
    servers: [{ url: "http://localhost:3000", description: "Développement local" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            code: { type: "string" },
            details: {},
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "Jean Mukendi" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, example: "Password123!" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@ireduc.cd" },
            password: { type: "string", example: "Admin123!" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Inscription",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Compte créé" },
            "409": { description: "E-mail déjà utilisé" },
          },
        },
      },
      "/api/v1/auth/verify-email": {
        post: {
          tags: ["Auth"],
          summary: "Vérifier l'e-mail",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "E-mail vérifié" } },
        },
      },
      "/api/v1/auth/resend-verification": {
        post: {
          tags: ["Auth"],
          summary: "Renvoyer l'e-mail de vérification",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: { "200": { description: "E-mail renvoyé si applicable" } },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Connexion",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Connexion réussie",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokens" },
                },
              },
            },
            "401": { description: "Identifiants invalides" },
            "403": { description: "Compte suspendu" },
          },
        },
      },
      "/api/v1/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rafraîchir les jetons (rotation)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "Nouveaux jetons" } },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Déconnexion (révocation du refresh token)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: { "200": { description: "Déconnecté" } },
        },
      },
      "/api/v1/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Demande de réinitialisation de mot de passe",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: { "200": { description: "E-mail envoyé si le compte existe" } },
        },
      },
      "/api/v1/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Réinitialiser le mot de passe",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Mot de passe mis à jour" } },
        },
      },
      "/api/v1/users/me": {
        get: {
          tags: ["Users"],
          summary: "Profil courant",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Profil" }, "401": { description: "Non authentifié" } },
        },
        patch: {
          tags: ["Users"],
          summary: "Mettre à jour le profil",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Profil mis à jour" } },
        },
      },
      "/api/v1/users/me/password": {
        patch: {
          tags: ["Users"],
          summary: "Changer le mot de passe",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mot de passe modifié" } },
        },
      },
      "/api/v1/providers": {
        post: {
          tags: ["Providers"],
          summary: "Devenir partenaire (profil PENDING)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Profil créé" } },
        },
      },
      "/api/v1/providers/me": {
        get: {
          tags: ["Providers"],
          summary: "Mon profil partenaire",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Profil partenaire" } },
        },
        patch: {
          tags: ["Providers"],
          summary: "Mettre à jour mon profil partenaire",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Profil mis à jour" } },
        },
      },
      "/api/v1/providers/me/documents": {
        post: {
          tags: ["Providers"],
          summary: "Uploader une pièce justificative (jpg/png/pdf, 5 Mo max)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Document enregistré" } },
        },
      },
      "/api/v1/admin/ping": {
        get: {
          tags: ["Admin"],
          summary: "Ping admin (ADMIN / SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "OK" },
            "403": { description: "Permissions insuffisantes" },
          },
        },
      },
    },
  },
  apis: [],
});
