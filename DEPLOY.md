# Guide de Déploiement Vercel

Votre application Frontend est prête à être déployée sur Vercel. Voici les étapes à suivre :

## 1. Prérequis
- Un compte [Vercel](https://vercel.com/)
- Le code poussé sur un dépôt GitHub/GitLab/Bitbucket

## 2. Configuration sur Vercel

1. **Importer le projet** :
   - Allez sur le Dashboard Vercel.
   - Cliquez sur "Add New..." > "Project".
   - Importez votre dépôt Git `fight-ace-app`.

2. **Paramètres de Build** (Normalement détectés automatiquement) :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build` (ou `vite build`)
   - **Output Directory** : `dist`

3. **Variables d'Environnement** :
   Ajoutez les variables suivantes dans la section "Environment Variables" :

   | Nom | Valeur (Exemple Production) |
   |-----|-----------------------------|
   | `VITE_API_URL` | `https://jealous-giraffe-ndigueul-efe7a113.koyeb.app/api` |
   | `VITE_WS_URL` | `https://jealous-giraffe-ndigueul-efe7a113.koyeb.app` |
   | `VITE_ADMIN_PATH` | `/admin2` |

   > **Note** : Si vous ne définissez pas `VITE_API_URL` et `VITE_WS_URL`, l'application utilisera les valeurs par défaut définies dans `src/config.ts` (qui pointent déjà vers votre backend Koyeb).

## 3. Configuration existante

- **vercel.json** : Ce fichier est déjà présent à la racine pour gérer les redirections (Routing) nécessaires aux applications React (SPA).
- **vite.config.ts** : Configuré correctement pour le build.

## 4. Déploiement

- Cliquez sur **Deploy**.
- Vercel va construire l'application et vous fournir une URL (ex: `https://votre-projet.vercel.app`).

## Vérification

Une fois déployé, vérifiez :
1. Que la page se charge sans erreur.
2. Que les requêtes API (Login, Récupération des combats) fonctionnent.
3. Que la connexion WebSocket s'établit (vérifiable dans la console du navigateur ou via les mises à jour en direct).
