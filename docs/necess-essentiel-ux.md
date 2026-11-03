# Necess : document essentiel-ux

> Produit avec le skill **essentiel-ux**, en mode rapide : l'exécution complète a été demandée, donc il n'y a pas eu d'arrêt de validation entre les phases.
> Les hypothèses prises sans confirmation sont signalées par **[H]** et regroupées dans la section 8, « Questions ouvertes ».

---

## 1. Objectif et problèmes résolus

**Objectif de surface** : une appli de liste d'achats.

**Objectif réel** : Necess est une **mémoire d'achat visuelle**. Elle doit garantir que, une fois en magasin, on achète **exactement** le bon produit, sans en oublier, sans perdre de temps et sans payer plus cher que d'habitude.

### Problèmes concrets à supprimer (A1)

| # | Problème | Ce qui se passe aujourd'hui, sans Necess |
|---|---|---|
| P1 | **L'oubli** | On arrive en magasin sans un produit qu'on comptait acheter, ou on oublie qu'on en avait besoin. |
| P2 | **La confusion entre produits proches** | Même marque, autre parfum, autre contenance : un nom approximatif (« le gel douche bleu ») ne permet pas de reconnaître le bon produit en rayon. |
| P3 | **La lenteur en magasin** | Retrouver le nom exact, la photo ou le prix prend du temps, debout, souvent avec une seule main libre. |
| P4 | **Le prix oublié** | On ne se souvient plus du prix habituel, donc on ne peut pas juger si le prix affiché est normal ou trop élevé. |
| P5 | **La ressaisie** | Les mêmes produits reviennent souvent, et les retaper à chaque fois décourage de tenir la liste. |
| P6 | **La perte d'information** | Une liste ou une photo perdue détruit la confiance dans l'outil, qu'on finit par abandonner. |

---

## 2. Pertinence : ★★★★★ / 5

**Usage personnel du créateur [H]** : l'analyse de départ est écrite à la première personne (« ton vrai problème… acheter exactement ce parfum-là »). Selon la grille, la pertinence est donc acquise d'office.

C'est aussi un cas typique de *scratch your own itch* (Rework) : le créateur vit le problème et peut juger lui-même s'il est bien résolu.

**Raison d'exister propre, face aux applis de listes de courses génériques** : celles-ci sont pensées pour l'alimentaire et la quantité (« 2 litres de lait »), pas pour **l'identification précise** d'un produit parmi des variantes presque identiques. Necess se différencie par la **photo comme référence**, le **nom exact** et la **mémoire du prix**.

**Ce que Necess refuse de faire, à dessein** (*underdo the competition*) :
- pas de recettes, de menus ni de planification de repas ;
- pas de comparateur de prix en ligne ni de catalogue de produits importé ;
- pas de partage social, de notation ni d'avis ;
- pas de programme de fidélité ni de promotions des enseignes ;
- pas de gestion de budget global ou de dépenses mensuelles.

> Si Necess est un jour diffusé à d'autres personnes, il faudra refaire cette évaluation avec une recherche sur les alternatives existantes, et la note pourra baisser.

---

## 3. Persona majeur

**Toi, créateur et unique utilisateur de Necess [H].** Tu rachètes régulièrement des produits d'hygiène et de beauté précis (parfum, gel douche, exfoliant, déodorant…) et tu veux les retrouver à l'identique.

> « Je ne veux pas acheter *un* parfum, je veux acheter *ce* parfum-là, dans cette contenance-là, au prix que je paie d'habitude. »

### Variables comportementales (Cooper)

- **Activités** : tu prépares tes achats chez toi, puis tu vas en magasin (grande surface, droguerie, parfumerie **[H]**). Tu rachètes souvent les mêmes produits, à intervalles plus ou moins réguliers (l'analyse cite « toutes les 3 semaines » pour un gel douche). Une sortie compte quelques produits à une dizaine **[H]**.
- **Attitudes** : tu refuses de perdre du temps. Un outil qui demande trop de saisie est abandonné. Une perte de données suffit à faire perdre confiance.
- **Aptitudes** : tu es à l'aise avec un smartphone et l'appareil photo. Tu n'as pas besoin d'apprentissage, mais tu ne tolères pas de navigation compliquée.
- **Motivations** : ne rien oublier, ne pas te tromper de variante, ne pas payer trop cher, gagner du temps sur les achats récurrents.
- **Compétences métier** : tu connais tes produits quand tu les vois, mais pas toujours leur nom exact, leur contenance ou leur prix de mémoire. Ta mémoire est visuelle avant d'être textuelle.

### Objectifs

- **Objectifs de fin** :
  - noter un besoin d'achat en quelques secondes (P1, P5) ;
  - reconnaître sans hésiter le bon produit en rayon (P2, P3) ;
  - savoir si le prix affiché est normal (P4) ;
  - repartir du magasin avec tout ce qu'il fallait (P1) ;
  - réutiliser ce qui est déjà connu la fois suivante (P5).
- **Objectifs d'expérience** : se sentir rapide, sûr de soi en rayon (« c'est bien celui-là ») et en confiance, avec l'assurance que rien ne se perd.

### Frustrations actuelles

- Une note texte du type « déo » ne dit ni la marque, ni la variante, ni la contenance.
- Les photos de produits se noient dans la galerie du téléphone, au milieu du reste.
- On ne sait plus combien coûtait un produit la dernière fois.
- On retape les mêmes produits à chaque sortie.
- En magasin, il faut faire défiler, zoomer, chercher, avec un panier dans l'autre main.

---

## 4. Besoins du porteur et du contexte (A4)

| Domaine | Constat | Conséquence pour les besoins |
|---|---|---|
| **Légal** | Usage personnel, données stockées chez l'utilisateur : aucune obligation spécifique. | Si une diffusion publique a lieu un jour : mentions légales, politique de confidentialité, consentement si des données partent sur un serveur. **Reporté.** |
| **Porteur** | Porteur et persona sont la même personne. Objectif annexe : servir de projet de test aux skills suivants (direction artistique, design). | Aucun besoin supplémentaire côté produit. |
| **Contenu disponible** | Il n'existe aucune base de produits : toutes les photos et infos viennent de l'utilisateur, souvent prises en magasin ou chez soi. | La saisie doit accepter des fiches incomplètes et des photos ajoutées plus tard. |
| **Contexte : réseau** | La connexion est souvent faible en magasin (sous-sols, structures métalliques). | Tout ce qui sert en magasin doit fonctionner sans réseau. |
| **Contexte : appareil** | Smartphone, utilisé debout, une main libre, éclairage néon ou plein soleil sur le parking. | Lecture et actions principales possibles d'une main, avec une lisibilité forte. |
| **Contexte : stockage** | Beaucoup de photos de produits s'accumulent dans le temps. | Les photos ne doivent pas saturer l'appareil. |

---

## 5. Liste brute des besoins (Phase B)

Les étoiles mesurent l'**importance** de chaque élément selon la grille d'importance, et non l'ordre d'apparition.

**Épicentre identifié** : la liste de ce qu'il faut acheter, avec pour chaque produit **sa photo** et **son nom exact**. Sans ces trois éléments, Necess n'est plus Necess, c'est la règle du sushi. Tout le reste est jugé par rapport à cet épicentre.

> **Avis honnête sur le « cœur » de l'analyse de départ** (« liste + photo + nom exact + prix + historique ») : le **prix** et l'**historique** sont importants, mais ils ne sont pas constitutifs.
> Une Necess sans prix reste une mémoire d'achat visuelle qui résout P1, P2 et P3. Une Necess sans photo, non. Le prix est donc noté ★★★★ et l'historique ★★★.

### 5.1 Ne rien oublier (P1)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B01 | Disposer d'une liste des produits à acheter maintenant | ★★★★★ | P1 | C'est l'épicentre : sans liste, l'oubli n'est pas traité. |
| B02 | Ajouter un produit à cette liste | ★★★★★ | P1 | Fonction de base de l'épicentre. |
| B03 | Marquer un produit comme acheté, et annuler ce marquage | ★★★★★ | P1, activité en magasin | C'est le geste central en magasin. |
| B04 | Voir d'un coup d'œil ce qui reste à acheter et combien de produits il manque | ★★★★ | P1 | Répond à « est-ce que j'ai tout ? » avant de passer en caisse. |
| B05 | Retirer un produit de la liste (devenu inutile) sans le supprimer de la mémoire | ★★★★ | P1, P5 | Le produit reste réutilisable pour une prochaine fois. |
| B06 | Indiquer une quantité à acheter (ex. 2 gels douche) | ★★★ | Activité | Besoin réel et fréquent, mais une quantité de 1 couvre la majorité des cas **[H]**. |
| B07 | Changer l'ordre des produits dans la liste | ★★ | Analyse initiale | Confort : il permet de suivre le parcours du magasin, mais la liste reste utilisable sans. |
| B08 | Vider en une fois les produits déjà achetés une fois la sortie terminée | ★★★ | Après achat | Évite une liste encombrée à la sortie suivante. |

### 5.2 Identifier le bon produit (P2)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B10 | Photo du produit | ★★★★★ | P2, mémoire visuelle | Épicentre : c'est la référence de reconnaissance. |
| B11 | Nom exact du produit, y compris la variante (ex. « Eau de toilette Intense ») | ★★★★★ | P2 | Épicentre : distingue des variantes proches. |
| B12 | Marque | ★★★★ | P2 | C'est le premier repère en rayon, qui y est classé par marque. |
| B13 | Contenance ou format (250 ml, 100 ml, 50 g…) | ★★★★ | P2 | Source de confusion majeure entre produits identiques par ailleurs. |
| B14 | Note distinctive libre (ex. « bouchon doré, pas la version bleue ») | ★★★★ | P2, frustration | Capte ce que ni le nom ni la photo ne disent clairement. Elle coûte peu et rapporte beaucoup. |
| B15 | Type ou catégorie de produit (parfum, gel douche, exfoliant, déodorant…) | ★★★ | P3 | Sert surtout à retrouver et à trier ; elle identifie peu. |
| B16 | Pouvoir voir la photo en grand et en détail | ★★★★ | P2, mauvaise vue, néon | L'étiquette se lit dans les détails. |
| B17 | Prendre la photo directement ou la choisir parmi des photos existantes | ★★★★ | Contenu disponible | La photo est prise en magasin ou retrouvée dans la galerie. |
| B18 | Plusieurs photos par produit (face, dos, étiquette) | ★★ | P2 | Confort : une photo bien prise suffit le plus souvent. |
| B19 | Rayon ou magasin habituel où trouver le produit | ★★ | P3 | Aide, mais reste contournable. |

### 5.3 Aller vite en magasin (P3)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B20 | Voir pour chaque produit de la liste, sans action supplémentaire, sa photo et son nom exact | ★★★★★ | P2, P3 | La reconnaissance doit être immédiate : c'est le moment de vérité de l'épicentre. |
| B21 | Utiliser la liste en magasin sans connexion réseau | ★★★★ | Contexte réseau | Une liste inaccessible en rayon équivaut à pas de liste. |
| B22 | Réaliser les actions du magasin (consulter, marquer acheté) d'une seule main | ★★★★ | Contexte appareil | Le persona tient un panier dans l'autre main. |
| B23 | Lisibilité forte, y compris sous néon, en plein soleil et avec des tailles de texte agrandies | ★★★★ | Situations limitantes | Une liste illisible en rayon fait échouer P3. |
| B24 | L'état acheté / à acheter ne doit jamais être porté par la couleur seule | ★★★★ | Accessibilité | Il doit rester perceptible en cas de daltonisme ou d'éclairage trompeur. |
| B25 | Annuler immédiatement une action faite par erreur (marquage ou retrait) | ★★★★ | Une main, précipitation | Les erreurs de manipulation sont fréquentes debout dans un rayon. |
| B26 | Accéder directement à la liste en cours au lancement de l'appli | ★★★★ | P3 | En magasin, chaque seconde compte. |

### 5.4 Le prix (P4)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B30 | Prix habituel du produit | ★★★★ | P4 | C'est la référence de décision. |
| B31 | Noter le prix vu en magasin | ★★★ | P4 | Permet la comparaison et alimente la mémoire du prix. |
| B32 | Voir l'écart entre le prix habituel et le prix vu (plus cher, moins cher, de combien) | ★★★ | P4 | C'est ce qui rend le prix utile à la décision. |
| B33 | Date du dernier prix connu | ★★★ | P4 | Un prix vieux d'un an n'est plus fiable. |
| B34 | Magasin associé à un prix | ★★ | P4 | Les prix varient selon l'enseigne, mais c'est un confort pour un usage personnel. |
| B35 | Marquer un produit « prix à vérifier » | ★ | Analyse initiale | Redondant avec un prix absent ou ancien (B33), voir 6. |

### 5.5 Préparer à l'avance et compléter plus tard (P5, contenu disponible)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B40 | Créer un produit avec le seul nom (ou la seule photo), tout le reste étant facultatif | ★★★★★ | P5, « pas de formulaires longs » | Si l'ajout est lent, la liste n'est pas tenue et l'épicentre meurt. |
| B41 | Compléter une fiche au fil du temps (photo, prix, contenance…) | ★★★★ | Contenu disponible | On a rarement toutes les infos d'un coup. |
| B42 | Savoir quelles fiches sont incomplètes et ce qui manque (photo, prix…) | ★★★ | Préparation | Permet de profiter d'un passage en magasin pour compléter. |
| B43 | Ajouter et compléter un produit depuis le magasin, au moment où on l'a en main | ★★★★ | Activité | C'est le meilleur moment pour prendre la photo et noter le prix. |

### 5.6 Mémoire des produits récurrents (P5)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B50 | Mémoire permanente de tous les produits déjà enregistrés, qu'ils soient dans la liste ou non | ★★★★ | P5 | Sans elle, on ressaisit tout à chaque fois. |
| B51 | Remettre un produit connu dans la liste en une action | ★★★★ | P5 | C'est le gain de temps principal à long terme. |
| B52 | Historique des achats par produit (dates, et prix payé si connu) | ★★★ | P4, P5 | Utile, mais le produit reste utilisable sans. |
| B53 | Enregistrement automatique dans l'historique au moment du marquage « acheté » | ★★★ | « Pas de saisie en plus » | Un historique manuel ne serait jamais tenu. |
| B54 | Mettre à jour le prix habituel au moment de l'achat | ★★★ | P4 | Garde la mémoire du prix à jour sans effort dédié. |
| B55 | Fréquence d'achat estimée à partir de l'historique (« environ toutes les 3 semaines ») | ★★ | Analyse initiale | C'est un confort, calculé sans saisie. |
| B56 | Supprimer définitivement un produit de la mémoire, distinctement du simple retrait de la liste | ★★★ | Gestion | Évite les suppressions accidentelles de fiches complètes. |

### 5.7 Retrouver un produit (P3, P5)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B60 | Recherche par nom, marque ou catégorie dans la mémoire des produits | ★★★★ | P3, P5 | Devient indispensable dès quelques dizaines de produits. |
| B61 | Recherche tolérante aux accents, à la casse et aux fautes légères | ★★★ | Une main, vitesse | La saisie en marchant est imprécise. |
| B62 | Proposer les produits connus pendant la saisie d'un nouveau produit | ★★★★ | P5 | Évite les doublons et la ressaisie. |
| B63 | Filtrer par catégorie | ★★ | Analyse initiale | Confort : la recherche couvre déjà le besoin. |
| B64 | Trier par fréquence d'achat ou par dernier achat | ★★ | Analyse initiale | Confort : fait remonter les habituels. |

### 5.8 Ne pas perdre l'information (P6)

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B70 | Sauvegarde automatique de chaque modification, sans action de l'utilisateur | ★★★★ | P6 | Une perte de données suffit à faire abandonner l'outil. |
| B71 | Stockage fiable sur l'appareil, indépendant du réseau | ★★★★ | P6, contexte réseau | Va de pair avec B21. |
| B72 | Être prévenu si une photo n'a pas pu être enregistrée, et pouvoir réessayer | ★★★★ | P6 | Une photo perdue en silence fait échouer P2. |
| B73 | Exporter et réimporter toutes ses données (produits, photos, historique) | ★★★ | P6, changement de téléphone | C'est la seule protection contre la perte de l'appareil sans service en ligne. |
| B74 | Les photos ne saturent pas l'espace du téléphone | ★★★ | Contexte stockage | Elles sont réduites à une taille suffisante pour reconnaître le produit. |

### 5.9 Situations limitantes, besoins transverses

| ID | Besoin / information / fonction | Importance | Source | Justification |
|---|---|---|---|---|
| B80 | Chaque photo a une description textuelle (par défaut, le nom et la marque du produit) | ★★★ | Lecteur d'écran | Le produit reste identifiable sans voir l'image. |
| B81 | Un produit sans photo reste identifiable par son nom, sa marque et sa contenance | ★★★★ | Fiches incomplètes | C'est le cas normal au début de la vie d'une fiche (B40). |
| B82 | Libellés explicites, sans jargon, avec le vocabulaire du persona | ★★★ | Aptitudes | Aucun apprentissage ne doit être nécessaire. |
| B83 | Les fonctions principales se comprennent sans tutoriel | ★★★ | Attitude « pas de temps à perdre » | |

---

## 6. Ce qui est volontairement exclu

| Élément | Décision | Raison (Rework) |
|---|---|---|
| **Statuts manuels** multiples (« incomplet », « en attente de photo », « en attente de prix », « prêt à acheter », « acheté ») | **Remplacés** | *Throw less at the problem* : seuls deux états sont réellement décidés par l'utilisateur, « dans la liste / à acheter » et « acheté ». L'incomplétude se **déduit** des champs manquants (B42) au lieu d'être saisie, ce qui fait une manipulation de moins. |
| Marqueur « prix à vérifier » (B35) | **Coupé** | Il est redondant : un prix absent ou ancien (B33) dit déjà qu'il faut vérifier. |
| Favoris | **Coupé** | La mémoire des produits (B50) et le tri par fréquence (B64) couvrent le même besoin. Un deuxième mécanisme dilue. |
| Plusieurs listes simultanées (par magasin, par occasion) | **Reporté** | *Say no by default* : une seule liste « à acheter maintenant » couvre l'usage décrit. Le besoin est à reconsidérer s'il revient réellement à l'usage. |
| Rappels ou notifications (« à racheter bientôt ») | **Reporté** | Ils dépendent d'un historique suffisant (B55) et ajoutent de la complexité. Ce n'est pas l'épicentre. |
| Scan de code-barres | **Reporté** | La photo plus le nom exact résolvent déjà P2. Le scan apporte surtout de la complexité et dépend de bases externes. |
| Synchronisation entre appareils, compte en ligne | **Reporté** | Usage personnel sur un appareil **[H]**. L'export (B73) couvre le risque de perte. Une synchro impliquerait des obligations légales et un compte. |
| Partage de liste avec un proche | **Reporté** | Il n'apparaît pas dans les besoins décrits ; c'est un autre persona. |
| Budget, total des dépenses, statistiques | **Coupé** | Hors problème : Necess aide à acheter le bon produit, pas à gérer un budget. |
| Comparaison de prix en ligne, catalogue produit importé | **Coupé** | C'est une copie de la concurrence, avec des dépendances externes et pas d'utilité pour la reconnaissance. |
| Plusieurs photos par produit (B18) | **Retenu en ★★**, à faire en dernier | *Build half a product* : il ne passe qu'une fois l'épicentre impeccable. |

---

## 7. Organisation en sections (Phase C)

Ces sections sont **déduites** des besoins ci-dessus. Il n'y a ni « Accueil », ni « Profil », ni « Paramètres », ni « À propos », car aucun besoin validé ne les exige. Les seuls réglages nécessaires (export / import) relèvent de la section 7.6.

Les noms de sections désignent des **regroupements fonctionnels**, pas des écrans : plusieurs sections peuvent se retrouver sur une même vue, ou une section se répartir sur plusieurs.

### 7.1 La liste en cours (« à acheter maintenant »)

*Sert les trois moments : préparer, acheter, clore la sortie. Besoins B01–B08, B20–B26.*

- La liste des produits à acheter (★★★★★)
  - Pour chaque produit, visibles sans action supplémentaire (★★★★★) :
    - sa photo, ou à défaut un repère textuel clair indiquant qu'il n'y en a pas (★★★★★ / ★★★★)
    - son nom exact (★★★★★)
    - sa marque (★★★★)
    - sa contenance (★★★★)
    - la quantité à acheter si elle est supérieure à 1 (★★★)
    - le prix habituel s'il est connu (★★★)
    - son état : à acheter ou acheté, perceptible autrement que par la couleur (★★★★★ / ★★★★)
  - Le nombre de produits restant à acheter sur le total (★★★★)
  - Le fait que la liste soit vide doit être explicite, avec une indication claire de comment ajouter un produit (★★★)
- Ajouter un produit à la liste (★★★★★)
  - En tapant un nom : les produits connus correspondants sont proposés (★★★★) ; sinon, un nouveau produit est créé avec ce seul nom (★★★★★)
  - Depuis la mémoire des produits (voir 7.3) (★★★★)
  - Avec seulement une photo, le nom pouvant venir plus tard (★★★)
  - Si le produit est déjà dans la liste : le signaler au lieu de créer un doublon (★★★)
- Marquer un produit comme acheté, et annuler ce marquage (★★★★★)
  - Faisable d'une main, en une action (★★★★)
  - Possibilité de noter le prix payé au même moment, sans y être obligé (★★★)
  - Enregistrement automatique de l'achat dans l'historique, avec la date (★★★)
  - Annulation immédiate possible en cas d'erreur (★★★★)
- Retirer un produit de la liste sans le supprimer de la mémoire (★★★★)
  - Annulation immédiate possible (★★★★)
- Modifier la quantité (★★★)
- Changer l'ordre des produits (★★)
- Clore la sortie : retirer en une fois tous les produits achetés, qui restent dans la mémoire et l'historique (★★★)
- Ouverture directe sur cette liste au lancement de l'appli (★★★★)
- Disponible intégralement sans réseau (★★★★)

### 7.2 La fiche produit (l'identité du produit)

*C'est la référence de reconnaissance. Besoins B10–B19, B30–B34, B40–B43, B52, B55, B56, B80, B81.*

- **Identité** :
  - Nom exact, variante comprise (★★★★★), seul champ requis s'il n'y a pas de photo
  - Photo principale (★★★★★), seule information requise s'il n'y a pas de nom
    - Prise directement ou choisie parmi les photos existantes (★★★★)
    - Consultable en grand et en détail, jusqu'à l'étiquette (★★★★)
    - Remplaçable (★★★)
    - Description textuelle, par défaut le nom et la marque (★★★)
    - Photos supplémentaires : dos, étiquette (★★)
  - Marque (★★★★)
  - Contenance ou format, avec son unité (ml, g, unités…) (★★★★)
  - Note distinctive libre (★★★★)
  - Catégorie, choisie parmi celles déjà utilisées ou nouvelle (★★★)
  - Rayon ou magasin habituel (★★)
- **Prix** (voir 7.4 pour le détail) :
  - Prix habituel (★★★★)
  - Dernier prix vu, avec sa date (★★★)
- **Complétude** :
  - Ce qui manque à la fiche (photo, prix, contenance, marque) est signalé et déduit automatiquement, sans statut à saisir (★★★)
- **Mémoire de ce produit** :
  - S'il est actuellement dans la liste ou non (★★★★)
  - L'ajouter à la liste ou l'en retirer d'ici (★★★★)
  - Date du dernier achat (★★★)
  - Historique de ses achats : dates et prix payés (★★★)
  - Fréquence d'achat estimée, affichée seulement à partir de quelques achats (★★)
- **Modification et suppression** :
  - Chaque information est modifiable à tout moment, depuis chez soi ou en magasin (★★★★)
  - Enregistrement automatique de chaque modification (★★★★)
  - Suppression définitive de la fiche, clairement distincte du retrait de la liste, avec confirmation, car elle détruit historique et photos (★★★)

### 7.3 La mémoire des produits

*Évite la ressaisie. Besoins B50, B51, B56, B60–B64.*

- L'ensemble des produits déjà enregistrés, qu'ils soient dans la liste ou non (★★★★)
  - Pour chacun : photo, nom exact, marque, contenance (★★★★)
  - S'il est déjà dans la liste en cours (★★★★)
  - Si sa fiche est incomplète (★★)
- Remettre un produit dans la liste en une action (★★★★)
- Recherche (★★★★)
  - Par nom, marque ou catégorie (★★★★)
  - Tolérante aux accents, à la casse et aux fautes légères (★★★)
  - Résultat explicite quand rien ne correspond, avec la possibilité de créer ce produit (★★★)
- Filtrer par catégorie (★★)
- Trier par fréquence d'achat ou par dernier achat (★★)
- Accès à la fiche de chaque produit (★★★★)

### 7.4 La mémoire du prix

*Aide à décider en rayon. Besoins B30–B34, B54. Cette section est transverse : ses éléments vivent dans la fiche produit (7.2) et au moment de l'achat (7.1).*

- Prix habituel (★★★★)
  - Saisi manuellement ou mis à jour à partir du dernier prix payé (★★★)
  - Devise implicite, sans saisie (★★)
- Prix vu en magasin (★★★)
  - Saisie rapide, possible au moment de l'achat (★★★)
  - Date, enregistrée automatiquement (★★★)
  - Magasin (★★)
- Écart entre le prix vu et le prix habituel (★★★)
  - Sens de l'écart (plus cher, moins cher, identique) et montant, perceptibles autrement que par la couleur (★★★)
- Ancienneté du prix connu : un prix ancien est signalé comme tel (★★★)
- Absence de prix : clairement distinguée d'un prix à zéro (★★★)

### 7.5 Les fiches à compléter

*Exploite les passages en magasin pour compléter. Besoins B41–B43. Il ne s'agit pas d'un statut manuel : c'est une vue déduite.*

- Les produits dont il manque une information importante (photo, prix, contenance, marque) (★★★)
  - Pour chacun, ce qui manque précisément (★★★)
- Compléter directement l'information manquante, notamment la photo en magasin (★★★)

> Cette section pourrait se fondre dans la mémoire des produits (7.3), sous forme de critère de tri ou de filtre. Ce choix d'organisation revient à la conception (voir 8, « Questions ouvertes »).

### 7.6 La sécurité des données

*Garantit qu'on ne perd rien. Besoins B70–B74. Ce sont surtout des exigences invisibles, plus quelques fonctions explicites.*

- **Exigences invisibles** :
  - Chaque modification est enregistrée automatiquement, sans action de l'utilisateur (★★★★)
  - Toutes les données sont stockées sur l'appareil et disponibles sans réseau (★★★★)
  - Les photos sont réduites à une taille suffisante pour reconnaître le produit, sans saturer l'appareil (★★★)
- **Fonctions explicites** :
  - Être prévenu de l'échec d'enregistrement d'une photo, avec possibilité de réessayer (★★★★)
  - Exporter toutes les données (produits, photos, historique) dans un fichier conservable ailleurs (★★★)
  - Réimporter ce fichier, par exemple sur un nouveau téléphone (★★★)
    - Prévenir avant d'écraser des données existantes (★★★)

### 7.7 Exigences transverses (toutes sections)

- Actions du magasin réalisables d'une main (★★★★)
- Lisibilité sous néon, en plein soleil et avec un texte agrandi par le système (★★★★)
- Aucun état porté par la couleur seule (★★★★)
- Annulation immédiate des actions destructrices ou fréquentes (★★★★)
- Vocabulaire du persona, sans jargon (★★★)
- Compréhension sans tutoriel (★★★)
- Produit identifiable même sans photo, grâce à son nom, sa marque et sa contenance (★★★★)

---

## 8. Pour la suite

### Les besoins ★★★★★ à rendre évidents au premier regard

1. **La liste de ce qu'il faut acheter maintenant** (B01).
2. **La photo de chaque produit**, visible sans action supplémentaire (B10, B20).
3. **Le nom exact**, variante comprise (B11).
4. **Marquer acheté / à acheter** en un geste (B03).
5. **Ajouter un produit avec un seul nom ou une seule photo** (B40).

### Les mots du persona

Vocabulaire repris de l'analyse de départ, à privilégier dans les libellés et la voix :
- « à acheter », « acheté », « ce qui manque », « racheter »
- « le bon produit », « exactement ce parfum-là », « nom exact »
- « prix habituel », « prix vu en magasin », « trop cher »
- « contenance » (250 ml, 100 ml, 50 g), « format »
- « en magasin », « avant de sortir », « préparer la liste »
- Catégories citées : parfum, gel douche, exfoliant, déodorant

Ton implicite : direct, utilitaire, sans fioritures (« gagner du temps, pas en perdre »).

### Questions ouvertes

**Hypothèses à confirmer** :
- **[H1]** Usage strictement personnel, sur un seul téléphone. Si c'est faux, il faut revoir la pertinence (section 2), le légal (section 4) et la synchronisation (section 6).
- **[H2]** Périmètre principal : produits d'hygiène et de beauté. Si l'alimentaire entre dans le périmètre, la quantité (B06) et le tri par rayon (B07) prennent plus de poids.
- **[H3]** Une sortie compte quelques produits à une dizaine. Avec beaucoup plus, la recherche dans la liste devient nécessaire.
- **[H4]** Quantité de 1 dans la majorité des cas.

**À trancher par la conception** :
- La liste en cours et la mémoire des produits sont-elles deux espaces distincts ou un seul espace avec deux vues ?
- Les fiches à compléter (7.5) forment-elles un espace dédié ou un tri ou filtre de la mémoire (7.3) ?
- Que deviennent les produits achetés pendant la sortie en cours : restent-ils visibles jusqu'à la clôture, ou sont-ils écartés aussitôt ?
- Où saisir le prix vu en magasin : au moment du marquage « acheté », sur la fiche, ou les deux ?
- Format technique (application installée ou application web utilisable hors ligne) : il conditionne B21, B71 et B73.

---

## Note

Ce document ne couvre pas l'architecture de l'information ni le choix des composants d'interface.

Les étoiles indiquent l'**importance / la priorité** de chaque élément, **pas l'ordre dans lequel il doit apparaître**. L'organisation visuelle (ordre, hiérarchie, mise en avant) revient à l'étape suivante : direction artistique, puis design (par exemple les skills `direction-artistique` et `material-design`), ou le développeur.
