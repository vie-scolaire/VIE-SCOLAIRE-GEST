# Déploiement

Ce guide part du code source jusqu'à une application installable, en dehors
de tout usage local de développement (voir le `README.md` principal pour ça).

## 1. Déployer le backend (Railway)

1. Pousser le projet sur GitHub si ce n'est pas déjà fait.
2. Sur [railway.app](https://railway.app) : **New Project → Deploy from GitHub repo**.
3. Sélectionner le repo, puis dans **Settings** du service : **Root Directory** = `backend`.
4. **New → Database → PostgreSQL** dans le même projet Railway (fournit `DATABASE_URL` automatiquement si les services sont reliés).
5. Variables d'environnement du service backend (`Settings → Variables`) :
   - `DATABASE_URL` (auto-remplie si la base est reliée)
   - `JWT_SECRET` — générer une valeur aléatoire, ex. `openssl rand -hex 32`
   - `JWT_EXPIRES_IN` = `7d`
6. **Settings → Deploy → Start Command** :
   ```
   npx prisma migrate deploy && npm start
   ```
7. Déployer, puis lancer le seed une fois via l'onglet **Shell** du service Railway :
   ```
   npm run seed
   ```
8. Noter l'URL publique générée (`Settings → Networking → Generate Domain`), ex. `https://vie-scolaire-backend.up.railway.app`.

## 2. Brancher le mobile sur le backend déployé

Dans `app.json`, remplacer `expo.extra.apiUrl` par l'URL Railway obtenue :

```json
"extra": {
  "apiUrl": "https://votre-backend.up.railway.app"
}
```

En développement local (`npm start`), l'app continue d'utiliser l'IP locale
définie dans `src/api/client.js` (`API_URL_DEV`) — seuls les builds EAS
utilisent `apiUrl`.

## 3. Build mobile avec EAS

1. Compte Expo gratuit sur [expo.dev](https://expo.dev), puis :
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
   Cela remplit `expo.extra.eas.projectId` dans `app.json`.

2. Build de test (installable directement, sans passer par un store) :
   ```bash
   npm run build:preview:android
   ```
   EAS compile dans le cloud et fournit un lien `.apk` à télécharger et installer directement sur un téléphone Android.

   Pour iOS, un compte Apple Developer (99 $/an) est nécessaire :
   ```bash
   npm run build:preview:ios
   ```

3. Une fois testé, build final pour les stores :
   ```bash
   npm run build:production
   ```

4. Soumission aux stores :
   ```bash
   npm run submit:android
   npm run submit:ios
   ```

## Checklist avant mise en production réelle

- [ ] `JWT_SECRET` remplacé par une valeur aléatoire forte (jamais celle de `.env.example`)
- [ ] Stockage des justificatifs migré vers un stockage objet (S3, Cloudinary) — le stockage disque actuel (`backend/uploads/`) est perdu à chaque redéploiement Railway
- [ ] Compte de démo (`cpe@lycee-ouaga.bf` / `motdepasse123`) supprimé ou mot de passe changé
- [ ] `CORS` restreint à l'origine de l'app plutôt que ouvert à tous (actuellement `cors()` sans restriction dans `server.js`)
- [ ] Icônes et écran de démarrage personnalisés dans `app.json` (`icon`, `splash`) avant soumission aux stores
