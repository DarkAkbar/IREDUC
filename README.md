# IREDUC

Plateforme immobilière et services de l'habitat — Kinshasa.

## Structure

| Dossier   | Description                                      |
|-----------|--------------------------------------------------|
| `api/`    | API Node.js + Express + TypeScript + Prisma      |
| `mobile/` | Application mobile Expo (React Native)           |
| `admin/`  | Back-office web (React + Vite)                   |

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

L'API écoute sur `0.0.0.0:3000` (accessible depuis le réseau local).  
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
cp .env.example .env
# Ajuster EXPO_PUBLIC_API_URL selon l'appareil (voir ci-dessous)
npm install
npx expo start
```

### URL de l'API en développement

L'API écoute sur `0.0.0.0` pour être joignable depuis un téléphone ou l'émulateur.

| Cible | `EXPO_PUBLIC_API_URL` |
|-------|------------------------|
| Émulateur Android | `http://10.0.2.2:3000/api/v1` |
| Simulateur iOS | `http://localhost:3000/api/v1` |
| Téléphone physique (même Wi-Fi) | `http://<IP_LOCALE_DU_PC>:3000/api/v1` |

Trouver l'IP locale du PC :

- **Windows (PowerShell)** : `ipconfig` → adresse IPv4 du Wi-Fi (ex. `192.168.1.42`)
- **macOS / Linux** : `ipconfig getifaddr en0` ou `hostname -I`

Exemple : `EXPO_PUBLIC_API_URL=http://192.168.1.42:3000/api/v1`

Redémarrer Expo après modification de `.env` (`npx expo start -c` si besoin).

## Lancer l'administration web

```bash
cd admin
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev
```

Interface : [http://localhost:5174](http://localhost:5174)  
Comptes : `admin@ireduc.cd` / `Admin123!` ou `superadmin@ireduc.cd` / `SuperAdmin123!`
