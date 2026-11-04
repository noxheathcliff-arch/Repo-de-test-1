# Trousse : architecture et conception

Trousse est un site web mobile first, pensé d'abord pour Android. Il sert à préparer l'achat de produits d'hygiène et de cosmétiques : on ne veut rien oublier, on veut connaître le coût avant de partir et pouvoir montrer le produit au vendeur.

Ce document suit l'ordre de travail réel : **cadrer le problème → inventorier tout ce qui doit exister → structurer (architecture de l'information) → appliquer les principes (Hooked, Lean UX, Laws of UX) → décider la direction visuelle → décider le mouvement**. Le code se trouve dans `app/`.

---

## 1. Cadrage

**Demande telle que formulée** : noter une liste de courses de produits d'hygiène et de cosmétiques, avec des prix en plusieurs devises, une image facultative, la possibilité de tout modifier, des listes organisées par priorité et quantité, et une estimation du coût.

**Le vrai problème** (reformulé comme une question) : *comment une personne qui doit bientôt racheter ses produits peut-elle partir faire ses achats sans rien oublier, en sachant combien prévoir, et se faire comprendre du vendeur ?*

Trois problèmes distincts se cachent dans la demande :

| Problème | Ce qui échoue aujourd'hui | Ce qui le résout |
|---|---|---|
| L'oubli | La liste est dans la tête ou sur un papier ; on oublie le produit qu'on n'a pas vu se vider | Un catalogue personnel réutilisable et des listes qu'on coche |
| L'incertitude sur le coût | Les prix varient selon le magasin et la devise ; on ne sait pas quoi prévoir | Plusieurs prix par produit, une conversion vers une devise principale, une fourchette *minimum – maximum* |
| La communication en magasin | « Le sérum avec le bouchon doré, je ne sais plus le nom exact » | Une photo affichée en plein écran, sur fond noir, avec nom, marque, format et note (teinte, contenance) |

**Persona** : Camille, 27 ans, téléphone Android de milieu de gamme, connexion parfois instable. Camille achète ses produits une ou deux fois par mois, entre une grande surface, une pharmacie et une boutique de cosmétiques, parfois lors d'un voyage où la devise change. Le budget est surveillé de près. En magasin, Camille tient son téléphone d'une main, souvent avec un panier dans l'autre.

**Contexte d'usage, en deux temps** :
1. **À la maison (préparer)** : calme, assis, saisie possible. On ajoute des produits, des prix, des photos.
2. **En magasin (exécuter)** : debout, une main, lumière variable, attention partagée. On coche, on regarde le reste à payer, on montre une photo.

**Contraintes** : pas de compte ni de serveur (données sur le téléphone), fonctionnement hors ligne, Android d'abord, lisible en plein soleil comme le soir.

---

## 2. Inventaire exhaustif (avant tout principe)

Liste de tout ce qui doit exister, déduite des problèmes et du persona, et non d'un gabarit de sections.

### 2.1 Objets (le modèle de contenu)

| Objet | Attributs | Obligatoire |
|---|---|---|
| **Produit** (catalogue personnel) | nom | oui |
| | marque, format (ex. « 250 ml », « teinte 102 »), catégorie, note | non |
| | photo | non |
| | prix : liste de *montant + devise + magasin* | non (0 à n) |
| **Liste** | nom | oui |
| | budget (devise principale), date de création, état (en cours / terminée) | non |
| | lignes : *produit + quantité + priorité + acheté ?* | 0 à n |
| **Réglages** | thème (système, clair, sombre), devise principale, taux de conversion | valeurs par défaut |

Un produit vit **une seule fois** dans le catalogue et peut apparaître dans plusieurs listes. Modifier un prix le met à jour partout : c'est la source de l'estimation.

### 2.2 Fonctions

**Préparer**
- Créer, renommer, dupliquer, supprimer une liste ; lui donner un budget.
- Ajouter un produit du catalogue à une liste en un geste ; créer un produit à la volée depuis la recherche.
- Régler la quantité et la priorité (Urgent, Normal, Plus tard) de chaque ligne.
- Créer, modifier, supprimer un produit ; ajouter, modifier, retirer ses prix ; ajouter, changer, retirer sa photo (appareil photo ou galerie).

**Estimer**
- Fourchette *min – max* du reste à acheter, dans la devise principale.
- Comparaison avec le budget (dépassement dit en texte, pas seulement en couleur).
- Signalement des produits sans prix et des prix non convertis (taux manquant).
- Prix le plus bas et magasin correspondant pour chaque produit.

**Exécuter (en magasin)**
- Cocher un produit acheté ; il descend dans « Dans le panier ».
- Progression visible (« 3 sur 8 dans le panier ») et reste à payer mis à jour.
- Afficher la photo en plein écran pour la montrer au vendeur.
- Moment de fin : tout est dans le panier → archiver ou tout décocher.

**Retrouver**
- Rechercher un produit (nom, marque, format, note).
- Filtrer par catégorie.
- Retrouver une liste terminée et la réutiliser.

**Protéger**
- Annuler une suppression (snackbar « Annuler »).
- Exporter et importer une sauvegarde (photos comprises).
- Demander au navigateur un stockage persistant.
- Effacer toutes les données (avec confirmation).

### 2.3 États à concevoir

| Écran | Vide | Partiel | Erreur |
|---|---|---|---|
| Listes | Aucune liste : explication + action « Créer ma première liste » | Listes en cours + section « Terminées » repliée | Stockage indisponible : snackbar explicite |
| Liste | Aucun produit : action « Ajouter des produits » | Produits sans prix signalés dans l'estimation | Taux manquant : « 2 prix en USD non convertis » + lien vers Réglages |
| Produits | Catalogue vide : explication + « Nouveau produit » | Recherche sans résultat : proposition de créer le produit | |
| Fiche produit | Pas de photo : zone d'ajout facultative | | Nom manquant, montant illisible : message sous le champ |

---

## 3. Architecture de l'information

Référence : *Information Architecture for the Web and Beyond* (Rosenfeld, Morville, Arango). L'architecture se décrit par ses quatre systèmes : organisation, étiquetage, navigation, recherche.

### 3.1 Écologie de l'information

- **Contexte** : usage personnel, privé, hors ligne, sur téléphone.
- **Contenu** : peu volumineux (des dizaines à quelques centaines de produits), très répétitif d'un mois à l'autre.
- **Utilisateurs** : une seule personne, deux modes (préparer, exécuter). Les comportements de recherche sont surtout du **« known-item seeking »** (je sais quel produit je cherche) et un peu d'**exploration** (qu'est-ce que j'ai déjà dans mon catalogue ?).

### 3.2 Système d'organisation

| Où | Schéma | Type | Pourquoi |
|---|---|---|---|
| Catalogue | Alphabétique | Exact | Recherche d'un élément connu : le plus prévisible |
| Catalogue | Par catégorie (Visage, Corps, Cheveux…) | Ambigu, par sujet | Exploration ; c'est aussi l'organisation des rayons en magasin |
| Liste | Par priorité (défaut) | Ambigu, par tâche | Répond à « qu'est-ce que je ne dois surtout pas oublier ? » |
| Liste | Par catégorie (au choix) | Ambigu, par sujet | Suit le parcours des rayons en magasin |
| Listes | Chronologique (dernière modifiée en haut) | Exact | La liste en cours est presque toujours la plus récente |

**Structure** : hiérarchie peu profonde, trois niveaux au maximum (destination → objet → détail en feuille). Relation **plusieurs-à-plusieurs** entre produits et listes (modèle en base, pas en arbre) : le catalogue est la source, les listes sont des vues.

### 3.3 Système d'étiquetage

Vocabulaire court, concret et identique partout :

| Concept | Étiquette retenue | Rejetée (et pourquoi) |
|---|---|---|
| Ensemble de produits à acheter | **Liste** | « Panier » (ambigu avec l'état acheté), « Session » |
| Produit enregistré | **Produit** | « Article », « Item » (anglicisme) |
| Ensemble des produits | **Produits** (navigation) | « Catalogue » (moins direct en navigation ; reste utilisé dans le texte) |
| Acheté | **Dans le panier** | « Fait », « Terminé » (moins concret en magasin) |
| Priorité haute / normale / basse | **Urgent / Normal / Plus tard** | « P1 / P2 / P3 » (abstrait) |
| Coût prévu | **Estimation** | « Total » (laisse croire à un montant exact) |

Les montants s'écrivent en français (`4,50 €`), les plages avec un tiret demi-cadratin (`12,00 – 18,50 €`).

### 3.4 Système de navigation

- **Navigation globale** : trois destinations, de même importance, toujours dans le même ordre : **Listes**, **Produits**, **Réglages**. Barre de navigation en bas sous 600 dp, rail de navigation à gauche au-delà.
- **Navigation locale** : dans une liste, un bouton segmenté « Priorité | Catégorie » ; dans le catalogue, des chips de catégorie.
- **Navigation contextuelle** : depuis une ligne de liste, ouvrir le produit ; depuis l'estimation, aller aux taux de conversion ; depuis une recherche vide, créer le produit.
- **Retour** : flèche en haut à gauche sur les pages de détail ; le geste retour d'Android ferme d'abord la feuille ouverte, puis revient à la page précédente.

### 3.5 Système de recherche

- Champ de recherche en haut du catalogue et dans la feuille d'ajout à une liste.
- Recherche instantanée, insensible à la casse et aux accents, sur nom, marque, format et note.
- Aucun résultat : jamais une impasse ; la recherche propose « Créer « … » ».

### 3.6 Plan du site

```text
Listes (accueil)                       #/listes
├── Liste                              #/liste/:id
│   ├── feuille : ajouter des produits (recherche + création rapide)
│   ├── feuille : ligne (quantité, priorité, retirer, ouvrir le produit)
│   └── plein écran : montrer au vendeur
└── feuille : nouvelle liste / renommer

Produits                               #/produits
└── Fiche produit (créer / modifier)   #/produit/nouveau · #/produit/:id
    └── plein écran : montrer au vendeur

Réglages                               #/reglages
    Apparence · Devises et taux · Sauvegarde · Données
```

### 3.7 Parcours principaux

1. **Première visite** : Listes vide → « Créer ma première liste » → nom (suggestions en chips) → la feuille d'ajout s'ouvre aussitôt → taper un nom → « Ajouter « Shampooing » » → le produit est créé et ajouté.
2. **Préparer le mois** : Listes → ouvrir la liste → « Ajouter » → toucher les produits habituels → ajuster quantité et priorité → lire l'estimation.
3. **En magasin** : ouvrir la liste → cocher au fur et à mesure → toucher une ligne → « Montrer » → photo plein écran.
4. **Mois suivant** : section « Terminées » → « Réutiliser » → la liste est dupliquée, tout décoché.

---

## 4. Hooked (Nir Eyal) : la boucle d'habitude, appliquée avec éthique

Le but n'est pas de rendre la personne dépendante. Le but est que **le réflexe « je note dans Trousse »** remplace le papier, parce qu'il rend vraiment service. Aucune notification, aucun compteur artificiel.

| Phase | Application |
|---|---|
| **Déclencheur externe** | Le flacon presque vide, la fin du mois. Le site est installable sur l'écran d'accueil (manifeste) : l'icône devient le déclencheur visible. Le partage en texte d'une liste vers un proche est un second déclencheur. |
| **Déclencheur interne** | La peur d'oublier et l'incertitude sur le budget. L'accueil montre directement la liste en cours, sa progression et son estimation. |
| **Action** (motivation × capacité) | L'action est réduite au minimum : seul le nom est obligatoire ; on crée un produit depuis la recherche sans changer d'écran ; une liste neuve ouvre aussitôt l'ajout. |
| **Récompense variable** | *Récompense de la chasse* : l'estimation se recalcule à chaque ajout ; le prix le plus bas et son magasin apparaissent. *Récompense personnelle* : la progression avance à chaque produit coché ; la fin de liste est un vrai moment de clôture. |
| **Investissement** | Chaque produit, prix ou photo ajouté rend la liste suivante plus rapide à faire (réutiliser une liste terminée, catalogue qui se remplit). La sauvegarde exportable protège cet investissement. |

**Garde-fous éthiques** (matrice de manipulation d'Eyal : le produit améliore la vie de la personne, et je l'utiliserais moi-même) : pas de notifications, pas de séries, pas de culpabilisation ; une donnée supprimée peut être restaurée ; les données ne quittent jamais le téléphone.

---

## 5. Lean UX : hypothèses, MVP, mesures

Le site est un **MVP** : il teste les hypothèses les plus risquées avant d'ajouter quoi que ce soit.

**Énoncé du problème** : les personnes qui achètent régulièrement leurs produits d'hygiène et de cosmétiques oublient des produits et dépassent leur budget, parce que leur liste et leurs prix ne sont nulle part réunis.

| Hypothèse | Nous croyons que… | Nous saurons que c'est vrai quand… |
|---|---|---|
| H1 (valeur) | une liste qui se coche et un catalogue réutilisable réduisent les oublis | la personne déclare ne plus revenir au magasin pour un produit oublié |
| H2 (valeur) | une fourchette min – max suffit pour préparer son budget, sans prix exact | l'écart entre estimation et ticket de caisse reste dans la fourchette |
| H3 (usage) | la photo plein écran facilite l'échange avec le vendeur | « Montrer » est utilisé au moins une fois par visite en magasin |
| H4 (capacité) | n'exiger que le nom suffit à faire démarrer | la première liste contient au moins 3 produits dès la première session |
| H5 (rétention) | réutiliser une liste terminée fait revenir le mois suivant | « Réutiliser » est utilisé à la deuxième visite |

**Volontairement absent du MVP** (à tester ensuite, pas à supposer) : comptes et synchronisation, taux de change automatiques en ligne, scan de code-barres, rappels de réachat, listes partagées en temps réel.

**Boucle suivante** : observer 5 personnes en situation réelle (à la maison, puis en magasin), noter où elles hésitent, itérer sur la structure avant le style.

---

## 6. Laws of UX (Jon Yablonski) : où chaque loi agit

| Loi | Application concrète |
|---|---|
| **Fitts** | Action principale (bouton flottant étendu) en bas à droite, dans la zone du pouce ; cibles de 48 × 48 dp minimum, espacées de 8 dp ; case à cocher sur toute la hauteur de la ligne. |
| **Hick** | 3 destinations ; 3 priorités ; un seul bouton principal par écran ; les actions rares (renommer, dupliquer, supprimer) dans un menu. |
| **Jakob** | Conventions Android : barre de navigation basse, bouton flottant, feuilles depuis le bas, geste retour, snackbar avec « Annuler ». |
| **Miller** (regroupement) | La liste est découpée en groupes (Urgent, Normal, Plus tard, Dans le panier) au lieu d'une longue colonne. |
| **Tesler** (complexité irréductible) | Le site porte la complexité des devises : conversion automatique, signalement des taux manquants. |
| **Postel** | Les montants acceptent `4,5`, `4.50`, `1 200` ; la recherche ignore accents et majuscules. |
| **Doherty** (< 400 ms) | Tout est local : chaque action a un retour immédiat ; les animations durent entre 150 et 400 ms. |
| **Goal-gradient** | Barre de progression « 3 sur 8 dans le panier » ; plus on approche, plus elle se voit. |
| **Zeigarnik** | Les listes non terminées restent en tête de l'accueil, avec leur progression. |
| **Peak-end** | Le pic (cocher) et la fin (« Tout est dans le panier ») reçoivent le soin du mouvement ; la fin propose une suite (archiver, réutiliser). |
| **Von Restorff** | L'accent coloré est réservé à l'action principale et aux états actifs : il ressort parce qu'il est rare. |
| **Serial position** | Urgent en haut ; « Dans le panier » en bas ; estimation en tête de liste. |
| **Proximité / région commune** (Gestalt) | Le prix est à côté du produit ; montant, devise et magasin forment une seule rangée ; l'estimation est contenue dans sa propre surface. |
| **Similarité / uniformité** | Toutes les lignes de produit ont la même anatomie, dans les listes comme dans le catalogue. |
| **Esthétique-utilisabilité** | Une interface calme inspire confiance ; l'esthétique ne masque jamais un problème d'usage. |
| **Choice overload** | Catégories limitées à une dizaine ; suggestions de noms de liste limitées à trois. |

---

## 7. Direction visuelle (skill material-design, noyau § 8)

Six décisions, une ligne chacune :

1. **Couleur** : 60-30-10 strict. Statique (pas de couleur dynamique). Une seule couleur d'accent, un **sarcelle** (bleu-vert d'apothicaire) : propreté, soin, neutre en genre, sans le cliché rose des cosmétiques.
2. **Typographie** : la police système (Roboto sur Android). Raison : zéro téléchargement hors ligne, rendu natif d'Android (loi de Jakob). Cinq styles de l'échelle seulement ; chiffres tabulaires pour les prix.
3. **Forme** : langage doux. Lignes et vignettes 12 dp, surfaces 16 dp, feuilles 28 dp en haut, boutons en pilule.
4. **Profondeur** : plat tonal. Seuls le bouton flottant (au-dessus du contenu qui défile) et les feuilles (au-dessus d'un voile) portent une ombre, parce qu'elle informe.
5. **Mouvement** : schéma *standard* ; l'expressivité est réservée à la case cochée et à la fin de liste.
6. **Densité** : aérée par défaut (usage debout, une main).

### 7.1 La règle 60-30-10

| Part | Jour | Nuit | Rôles |
|---|---|---|---|
| **60 %** dominante | **Blanc** `#FFFFFF` | **Noir** `#000000` (économise la batterie des écrans OLED Android) | `surface` |
| **30 %** secondaire | Gris neutres légèrement teintés : surfaces `#F4F6F6 → #E1E4E4`, texte `#191C1C` / `#3F4948` | Gris sombres : surfaces `#0E1111 → #2A2E2E`, texte `#E0E3E3` / `#BEC8C8` | `surface-container-*`, `on-surface`, `on-surface-variant`, `outline`, `secondary-container` |
| **10 %** accent | Sarcelle `#00696B` (texte blanc, contraste 6,3:1) | Sarcelle clair `#4CDADB` (texte `#003738`) | `primary` / `on-primary` : bouton principal, case cochée, progression, liens |

L'erreur (`#BA1A1A` / `#FFB4AB`) n'entre pas dans la répartition : elle n'apparaît qu'en cas de problème, toujours avec un texte ou une icône.

### 7.2 Échelle typographique utilisée

| Rôle | Taille / interligne / graisse | Usage |
|---|---|---|
| Headline medium | 28 / 36 / 400 | Titre de destination, montant de l'estimation |
| Title large | 22 / 28 / 400 | Titre de page de détail |
| Title medium | 16 / 24 / 500 | Nom de produit, nom de liste |
| Body medium | 14 / 20 / 400 | Texte d'accompagnement |
| Label large / medium | 14 / 20 / 500 · 12 / 16 / 500 | Boutons, chips, navigation |

### 7.3 Adaptation aux largeurs

| Breakpoint | Structure |
|---|---|
| Compact (< 600 dp) | Un panneau, barre de navigation en bas, marges 16 dp, feuilles depuis le bas. La barre est masquée sur les pages de détail (retour disponible). |
| Medium et plus (≥ 600 dp) | Rail de navigation à gauche, marges 24 dp, colonne de contenu limitée à 720 dp pour garder une longueur de ligne lisible, feuilles centrées. |

---

## 8. Mouvement : les 12 principes de *The Illusion of Life*

Les 12 principes de Frank Thomas et Ollie Johnston, traduits en règles d'interface. Le mouvement explique une cause ou un état ; il ne décore jamais. `prefers-reduced-motion` coupe toutes les animations, et l'état final reste compréhensible sans elles.

| Principe | Où et comment |
|---|---|
| **Squash and stretch** | La case cochée s'écrase (0,85) puis rebondit (1,1 → 1) : la seule déformation du site, réservée à l'action qui compte le plus en magasin. |
| **Anticipation** | Boutons et bouton flottant se compriment légèrement à l'appui (0,96) avant que la feuille ne monte. |
| **Staging** | Un voile assombrit le fond quand une feuille s'ouvre : une seule chose à regarder. Une seule animation importante à la fois. |
| **Straight ahead / pose to pose** | Toutes les animations sont construites en poses clés (keyframes), donc prévisibles et réversibles. |
| **Follow-through and overlapping action** | La feuille monte, puis son contenu arrive 60 ms après ; les lignes d'une liste entrent en léger décalage (20 ms). |
| **Slow in, slow out** | Courbes d'accélération Material : décélération pour entrer (`0.05, 0.7, 0.1, 1`), accélération pour sortir (`0.3, 0, 0.8, 0.15`). |
| **Arcs** | La photo s'agrandit depuis sa vignette jusqu'au plein écran (transformation de conteneur) : on voit d'où elle vient. |
| **Secondary action** | Quand on coche, la barre de progression avance et le reste à payer défile vers sa nouvelle valeur. |
| **Timing** | 150 ms (petits éléments, opacité), 250 à 400 ms (feuilles, pages) ; sorties plus courtes que les entrées. |
| **Exaggeration** | Réservée au moment de fin de liste. Partout ailleurs, sobriété. |
| **Solid drawing** | Un seul modèle de profondeur (plat tonal + ombres fonctionnelles) : les surfaces restent cohérentes en mouvement. |
| **Appeal** | Mouvements courts, doux, sans rebond gratuit : le calme fait partie de la marque. |

Transitions de page : fondu entre destinations principales (pas de lien hiérarchique) ; glissement court vers la droite pour entrer dans un détail, vers la gauche pour revenir.

---

## 9. Accessibilité (vérifications intégrées)

- Contrastes : texte ≥ 4,5:1, éléments graphiques ≥ 3:1, vérifiés en clair et en sombre.
- Cibles ≥ 48 × 48 dp ; focus visible (anneau de 3 px) sur tous les contrôles.
- Structure : un `h1` par écran, landmarks `nav`, `main` ; feuilles en `role="dialog"` avec focus piégé, `Échap` pour fermer, retour du focus au déclencheur.
- La priorité n'est jamais portée par la couleur : titre de groupe, icône et texte.
- Texte agrandissable à 200 % : conteneurs qui grandissent, retour à la ligne plutôt que troncature pour les noms de produits.
- Annonces : snackbar en `role="status"` ; progression et estimation lisibles par les lecteurs d'écran.
