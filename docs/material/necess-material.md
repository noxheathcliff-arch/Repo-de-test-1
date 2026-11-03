# Necess : mise en œuvre material-design

> Produit avec le skill **material-design**, à partir de `docs/necess-essentiel-ux.md` et de `docs/direction/necess-direction-artistique.md`.
> Le code est dans `app/`. Captures : `docs/captures/`.

## Direction visuelle en 6 décisions

| Décision | Choix | Raison |
|---|---|---|
| Couleur | Schéma **statique**, sans couleur dynamique. Source `primary` vermillon `#C2401A`, `secondary` ardoise `#2B3640`, neutres bleu-gris `#F2F4F5` / `#12171B`, `error` carmin `#B3122E`. | Les photos des produits apportent la couleur ; l'interface reste un support neutre. |
| Typo | `brand` = IBM Plex Sans Condensed (titres, noms, données en chiffres tabulaires) ; `plain` = Atkinson Hyperlegible Next (texte, actions). Polices servies localement. | Voix de l'étiquette contre voix lisible en rayon ; fonctionne hors ligne. |
| Forme | Net : 4 px partout, 0 pour les surfaces pleine largeur, aucune pilule. | Coins d'étiquette autocollante. |
| Profondeur | Plat contour : filets, tonalité. Ombres seulement pour le menu et la snackbar ; scrim sous les dialogs. | Les filets suffisent et laissent la place aux photos. |
| Mouvement | Scheme `standard`. Un seul moment chorégraphié : le **retournement** (View Transitions, environ 300 ms, `emphasized decelerate`), fondu de 100 ms en mouvement réduit. | Le verso est le même produit vu de dos. |
| Densité | Liste confortable (lignes ≥ 104 px, photo 88 px) ; verso compact (lignes ≥ 48 px). Densité jamais réduite automatiquement. | Une main en rayon ; contre-étiquette dense par nature. |

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
