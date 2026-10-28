# IREDUC

Plateforme immobilière et services de l'habitat — Kinshasa.

## Structure

| Dossier   | Description                                      |
|-----------|--------------------------------------------------|
| `api/`    | API Node.js + Express + TypeScript + Prisma      |
| `mobile/` | Application mobile Expo (React Native)           |
| `admin/`  | Back-office web (React + Vite)                   |
| `docs/`   | Scénarios de test et guide testeur               |

## Prérequis

- Node.js 20+
- PostgreSQL
- npm
- (optionnel) compte Expo / EAS pour l’APK Android

## Lancer l'API

```bash
cd api
cp .env.example .env
# Renseigner DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT
```

Créer la base (une fois) :

```bash
psql -U postgres -f prisma/setup-db.sql
```

Puis :

```bash
npm install
npx prisma migrate deploy
npx prisma db seed          # jeu de données de base
# ou, pour la démo enrichie :
npm run seed:demo           # 25 biens, 12 prestataires, avis, tous statuts de demandes
npm run dev
```

- API : `http://0.0.0.0:3000` — santé : `GET /health`
- Swagger : `http://localhost:3000/docs`

Variables d’environnement : voir `api/.env.example` (JWT, mail console/resend/smtp, `APP_URL`, `NODE_ENV`).

- Identifiant principal : **numéro de téléphone** (E.164, ex. `+243812345678`). L’e-mail est facultatif.
- `REQUIRE_ACCOUNT_VERIFICATION=true` : les actions sensibles exigent `phoneVerified`. Défaut `false`.
- En mode `MAIL_DRIVER=console`, un code e-mail éventuel s’affiche dans le terminal (`[VERIFY_EMAIL_CODE]`).

### Comptes de démonstration

| Rôle | Téléphone | E-mail | Mot de passe |
|------|-----------|--------|--------------|
| Super admin | `+243810000001` | `superadmin@ireduc.cd` | `SuperAdmin123!` |
| Admin | `+243810000002` | `admin@ireduc.cd` | `Admin123!` |
| Client | `+243810000011` | `jean.mukendi@example.com` | `Password123!` |
| Client | `+243810000012` | `marie.kabongo@example.com` | `Password123!` |
| Client | `+243810000013` | `patrick.ilunga@example.com` | `Password123!` |
| Partenaire agence | `+243820000021` | `claire.mbuyi@example.com` | `Provider123!` |
| Partenaire | `+243820000022` | `david.tshisekedi@example.com` | `Provider123!` |
| Prestataire | `+243820000023` | `grace.nsimba@example.com` | `Provider123!` |
| Prestataire | `+243820000024` | `olivier.kasongo@example.com` | `Provider123!` |

Connexion possible avec le **numéro** ou l’**e-mail**. Autres clients seed-demo : `+243810000014`… / `Password123!` — autres prestataires : `+243820000025`… / `Provider123!`.

```bash
npm run build && npm start   # production
npx prisma studio            # exploration BDD
npm test                     # Vitest
```

## Lancer l'application mobile

```bash
cd mobile
cp .env.example .env
# Ajuster EXPO_PUBLIC_API_URL
npm install
npx expo start
```

| Cible | `EXPO_PUBLIC_API_URL` |
|-------|------------------------|
| Émulateur Android | `http://10.0.2.2:3000/api/v1` |
| Simulateur iOS | `http://localhost:3000/api/v1` |
| Téléphone (même Wi-Fi) | `http://<IP_LOCALE>:3000/api/v1` |

### APK de test (EAS Build — profil `preview`)

Package Android : `cd.ireduc.app` — icône et splash IREDUC (bleu `#0B2A8A`).

```bash
cd mobile
npm install
npx eas-cli login
# Renseigner extra.eas.projectId dans app.json après `eas init`
npx eas build --platform android --profile preview
```

Le build produit un APK installable hors Play Store. Documentation testeur :
[`docs/guide-testeur.md`](docs/guide-testeur.md).

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

## Documentation de test

- Scénarios bout en bout : [`docs/scenarios-test.md`](docs/scenarios-test.md)
- Guide testeur (APK, comptes, signalement) : [`docs/guide-testeur.md`](docs/guide-testeur.md)

## Sécurité

- Ne jamais committer de fichiers `.env` (déjà dans `.gitignore`)
- Aucun secret réel dans `.env.example`
- Les logs API masquent mots de passe et jetons
