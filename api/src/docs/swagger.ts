import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API IREDUC",
      version: "1.0.0",
      description:
        "API IREDUC — authentification, biens, services et accueil (Kinshasa).",
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
      "/api/v1/categories": {
        get: {
          tags: ["Catalog"],
          summary: "Liste des catégories",
          parameters: [
            {
              name: "kind",
              in: "query",
              schema: { type: "string", enum: ["REAL_ESTATE", "SERVICE"] },
            },
          ],
          responses: { "200": { description: "Catégories" } },
        },
      },
      "/api/v1/communes": {
        get: {
          tags: ["Catalog"],
          summary: "Liste des communes de Kinshasa",
          responses: { "200": { description: "Communes" } },
        },
      },
      "/api/v1/communes/{id}/neighborhoods": {
        get: {
          tags: ["Catalog"],
          summary: "Quartiers d'une commune",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: { "200": { description: "Quartiers" } },
        },
      },
      "/api/v1/properties": {
        get: {
          tags: ["Properties"],
          summary: "Liste publique des biens APPROVED (filtres + pagination)",
          parameters: [
            { name: "offerType", in: "query", schema: { type: "string", enum: ["RENT", "SALE"] } },
            { name: "kind", in: "query", schema: { type: "string" } },
            { name: "communeId", in: "query", schema: { type: "string", format: "uuid" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            { name: "bedrooms", in: "query", schema: { type: "integer" } },
            { name: "bathrooms", in: "query", schema: { type: "integer" } },
            { name: "minArea", in: "query", schema: { type: "number" } },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["recent", "price_asc", "price_desc"] } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: { "200": { description: "Liste paginée" } },
        },
        post: {
          tags: ["Properties"],
          summary: "Créer un bien (DRAFT) — offreur APPROVED",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Bien créé" }, "403": { description: "Offreur non approuvé" } },
        },
      },
      "/api/v1/properties/mine": {
        get: {
          tags: ["Properties"],
          summary: "Mes biens",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste de mes biens" } },
        },
      },
      "/api/v1/properties/{id}": {
        get: {
          tags: ["Properties"],
          summary: "Détail d'un bien APPROVED (incrémente viewsCount)",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: { "200": { description: "Détail" } },
        },
        patch: {
          tags: ["Properties"],
          summary: "Modifier un bien DRAFT/REJECTED",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Bien mis à jour" } },
        },
        delete: {
          tags: ["Properties"],
          summary: "Archiver un bien",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Bien archivé" } },
        },
      },
      "/api/v1/properties/{id}/submit": {
        post: {
          tags: ["Properties"],
          summary: "Soumettre un bien (DRAFT/REJECTED → PENDING)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Bien soumis" } },
        },
      },
      "/api/v1/properties/{id}/media": {
        post: {
          tags: ["Properties"],
          summary: "Ajouter un média (8 photos max + 1 vidéo)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Média ajouté" } },
        },
      },
      "/api/v1/services": {
        get: {
          tags: ["Services"],
          summary: "Liste publique des services APPROVED",
          responses: { "200": { description: "Liste paginée" } },
        },
        post: {
          tags: ["Services"],
          summary: "Créer un service (DRAFT)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Service créé" } },
        },
      },
      "/api/v1/services/mine": {
        get: {
          tags: ["Services"],
          summary: "Mes services",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/services/{id}": {
        get: {
          tags: ["Services"],
          summary: "Détail d'un service APPROVED",
          responses: { "200": { description: "Détail" } },
        },
        patch: {
          tags: ["Services"],
          summary: "Modifier un service DRAFT/REJECTED",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mis à jour" } },
        },
      },
      "/api/v1/services/{id}/submit": {
        post: {
          tags: ["Services"],
          summary: "Soumettre un service",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Soumis" } },
        },
      },
      "/api/v1/home": {
        get: {
          tags: ["Home"],
          summary: "Accueil dynamique (sections aléatoires, featured prioritaires)",
          responses: { "200": { description: "Feed d'accueil" } },
        },
      },
      "/api/v1/admin/properties": {
        get: {
          tags: ["Admin"],
          summary: "Liste des biens à modérer",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/admin/properties/{id}/review": {
        patch: {
          tags: ["Admin"],
          summary: "Approuver ou rejeter un bien",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Décision enregistrée" } },
        },
      },
      "/api/v1/admin/services": {
        get: {
          tags: ["Admin"],
          summary: "Liste des services à modérer",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/admin/services/{id}/review": {
        patch: {
          tags: ["Admin"],
          summary: "Approuver ou rejeter un service",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Décision enregistrée" } },
        },
      },
      "/api/v1/admin/providers": {
        get: {
          tags: ["Admin"],
          summary: "Liste des partenaires à modérer",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/admin/providers/{id}/review": {
        patch: {
          tags: ["Admin"],
          summary: "Approuver ou rejeter un partenaire",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Décision enregistrée" } },
        },
      },
      "/api/v1/requests": {
        post: {
          tags: ["Requests"],
          summary: "Créer une demande (bien ou service)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Demande créée" } },
        },
      },
      "/api/v1/requests/mine": {
        get: {
          tags: ["Requests"],
          summary: "Mes demandes + compteurs par statut",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste et compteurs" } },
        },
      },
      "/api/v1/requests/received": {
        get: {
          tags: ["Requests"],
          summary: "Demandes reçues (offreur)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/requests/{id}": {
        get: {
          tags: ["Requests"],
          summary: "Détail d'une demande",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Détail" }, "403": { description: "Accès interdit" } },
        },
      },
      "/api/v1/requests/{id}/review": {
        patch: {
          tags: ["Requests"],
          summary: "Approuver ou rejeter (offreur)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Décision" }, "409": { description: "Transition interdite" } },
        },
      },
      "/api/v1/requests/{id}/cancel": {
        patch: {
          tags: ["Requests"],
          summary: "Annuler (demandeur, PENDING)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Annulée" } },
        },
      },
      "/api/v1/requests/{id}/complete": {
        patch: {
          tags: ["Requests"],
          summary: "Clôturer (offreur, APPROVED)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Terminée" } },
        },
      },
      "/api/v1/requests/{id}/pay": {
        post: {
          tags: ["Requests"],
          summary: "Paiement simulé (APPROVED + UNPAID)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Payée" } },
        },
      },
      "/api/v1/requests/{id}/similar": {
        get: {
          tags: ["Requests"],
          summary: "Biens similaires (demande REJECTED)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Suggestions" } },
        },
      },
      "/api/v1/conversations": {
        get: {
          tags: ["Conversations"],
          summary: "Liste des conversations",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Conversations"],
          summary: "Créer ou réutiliser une conversation",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Conversation" } },
        },
      },
      "/api/v1/conversations/{id}/messages": {
        get: {
          tags: ["Conversations"],
          summary: "Messages (pagination)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Messages" } },
        },
        post: {
          tags: ["Conversations"],
          summary: "Envoyer un message",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Message créé" } },
        },
      },
      "/api/v1/conversations/{id}/read": {
        patch: {
          tags: ["Conversations"],
          summary: "Marquer les messages comme lus",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/conversations/{id}/whatsapp-link": {
        get: {
          tags: ["Conversations"],
          summary: "Lien wa.me vers l'interlocuteur",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "URL WhatsApp" } },
        },
      },
      "/api/v1/favorites": {
        get: {
          tags: ["Favorites"],
          summary: "Liste des favoris",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Favoris" } },
        },
        post: {
          tags: ["Favorites"],
          summary: "Ajouter un favori",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Ajouté" } },
        },
      },
      "/api/v1/favorites/{id}": {
        delete: {
          tags: ["Favorites"],
          summary: "Supprimer un favori",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Supprimé" } },
        },
      },
      "/api/v1/alerts": {
        get: {
          tags: ["Alerts"],
          summary: "Liste des alertes",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Alertes" } },
        },
        post: {
          tags: ["Alerts"],
          summary: "Créer une alerte",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Créée" } },
        },
      },
      "/api/v1/alerts/{id}": {
        patch: {
          tags: ["Alerts"],
          summary: "Modifier une alerte",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mise à jour" } },
        },
        delete: {
          tags: ["Alerts"],
          summary: "Supprimer une alerte",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Supprimée" } },
        },
      },
      "/api/v1/reviews": {
        post: {
          tags: ["Reviews"],
          summary: "Créer un avis (demande COMPLETED)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Avis créé" } },
        },
      },
      "/api/v1/services/{id}/reviews": {
        get: {
          tags: ["Reviews"],
          summary: "Avis d'un service + répartition des notes",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Avis paginés" } },
        },
      },
      "/api/v1/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "Liste + compteur non-lus",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Notifications" } },
        },
      },
      "/api/v1/notifications/read-all": {
        patch: {
          tags: ["Notifications"],
          summary: "Tout marquer comme lu",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/notifications/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Marquer une notification comme lue",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "OK" } },
        },
      },
    },
  },
  apis: [],
});
