# Necess : mise en œuvre material-design

> Produit avec le skill **material-design**, à partir de `docs/necess-essentiel-ux.md` et de `docs/direction/necess-direction-artistique.md`.
> Le code est dans `app/`. Captures : `docs/captures/`.

## Version 2 : pourquoi l'interface a été refaite

La v1 reprenait la planche de la direction artistique comme si c'était une maquette. Cette planche ne servait qu'à montrer les couleurs. Ce qui ne marchait pas dans la v1 :

- **Trop de masse en haut** : un bandeau ardoise et des onglets de 26 px concurrençaient le contenu.
- **Les mauvais points focaux** : les éléments les plus forts de l'écran étaient des cases noires de 40 px, pas les produits.
- **Une action principale trop lourde** : une barre vermillon pleine largeur.
- **Une fiche sans hiérarchie** : entièrement en ardoise, tout y avait le même poids.

La v2 garde la direction artistique (couleurs, polices, idée de la contre-étiquette) et refait la structure selon les règles de Material :

- **Grand titre** de page (app bar « medium flexible »), qui se réduit au défilement, avec un indicateur de progression des produits pris.
- **Liste segmentée** : éléments séparés de 2 px, groupe arrondi, miniature de 64 px. La case à cocher suit le standard Material : 18 px, dans une cible de 48 px.
- **Section « Déjà pris »** séparée et atténuée. La liste montre d'abord ce qu'il reste à prendre.
- **Nécessaire en grille de cartes photo**, puisque la mémoire du persona est visuelle. On y trouve une barre de recherche et des filtres (à compléter, catégories, tri).
- **Barre d'outils flottante et FAB** en bas, dans la zone du pouce. Il n'y a que 2 destinations, alors que la navigation bar Material en demande 3 à 5 : la barre d'outils flottante est donc utilisée comme navigation locale.
- **Fiche produit** dans cet ordre :
  - grande photo ;
  - nom ;
  - attributs (contenance, catégorie, rachat) ;
  - action principale « Je l'ai pris » ;
  - carte prix, avec le prix en grand et l'écart signalé ;
  - **contre-étiquette en carte ardoise**, ce qui garde la signature de la DA, désormais sous forme d'objet contenu ;
  - historique.
- **Forme passée de « nette » à « douce »** : 8, 12 et 16 px, et 28 px pour les dialogs. Les coins de 4 px partout rendaient l'interface dure. Les formes pleines sont réservées à la barre d'outils, aux boutons et à la recherche.

## Direction visuelle en 6 décisions

| Décision | Choix |
|---|---|
| Couleur | Schéma statique. `primary` vermillon pour le FAB et l'action « Je l'ai pris » ; `secondary` ardoise pour les cases cochées, la section active, la progression et la contre-étiquette ; neutres bleu-gris. Couleurs d'erreur en carmin. Pas de couleur dynamique. |
| Typo | Plex Sans Condensed pour les titres, les noms et les chiffres ; Atkinson Hyperlegible Next pour le texte et les actions. |
| Forme | Douce : miniatures de 12 px, cartes et groupes de 16 px, dialogs de 28 px, formes pleines pour la barre d'outils, les boutons et la recherche. |
| Profondeur | Plat tonal : les surfaces se séparent par niveaux de `surface-container`. Des ombres uniquement sur ce qui flotte (barre d'outils, FAB, menu, snackbar, dialog). |
| Mouvement | Standard. Un seul moment chorégraphié : la miniature devient la photo de la fiche (container transform, 400 ms, emphasized decelerate). |
| Densité | Confortable : éléments de liste d'au moins 88 px ; cibles de 48 px partout. |

## Tokens

- Ils sont définis dans `app/styles.css`, avec le préfixe `nc` et trois classes :
  - `nc-ref-*` pour les valeurs ;
  - `nc-sys-*` pour les rôles (clair et sombre via `prefers-color-scheme`) ;
  - `nc-comp-*` pour les mesures de composant.
- **Appariement** : toujours `X` avec `on-X`.
- **Focus** : un anneau de 3 px à l'encre (`on-surface`, ou `on-secondary` sur l'ardoise). Il n'est jamais au vermillon, réservé à l'action, ni au carmin, réservé à l'erreur.
- **Contrastes mesurés** : tous les couples de texte dépassent 4,5:1, en clair et en sombre. Les contours de champ dépassent 3:1 (4,0 et 5,0).

## Structure

- **Compact** (moins de 600 px) :
  - un seul pane ;
  - deux onglets principaux, « À racheter » et « Ton nécessaire », dans une app bar ardoise ;
  - l'action principale en pleine largeur dans le rail bas, côté pouce ;
  - le verso s'ouvre en plein écran.
- **Medium** : marges de 24 px ; l'action devient flottante à droite.
- **Expanded** (840 px et plus) : deux panes côte à côte, la liste en flexible et le verso en fixe à 412 px.
- **Bouton retour** : il ferme le verso, grâce à l'historique et au hash `#produit/<id>`.

## Composants Material utilisés

| Composant | Usage |
|---|---|
| Tabs principaux | Activation automatique ; flèches, Home et End |
| List | Lignes recto ; checkbox native pour « acheté » |
| Boutons filled, tonal, outlined et text | Selon l'emphase de l'action |
| Icon buttons | Retour, options, remettre dans la liste |
| Chip filtre | « À compléter » |
| Champ de recherche | Recherche du nécessaire |
| Text fields | Libellé visible, aide, erreur avec icône et `aria-invalid` |
| Combobox | Suggestions du nécessaire pendant l'ajout |
| Dialog modal natif | Retour du focus au déclencheur à la fermeture |
| Menu | Export et import |
| Snackbar | Live region polie ; une snackbar avec action reste affichée ; Échap la ferme ; Alt+G l'atteint |

## Correspondance avec les besoins (essentiel-ux)

| Besoin | Mise en œuvre |
|---|---|
| B01 à B08 | Liste, ajout, case acheté avec annulation, compteur, retrait (geste de glisser ou verso), quantité, clôture de la sortie |
| B10 à B17 | Photo (prise ou galerie, réduite à 1 200 px en JPEG), nom exact, marque, contenance et unité, note distinctive, catégorie, photo en grand avec zoom |
| B20 à B26 | Photo et nom visibles sans action ; hors ligne (service worker et IndexedDB) ; cibles de 48 px ; acheté signalé par la coche, le barré et le gris ; ouverture directe sur la liste |
| B30 à B33, B54 | Prix habituel, prix vu daté, écart signé et nommé, ancienneté du prix ; le prix vu le jour de l'achat devient le prix habituel |
| B40 à B43 | Création avec un nom ou une photo seule ; fiches complétées ligne par ligne ; « À compléter » déduit des champs manquants |
| B50 à B56 | Mémoire permanente, remise en liste en un geste, historique automatique, fréquence estimée à partir de 3 achats, suppression confirmée |
| B60 à B64 | Recherche tolérante aux accents, à la casse et à une faute (y compris une inversion de lettres) ; suggestions pendant l'ajout ; filtre ; tris |
| B70 à B74 | Sauvegarde à chaque modification, stockage persistant demandé, erreur de photo avec « Réessayer », export et import JSON avec les photos |

## Vérifications faites (Playwright, Chromium)

- Aucune erreur dans la console.
- Aucun débordement horizontal à 320, 360, 390 et 412 px, ni à 200 % de texte.
- Aucune cible tactile sous 48 px.
- Le focus revient à la ligne d'origine en fermant le verso et va au bouton retour à l'ouverture.
- Les annulations et les erreurs de saisie fonctionnent.
- Après un premier chargement, l'app fonctionne hors ligne (liste et polices disponibles).
- Les thèmes clair et sombre ainsi que la vue à deux panes ont été rendus et regardés.

**Non vérifié** : un vrai lecteur d'écran (TalkBack, VoiceOver) et un vrai téléphone en magasin.
