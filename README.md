# critiques-services.com

Plateforme de critiques de services avec preuves vidéo — Expériences personnelles réelles uniquement.

## Aperçu

Application PWA (Progressive Web App) construite avec React + Vite. Permet de publier, consulter, voter et commenter des critiques de services, avec géolocalisation (Leaflet), galerie de preuves (images/vidéos/audio/documents), système de réactions emoji, authentification locale et mode hors-ligne.

## Stack

- React 18, React Router DOM, Vite
- Leaflet (cartes, via CDN)
- IndexedDB (idb) pour le stockage hors-ligne
- Service Worker + Web App Manifest (PWA)
- GitHub Pages (CI/CD via GitHub Actions)

## Installation locale

```bash
git clone https://github.com/samuelhaihornberg/critiques-services.com.git
cd critiques-services.com
npm install
npm run dev        # http://localhost:3000
npm run build      # production dans dist/
npm run preview    # prévisualiser le build
```

## Scripts

| Script | Rôle |
|--------|------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production statique (`dist/`) |
| `npm run preview` | Prévisualiser le build localement |
| `npm run lint` | Vérification ESLint |
| `npm run lint:fix` | Auto-correction ESLint |
| `npm test` | Tests Vitest |

## Déploiement

Le déploiement sur GitHub Pages est automatique via `.github/workflows/deploy.yml` à chaque push sur la branche `master`.

GitHub Pages : https://samuelhaihornberg.github.io/critiques-services.com/

## État

Voir `PROGRESSION.md` pour la ventilation détaillée par public (client, contributeur, admin) et les blocages identifiés.

## Licence

Privé — tous droits réservés.
