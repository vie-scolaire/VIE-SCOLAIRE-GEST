# Vie scolaire — Application mobile

Application React Native (Expo) pour le suivi de la vie scolaire, branchée sur
un vrai backend (API REST + PostgreSQL). Voir `backend/README.md` pour lancer
l'API.

## Lancer le projet

1. Démarrer le backend (voir `backend/README.md`)
2. Dans `src/api/client.js`, mettre à jour `API_URL` avec l'adresse IP locale
   de votre machine (pas `localhost`, qui ne fonctionne pas depuis un
   téléphone physique ou un émulateur Android)
3. Installer et lancer l'app mobile :

```bash
npm install
npm start
```

Puis scanner le QR code avec l'app Expo Go (iOS/Android), ou lancer un simulateur :

```bash
npm run android   # émulateur Android
npm run ios       # simulateur iOS (Mac uniquement)
npm run web       # navigateur
```

## Comptes de test (créés par `npm run seed` dans le backend)

- **CPE** : `cpe@lycee-ouaga.bf` / `motdepasse123`
- **Parent** : `parent@example.com` / `motdepasse123`

## Structure

```
App.js                       Authentification + navigation par rôle
app.json                     Configuration Expo (permissions photo, etc.)
src/
  api/
    client.js                 Client HTTP (appels à l'API backend, upload de fichiers)
  context/
    AuthContext.js             Gestion du token, de l'utilisateur connecté et du push token
  notifications/
    pushSetup.js               Demande de permission et récupération du token Expo Push
  screens/
    LoginScreen.js              Connexion
    DashboardScreen.js          Tableau de bord CPE
    AbsencesScreen.js           Liste des absences + formulaire de saisie
    SanctionsScreen.js          Liste des sanctions + formulaire de saisie
    ElevesScreen.js             Recherche et liste des élèves
    FicheEleveScreen.js         Détail d'un élève
    JustificatifsScreen.js      Traitement des justificatifs (accepter/refuser)
    EmploiDuTempsScreen.js      Emploi du temps par classe
    MessagesScreen.js           Messagerie (lecture + composition d'un nouveau message)
    PlusScreen.js                Menu regroupant Justificatifs/Emploi du temps/Messages + déconnexion
    parent/
      AbsencesParentScreen.js     Liste des absences de l'enfant + déconnexion
      JustifierAbsenceScreen.js   Formulaire de justification avec upload de photo
      ConfirmationScreen.js       Confirmation d'envoi
      EmploiDuTempsParentScreen.js Emploi du temps de l'enfant
  theme/
    theme.js                    Couleurs, espacements, typographie partagés

backend/                      API REST (voir backend/README.md)
```

## Comportement selon le rôle connecté

- **CPE / surveillant / enseignant** → onglets Accueil, Absences, Sanctions, Élèves, Plus (Justificatifs, Emploi du temps, Messages, Déconnexion)
- **Parent** → Absences → Justifier → Confirmation, Emploi du temps, Messages

## Notifications push

Configurées avec Expo Notifications : à la connexion, l'app demande la
permission et enregistre le token auprès du backend (`POST
/utilisateurs/push-token`). Le backend envoie une notification à chaque
absence, sanction, ou traitement de justificatif. Fonctionne sur un appareil
physique via Expo Go — pas dans le simulateur iOS (limitation d'Expo).

## Points restants à implémenter

- Emploi du temps modifiable (actuellement en lecture seule, alimenté par le seed)
- Écran de connexion par rôle façon maquette initiale (actuellement un seul formulaire de connexion, sans sélection de profil au préalable)
- Marquer un message comme lu automatiquement à l'ouverture (l'endpoint `PATCH /messages/:id/lu` existe, pas encore appelé depuis l'UI)
