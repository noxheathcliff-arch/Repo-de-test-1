# Necess

Projet de test pour enchaîner plusieurs skills sur une même idée d'appli.

**Necess** est une mémoire d'achat visuelle : une liste d'achats où chaque produit a sa photo, son nom exact et son prix habituel, pour acheter exactement le bon produit en magasin.

## Avancement

| Étape | Skill | Livrable |
|---|---|---|
| 1. Contenu et fonctions | `essentiel-ux` | [docs/necess-essentiel-ux.md](docs/necess-essentiel-ux.md) |
| 2. Identité et direction artistique | `direction-artistique` | [docs/direction/necess-direction-artistique.md](docs/direction/necess-direction-artistique.md) · [planche](docs/direction/planche-direction.png) |
| 3. Interface codée | `material-design` | [app/](app/) · [docs/material/necess-material.md](docs/material/necess-material.md) |

## Lancer l'app

L'app tient dans `app/`, sans dépendance ni étape de build. Il faut la servir en HTTP : le service worker ne fonctionne pas en `file://`.

```bash
cd app && python3 -m http.server 8000
```

Ouvre ensuite `http://localhost:8000/`. Ajoute `?demo` à l'adresse pour charger des exemples fictifs.

Les données restent sur l'appareil (IndexedDB). Pour les conserver ailleurs, utilise l'export depuis le menu ⋮.

Les polices Atkinson Hyperlegible Next et IBM Plex Sans Condensed sont sous licence SIL Open Font License.
