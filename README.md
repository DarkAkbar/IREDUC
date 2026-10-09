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
npm install
npx prisma generate
npm run dev
```

L'API écoute sur `http://localhost:3000` (ou le `PORT` défini).  
Santé : `GET /health` → `{ "status": "ok" }`.

Scripts utiles :

```bash
npm run build   # compile TypeScript vers dist/
npm start       # lance le build de production
```

## Lancer l'application mobile

```bash
cd mobile
npm install
npx expo start
```

## Admin

Le back-office (`admin/`) sera mis en place ultérieurement. Voir `admin/README.md`.
