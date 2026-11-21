# Job Tracker

Application de suivi de candidatures.

## Stack

- **Frontend** : Angular
- **Backend** : NestJS
- **Base de données** : MongoDB Atlas
- **Hébergement** : Firebase / Google Cloud (projet `taxi-demo-497a3`)

## Prérequis

- Node.js 22+
- Angular CLI (`npm i -g @angular/cli`)
- NestJS CLI (`npm i -g @nestjs/cli`)
- Firebase CLI (`npm i -g firebase-tools`), connecté via `firebase login`
- Google Cloud SDK, connecté via `gcloud auth login`

## Configuration

Les secrets (dont la chaîne de connexion MongoDB Atlas) se placent dans un fichier `.env`, qui n'est jamais commité :

```
MONGODB_URI=mongodb+srv://<utilisateur>:<mot_de_passe>@<cluster>.mongodb.net/<base>
```

## Lancer en développement

Depuis la racine du projet :

```
npm run install:all   # première fois : installe les dépendances racine, back et front
npm run dev           # lance le backend NestJS (watch) et le frontend Angular en même temps
```

Le frontend est servi sur http://localhost:4200. `Ctrl+C` arrête les deux.
