# Trousse

Site web mobile first (Android d'abord) pour préparer l'achat de ses produits d'hygiène et de cosmétiques : ne rien oublier, savoir combien prévoir, et montrer le produit au vendeur.

## Ce que fait le site

- **Listes** organisées par priorité (Urgent, Normal, Plus tard) ou par catégorie, avec quantité, cases à cocher et progression.
- **Catalogue de produits** réutilisable : nom, marque, format, catégorie, note, photo facultative.
- **Plusieurs prix par produit**, chacun avec sa devise et son magasin ; conversion vers une devise principale.
- **Estimation** du reste à acheter (fourchette min – max), comparaison avec un budget, signalement des prix manquants.
- **Montrer au vendeur** : la photo en plein écran sur fond noir, avec nom, marque, format et note.
- Mode jour (60 % blanc) et mode nuit (60 % noir), automatique ou forcé.
- Hors ligne, installable sur l'écran d'accueil, sauvegarde exportable. Aucune donnée ne quitte le téléphone.

## Fichiers

| Chemin | Contenu |
|---|---|
| [`conception/architecture.md`](conception/architecture.md) | Cadrage, inventaire du contenu, architecture de l'information, Hooked, Lean UX, Laws of UX, direction visuelle 60-30-10, mouvement (12 principes de *The Illusion of Life*) |
| [`app/`](app/) | Le site : `index.html`, `styles.css`, `app.js`, manifeste, service worker. Aucune dépendance, aucune compilation. |

## Lancer en local

```bash
cd app
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` (sur le téléphone : l'adresse IP de l'ordinateur sur le même Wi-Fi).
