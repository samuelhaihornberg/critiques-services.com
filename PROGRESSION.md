# PROGRESSION - critiques-services.com

## État global : **90%** - Prêt pour production avec backend

### Ventilation par public

| Public | Progression | Détails |
|--------|-------------|---------|
| **Client/Utilisateur** | 95% | Lecture critiques, votes, commentaires, réactions emoji, recherche, carte, PWA, galerie preuves |
| **Contributeur/Auteur** | 90% | Création critique + preuves multiples (img/vid/audio/doc), géolocalisation, prix + comparatif, commentaire auteur, profil, historique |
| **Admin/Modérateur** | 20% | Interface manquante (backend requis), mais structure proofs/prix/commentaire auteur prête |

### Fonctionnalités core

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Authentification locale | ✅ | localStorage, inscription/connexion |
| Liste critiques + filtres | ✅ | Recherche, catégorie, tri |
| Détail critique | ✅ | Contenu, localisation, galerie preuves, vidéo, votes, réactions, commentaires, prix, commentaire auteur |
| Création critique | ✅ | Formulaire complet + carte + upload multi-preuves (img/vid/audio/doc 100/20Mo) + prix + comparatif + commentaire auteur |
| Système votes 👍/👎 | ✅ | Critiques + commentaires |
| Réactions emoji (12) | ✅ | Critiques + commentaires, animées, compteur, état user |
| Commentaires forum | ✅ | Réponses, votes, réactions, auteur |
| Géolocalisation | ✅ | Leaflet + Nominatim, services en ligne URL |
| Profil utilisateur | ✅ | Infos, stats, onglets critiques/stats, zone danger |
| PWA (install, offline) | ✅ | Service Worker, manifest, icons SVG |
| Build production | ✅ | Vite + PWA plugin |

### Blocages identifiés

1. **Backend/API manquant** (Critique)
   - Sync multi-appareils
   - Modération centralisée
   - Données persistantes serveur

2. **Modération "Vérifié"** (Important)
   - Badge vérifié = validation humaine
   - Workflow signalement → revue → badge

3. **Tests automatisés** (Recommandé)
   - Vitest (unit/hooks)
   - Playwright (E2E critique→vote→commentaire→réaction)

### Prochaines étapes prioritaires

1. **Backend Node/Express + PostgreSQL** ou **Supabase/Firebase**
2. **API REST** : critiques, commentaires, votes, réactions, users, proofs
3. **Modération dashboard** : liste signalements, validation "vérifié", gestion preuves
4. **Tests CI/CD** : GitHub Actions → build → test → deploy

### Métriques techniques

- **Bundle JS** : ~245 kB (75 kB gzip)
- **CSS** : ~52 kB (8 kB gzip)
- **Modules** : 55
- **Dépendances prod** : 6 (react, react-dom, react-router-dom, idb, leaflet via CDN)
- **Dépendances dev** : 9

### Dernière mise à jour
2024-01-29 - Création initiale complète + push GitHub + admin features (proofs, prices, reactions, author comment)

### Déploiement
- **GitHub Repo** : https://github.com/samuelhaihornberg/critiques-services.com
- **GitHub Pages** : À activer (Settings → Pages → Source: GitHub Actions ou gh-pages branch)
- **Local dev** : http://localhost:3000 ✅ HTTP 200
- **Build production** : `dist/` prêt pour déploiement statique