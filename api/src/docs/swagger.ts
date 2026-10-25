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
          required: ["fullName", "phone", "password"],
          properties: {
            fullName: { type: "string", example: "Jean Mukendi" },
            phone: {
              type: "string",
              example: "+243812345678",
              description: "Numéro E.164 (formats locaux CD acceptés)",
            },
            password: { type: "string", minLength: 8, example: "Password123!" },
            email: {
              type: "string",
              format: "email",
              description: "Facultatif",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["identifier", "password"],
          properties: {
            identifier: {
              type: "string",
              example: "+243810000002",
              description: "Numéro de téléphone ou e-mail",
            },
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
            "201": { description: "Compte créé et connecté (jetons renvoyés)" },
            "409": { description: "Numéro ou e-mail déjà utilisé" },
          },
        },
      },
      "/api/v1/auth/verify-email": {
        post: {
          tags: ["Auth"],
          summary: "Vérifier l'e-mail (optionnel, si activé plus tard)",
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
      "/api/v1/config": {
        get: {
          tags: ["Config"],
          summary:
            "Configuration publique (alimentée par les paramètres Setting, fallback env)",
          responses: {
            "200": {
              description: "Configuration",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      platformName: { type: "string" },
                      slogan: { type: "string" },
                      defaultCurrency: { type: "string", example: "USD" },
                      launchCity: { type: "string" },
                      contactEmail: { type: "string" },
                      supportWhatsapp: { type: "string", example: "+243810000000" },
                      minAppVersion: { type: "string", example: "1.0.0" },
                      maintenanceMode: { type: "boolean" },
                      maintenanceMessage: { type: "string" },
                      legal: {
                        type: "object",
                        properties: {
                          termsUrl: { type: "string" },
                          privacyUrl: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/admin/settings": {
        get: {
          tags: ["Admin"],
          summary: "Lister tous les paramètres (ADMIN+)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste clé/valeur" } },
        },
      },
      "/api/v1/admin/settings/{key}": {
        get: {
          tags: ["Admin"],
          summary: "Lire un paramètre",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "key",
              in: "path",
              required: true,
              schema: {
                type: "string",
                enum: [
                  "general",
                  "mobile",
                  "validation",
                  "security",
                  "home",
                  "notifications",
                ],
              },
            },
          ],
          responses: { "200": { description: "Paramètre" } },
        },
        patch: {
          tags: ["Admin"],
          summary: "Modifier un paramètre (SUPER_ADMIN, journalisé)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "key",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["value"],
                  properties: {
                    value: { type: "object" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Mis à jour" },
            "403": { description: "Réservé SUPER_ADMIN" },
          },
        },
      },
      "/api/v1/admin/settings/{key}/history": {
        get: {
          tags: ["Admin"],
          summary: "Historique des modifications d'un paramètre (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Journal AdminAction" } },
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
        delete: {
          tags: ["Users"],
          summary: "Supprimer / anonymiser mon compte (mot de passe requis)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["password"],
                  properties: { password: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Compte anonymisé" },
            "403": { description: "SUPER_ADMIN non supprimable" },
          },
        },
      },
      "/api/v1/users/me/summary": {
        get: {
          tags: ["Users"],
          summary: "Résumé profil (compteurs demandes, favoris, messages, partenaire)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Résumé" } },
        },
      },
      "/api/v1/users/me/sessions": {
        get: {
          tags: ["Users"],
          summary: "Liste des sessions actives (header X-Refresh-Token pour marquer la courante)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "X-Refresh-Token",
              in: "header",
              schema: { type: "string" },
              description: "Refresh token de la session courante",
            },
          ],
          responses: { "200": { description: "Sessions" } },
        },
      },
      "/api/v1/users/me/sessions/others": {
        delete: {
          tags: ["Users"],
          summary: "Déconnecter tous les autres appareils",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "X-Refresh-Token",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { "200": { description: "Autres sessions révoquées" } },
        },
      },
      "/api/v1/users/me/sessions/{id}": {
        delete: {
          tags: ["Users"],
          summary: "Déconnecter un appareil",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            {
              name: "X-Refresh-Token",
              in: "header",
              schema: { type: "string" },
            },
          ],
          responses: { "200": { description: "Session révoquée" } },
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
      "/api/v1/users/me/avatar": {
        post: {
          tags: ["Users"],
          summary: "Uploader un avatar (multipart)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Profil mis à jour" } },
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
      "/api/v1/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Statistiques du tableau de bord",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Indicateurs et séries" } },
        },
      },
      "/api/v1/admin/properties": {
        get: {
          tags: ["Admin"],
          summary: "Liste des biens à modérer (filtre statut, recherche)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
      },
      "/api/v1/admin/properties/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Détail admin d'un bien (tous statuts)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Détail" } },
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
      "/api/v1/admin/properties/{id}/feature": {
        patch: {
          tags: ["Admin"],
          summary: "Mettre un bien à la une",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mis à jour" } },
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
      "/api/v1/admin/services/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Détail admin d'un service",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Détail" } },
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
      "/api/v1/admin/services/{id}/feature": {
        patch: {
          tags: ["Admin"],
          summary: "Mettre un service à la une",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mis à jour" } },
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
      "/api/v1/admin/providers/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Détail partenaire (documents, historique)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Détail" } },
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
      "/api/v1/admin/providers/{id}/request-complement": {
        patch: {
          tags: ["Admin"],
          summary: "Demander un complément de dossier",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Notification envoyée" } },
        },
      },
      "/api/v1/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "Liste des utilisateurs",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste paginée" } },
        },
      },
      "/api/v1/admin/users/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Détail utilisateur",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Détail" } },
        },
      },
      "/api/v1/admin/users/{id}/status": {
        patch: {
          tags: ["Admin"],
          summary: "Suspendre ou réactiver un utilisateur",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Statut mis à jour" } },
        },
      },
      "/api/v1/admin/admins": {
        get: {
          tags: ["Admin"],
          summary: "Liste des administrateurs (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Créer un compte admin (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Admin créé" } },
        },
      },
      "/api/v1/admin/admins/{id}/role": {
        patch: {
          tags: ["Admin"],
          summary: "Changer le rôle ADMIN ↔ USER (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Rôle mis à jour" } },
        },
      },
      "/api/v1/admin/audit-log": {
        get: {
          tags: ["Admin"],
          summary: "Journal d'audit (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste paginée" } },
        },
      },
      "/api/v1/admin/communes": {
        get: {
          tags: ["Admin"],
          summary: "Liste des communes (admin)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Créer une commune",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Créée" } },
        },
      },
      "/api/v1/admin/communes/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Modifier une commune",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mise à jour" } },
        },
      },
      "/api/v1/admin/communes/{id}/neighborhoods": {
        get: {
          tags: ["Admin"],
          summary: "Quartiers d'une commune",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Créer un quartier",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Créé" } },
        },
      },
      "/api/v1/admin/neighborhoods/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Modifier un quartier",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mise à jour" } },
        },
      },
      "/api/v1/admin/rejection-reasons": {
        get: {
          tags: ["Admin"],
          summary: "Motifs de rejet",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Créer un motif de rejet",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Créé" } },
        },
      },
      "/api/v1/admin/rejection-reasons/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Modifier un motif de rejet",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mise à jour" } },
        },
      },
      "/api/v1/admin/categories": {
        get: {
          tags: ["Admin"],
          summary: "Liste des catégories (SUPER_ADMIN, parentId, sous-catégories)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Liste" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Créer une catégorie (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "201": { description: "Créée" } },
        },
      },
      "/api/v1/admin/categories/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Modifier une catégorie (SUPER_ADMIN)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Mise à jour" } },
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
