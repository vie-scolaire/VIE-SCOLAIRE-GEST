# Backend — API vie scolaire

API REST Node.js/Express + PostgreSQL (via Prisma) + authentification JWT +
notifications push (Expo) + upload de fichiers.

## Installation

```bash
cd backend
npm install
cp .env.example .env
# éditer .env avec l'URL de votre base PostgreSQL
```

## Base de données

```bash
npx prisma migrate dev --name init
npm run seed
```

Le seed crée un établissement de démo avec deux comptes et un emploi du temps :
- **CPE** : `cpe@lycee-ouaga.bf` / `motdepasse123`
- **Parent** : `parent@example.com` / `motdepasse123`

## Lancer le serveur

```bash
npm run dev
```

L'API écoute par défaut sur `http://localhost:4000`. Les fichiers uploadés
sont servis statiquement depuis `/uploads`.

## Endpoints principaux

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Connexion, retourne un token JWT |
| GET | `/eleves` | cpe, surveillant, enseignant | Liste des élèves (recherche via `?recherche=`) |
| GET | `/eleves/:id` | cpe, surveillant, enseignant | Fiche élève complète |
| GET | `/absences` | cpe, surveillant, enseignant | Absences (`?periode=jour\|semaine`) |
| POST | `/absences` | cpe, surveillant, enseignant | Saisir une absence (notifie les responsables) |
| GET | `/absences/enfant` | parent | Absences de l'enfant du parent connecté |
| POST | `/absences/:id/justificatif` | parent | Envoyer un justificatif (notifie le CPE) |
| GET | `/absences/justificatifs` | cpe, surveillant | Justificatifs en attente de traitement |
| PATCH | `/absences/:id/justificatif` | cpe, surveillant | Accepter/refuser un justificatif (`{ decision }`) |
| GET | `/sanctions` | cpe, surveillant | Liste des sanctions |
| POST | `/sanctions` | cpe, surveillant | Créer une sanction (notifie les responsables) |
| GET | `/cours?classeId=` | cpe, surveillant, enseignant | Emploi du temps d'une classe |
| GET | `/cours/enfant` | parent | Emploi du temps de l'enfant |
| GET | `/messages` | tous | Messages envoyés/reçus |
| POST | `/messages` | tous | Envoyer un message (notifie le destinataire) |
| PATCH | `/messages/:id/lu` | tous | Marquer un message comme lu |
| GET | `/utilisateurs/correspondants` | tous | Destinataires possibles pour la messagerie (parents pour le CPE, CPE/surveillant pour le parent) |
| POST | `/uploads` | tous | Upload d'un fichier (`multipart/form-data`, champ `fichier`) — retourne `{ url }` |
| POST | `/utilisateurs/push-token` | tous | Enregistre le token Expo Push de l'utilisateur connecté |

Toutes les routes (sauf `/auth/login`) nécessitent l'en-tête `Authorization: Bearer <token>`.

## Notifications push

`src/services/notifications.js` centralise l'envoi : chaque notification est
d'abord enregistrée en base (table `Notification`), puis envoyée via le
service Expo Push si l'utilisateur a un `pushToken` valide enregistré.
Déclenchée automatiquement sur : création d'absence, création de sanction,
envoi de justificatif, traitement de justificatif, nouveau message.

## Upload de fichiers

Stockage local dans `backend/uploads/` (servi statiquement). Pour la
production, remplacer `multer.diskStorage` par un stockage objet (S3,
Cloudinary, etc.) dans `src/routes/uploads.js` — le reste de l'API n'a pas à
changer, seule l'URL retournée change.

## Points restants à implémenter

- Gestion des pièces jointes multiples par justificatif
- Pagination sur les listes (élèves, absences, messages) pour les gros établissements
