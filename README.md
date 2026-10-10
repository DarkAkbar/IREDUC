# IREDUC

Plateforme immobilière et services de l'habitat — Kinshasa.

## Structure

| Dossier   | Description                                      |
|-----------|--------------------------------------------------|
| `api/`    | API Node.js + Express + TypeScript + Prisma      |
| `mobile/` | Application mobile Expo (React Native)           |
| `admin/`  | Back-office (à venir)                            |

## Prérequis

- Node.js 20+
- PostgreSQL
- npm

## Lancer l'API

```bash
cd api
cp .env.example .env
# Renseigner DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT dans .env
```

Créer la base PostgreSQL (une fois), avec le superutilisateur `postgres` :

```bash
psql -U postgres -f prisma/setup-db.sql
```

Puis :

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

L'API écoute sur `http://localhost:3000` (ou le `PORT` défini).  
Santé : `GET /health` → `{ "status": "ok" }`.

### Variables e-mail (API)

Dans `api/.env` : `MAIL_DRIVER` (`console` | `resend` | `smtp`), `MAIL_FROM`,
et selon le driver `RESEND_API_KEY` ou `SMTP_*`. Voir `api/.env.example`.

Documentation interactive : `http://localhost:3000/docs`

### Comptes de test (seed)

| Rôle         | Email                     | Mot de passe       |
|--------------|---------------------------|--------------------|
| Super admin  | `superadmin@ireduc.cd`    | `SuperAdmin123!`   |
| Admin        | `admin@ireduc.cd`         | `Admin123!`        |
| Utilisateur  | `jean.mukendi@example.com` | `Password123!`    |
| Prestataire  | `claire.mbuyi@example.com` | `Provider123!`    |

Les autres utilisateurs de test utilisent `Password123!`, les autres prestataires `Provider123!`.

### Prisma Studio

```bash
cd api
npx prisma studio
```

Scripts utiles :

```bash
npm run build          # compile TypeScript vers dist/
npm start              # lance le build de production
npm run prisma:seed    # rejoue le seed
npm run prisma:studio  # ouvre Prisma Studio
```

## Lancer l'application mobile

```bash
cd mobile
npm install
npx expo start
```

## Admin

Le back-office (`admin/`) sera mis en place ultérieurement. Voir `admin/README.md`.
