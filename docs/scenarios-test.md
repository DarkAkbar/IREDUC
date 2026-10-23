# Scénarios de test IREDUC (démonstration)

Prérequis : API démarrée (`cd api && npm run dev`), base seedée
(`npx prisma db seed` ou `npm run seed:demo`), mobile/admin selon le profil.

Comptes de référence :

| Profil | E-mail | Mot de passe |
|--------|--------|--------------|
| Client | `jean.mukendi@example.com` | `Password123!` |
| Prestataire | `claire.mbuyi@example.com` | `Provider123!` |
| Admin | `admin@ireduc.cd` | `Admin123!` |
| Super admin | `superadmin@ireduc.cd` | `SuperAdmin123!` |

---

## 1. Visiteur et client

### 1.1 Parcourir l’accueil sans compte

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir l’app mobile (ou `GET /api/v1/home`) | Sections accueil (à la une, catégories, services) sans erreur |
| 2 | Lister des biens location à Gombe (`GET /api/v1/properties?offerType=RENT&communeId=…`) | Liste paginée de biens `APPROVED` |
| 3 | Ouvrir la fiche d’un bien (`GET /api/v1/properties/:id`) | Détail avec médias, prix, contact masqué si non connecté selon règles métier |
| 4 | Tenter de créer une demande sans jeton | `401` Unauthorized |

### 1.2 Inscription / connexion client

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | `POST /api/v1/auth/login` avec Jean | `200` + `accessToken`, `refreshToken`, `user` |
| 2 | Login avec mauvais mot de passe | `401` message français |
| 3 | Ajouter un bien en favori | `201` / favori listé |
| 4 | Créer une demande de visite (`email` obligatoire) | `201` + numéro, statut `PENDING` |
| 5 | Lister « Mes demandes » (`GET /requests/mine`) | La demande apparaît |
| 6 | Rafraîchir le jeton (`POST /auth/refresh`) | Nouveaux jetons, ancien refresh invalidé |

### 1.3 Messagerie et profil

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir / créer une conversation liée à la demande | Conversation accessible |
| 2 | Envoyer un message | Message visible dans l’historique |
| 3 | Modifier le profil (nom / téléphone) | Données mises à jour |
| 4 | Déconnexion | Refresh révoqué ; accès API protégé refusé |

---

## 2. Bailleur ou prestataire

### 2.1 Connexion partenaire

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Login `claire.mbuyi@example.com` | `200`, profil partenaire présent |
| 2 | `GET /api/v1/providers/me` (ou équivalent) | Statut `APPROVED`, documents |

### 2.2 Publication et suivi

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Créer un brouillon d’annonce | `201`, statut `DRAFT` |
| 2 | Soumettre pour validation | Statut `PENDING` |
| 3 | Lister « Mes annonces » | Brouillon / en attente visibles |
| 4 | Consulter demandes reçues | Liste des demandes clients sur ses biens/services |
| 5 | Répondre / changer statut d’une demande (acceptée) | Statut mis à jour + notification côté client |

### 2.3 Service prestataire

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Login prestataire service (`grace.nsimba@example.com` / `Provider123!`) | OK |
| 2 | Lister ses services | Au moins un service approuvé |
| 3 | Consulter avis sur le service | Notes et commentaires présents (seed démo) |

---

## 3. Administrateur

### 3.1 Accès et tableau de bord

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Login `admin@ireduc.cd` | Rôle `ADMIN` |
| 2 | `GET /api/v1/admin/stats` | Compteurs utilisateurs, partenaires, séries 30 j |
| 3 | Login compte USER → `/admin/stats` | `403` |

### 3.2 Modération

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Lister partenaires `PENDING` | Tableau paginé |
| 2 | Approuver ou rejeter (motif si rejet) | Statut mis à jour + `AdminAction` |
| 3 | Lister annonces `PENDING`, approuver | Statut `APPROVED`, prochain pending éventuel |
| 4 | Mettre une annonce à la une | `isFeatured: true` |

### 3.3 Super administrateur

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Login `superadmin@ireduc.cd` | Rôle `SUPER_ADMIN` |
| 2 | `GET /api/v1/admin/audit-log` | Journal paginé |
| 3 | Créer une catégorie | `201` |
| 4 | Admin simple → audit-log | `403` |

---

## Critères de réussite globaux

- Tous les messages d’erreur API en français
- Aucun écran blanc côté mobile en cas d’échec réseau (état d’erreur + Réessayer)
- Boutons d’envoi désactivés pendant le chargement
- Aucun secret (mot de passe, jeton) dans les logs serveur
