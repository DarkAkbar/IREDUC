# Guide testeur — prototype IREDUC

Ce guide explique comment installer l’APK de test Android, se connecter avec les
comptes de démonstration, quoi vérifier, et comment signaler un problème.

## 1. Installer l’APK (Android)

1. Obtenir le fichier `IREDUC-preview.apk` (build EAS profil `preview`).
2. Sur le téléphone : autoriser l’installation depuis des sources inconnues
   (Paramètres → Sécurité / Applications).
3. Ouvrir l’APK et installer **IREDUC** (`cd.ireduc.app`).
4. Au premier lancement, vérifier que l’écran de démarrage bleu marine IREDUC s’affiche.

### Pointer vers l’API de démo

L’APK de preview doit être construit avec `EXPO_PUBLIC_API_URL` pointant vers
l’API accessible depuis le téléphone (IP locale ou serveur de démo), par exemple :

```text
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000/api/v1
```

Sans API joignable, un bandeau rouge « Connexion indisponible » apparaît.

### Commandes de build (équipe technique)

```bash
cd mobile
npm install
npx eas-cli login
npx eas build --platform android --profile preview
```

Voir aussi le README racine.

## 2. Comptes de démonstration

Après `npm run seed:demo` côté API :

| Profil | E-mail | Mot de passe |
|--------|--------|--------------|
| Client | `jean.mukendi@example.com` | `Password123!` |
| Client | `marie.kabongo@example.com` | `Password123!` |
| Partenaire agence | `claire.mbuyi@example.com` | `Provider123!` |
| Prestataire électricité | `grace.nsimba@example.com` | `Provider123!` |
| Admin | `admin@ireduc.cd` | `Admin123!` |
| Super admin | `superadmin@ireduc.cd` | `SuperAdmin123!` |

Admin web : `http://<hôte>:5174` (même comptes admin).

## 3. Que tester ?

Suivre `/docs/scenarios-test.md`. En résumé :

- **Visiteur / client** : accueil, recherche biens/services, favoris, réservation,
  mes demandes, messagerie, profil.
- **Partenaire** : devenir / profil partenaire, publier une annonce, mes annonces,
  demandes reçues.
- **Admin** : connexion refusée pour un client, tableau de bord, modération,
  mise à la une ; super admin : catégories, audit, administrateurs.

Points UX à vérifier :

- Pas d’écran blanc en cas d’erreur (message + bouton Réessayer).
- Boutons désactivés pendant l’envoi.
- Textes en français.
- Clavier Android qui ne masque pas les champs (connexion, messagerie).
- Listes fluides (biens, demandes, messages).

## 4. Signaler un problème

Envoyer un message (e-mail / ticket / chat équipe) avec :

1. **Appareil** : modèle Android + version système
2. **Compte utilisé** (e-mail uniquement, jamais le mot de passe)
3. **Étapes** pour reproduire
4. **Résultat obtenu** vs **résultat attendu**
5. Capture d’écran ou enregistrement si possible
6. Heure approximative (pour corréler avec les logs API)

Ne jamais coller de jetons JWT, mots de passe ou captures d’écran contenant des secrets.
