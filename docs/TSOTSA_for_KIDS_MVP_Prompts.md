# TSOTSA Kids – MVP Nutrition infantile
## Feuille de route et prompts (Claude, Antigravity, Lovable)

Auteur : Eric Papain MEZATIO (IT4WORK), Tech Lead et validateur final
Version 1.1, 5 novembre 2026 (base aliments constituée à la main, mobile Expo, marque TSOTSA Kids)

---

## 0. Comment utiliser ce document

Tu suis les étapes **dans l'ordre**. Chaque étape indique :

| Repère | Signification |
|---|---|
| 🧠 **CLAUDE** | À coller dans la conversation Claude qui contient les documents TSOTSA Kids |
| 🛠️ **ANTIGRAVITY** | À coller dans ton IDE Antigravity, dans le dossier indiqué |
| 💜 **LOVABLE** | À coller dans Lovable (front web et mobile) |
| ✅ **VALIDATION** | C'est toi qui valides. On ne passe pas à l'étape suivante sans ton « OK » |
| 📍 **OÙ TU ES** | L'outil, le dossier et l'état du projet au moment de l'étape |

**Règle d'or du projet : aucune donnée inventée (pas de données « mockées »).**
Toutes les données affichées dans l'application viennent :
- de l'API tsotsa / ORKG (aliments locaux, compositions) ;
- de sources officielles citées, saisies par un administrateur (exemple : composition du F-75 d'après les spécifications OMS / UNICEF) ;
- ou des utilisateurs eux-mêmes (patients, mesures, produits ajoutés).

Les données de test sont autorisées **uniquement** dans les dossiers de tests. Elles sont listées à la fin du projet (étape 9).

---

## 1. Ce que j'ai compris du besoin (à valider ✅)

### 1.1 Le produit
- **Une plateforme, deux interfaces** : une application **mobile** (prioritaire) et une application **web**.
- **Trois modules visibles** : Nutrition infantile, HTA, Diabète. **Seul le module Nutrition est actif** ; HTA et Diabète apparaissent avec la mention « bientôt disponible ». L'architecture doit permettre de les ajouter sans tout refaire.
- **Écran principal du module Nutrition** :
  - **À gauche (zone principale)** : un menu déroulant des produits de référence : F-75, F-100, Plumpy'Nut, Plumpy'Sup, etc.
  - **Au clic sur un produit** : sa composition nutritionnelle (par 100 g) et un petit encart sur son coût.
  - **À droite** : la liste des **aliments locaux équivalents**, classés.
- **Source des aliments locaux** : les tables de comparaison ORKG. Les API (ORKG, tsotsa) ne sont pas assez fiables : **nous extrayons les données à la main et constituons notre propre base**. Les fruits et spécialités locales sont inclus, sans limite de catégorie.
- **Ajout d'un produit personnalisé** : l'utilisateur saisit un produit (exemple : un fortifiant pour bébé) avec sa composition en grammes par nutriment. Les équivalents locaux s'affichent à côté.
- **Filtre par région** : l'utilisateur choisit sa région. Les aliments disponibles dans cette région sont classés en premier, ou seuls affichés.
- **Trois espaces bien séparés :**
  - **Espace utilisateur, ouvert à tout le monde** (mobile d'abord, puis web) : **n'importe qui peut s'inscrire**, pas seulement pour un enfant. Un compte peut suivre une ou plusieurs **personnes** : lui-même, un enfant, un parent âgé, un proche. Chaque personne suivie est identifiée avec ses paramètres de santé, adaptés à son âge : pour un enfant, âge, sexe, poids, taille et périmètre brachial ; pour un adulte, poids, taille, IMC, puis tension et glycémie avec les modules HTA et Diabète. C'est **l'utilisateur qui choisit** le produit (F-75, F-100, Plumpy'Nut, Plumpy'Sup, ou un aliment local équivalent), pour **une personne précise**, et qui **confirme chaque prise** (produit, quantité, date et heure). Il peut aussi ajouter son propre produit. Il ne gère rien d'autre.
  - **Connexion, au choix** : **Google** (un geste), **téléphone + code SMS**, ou **adresse e-mail + mot de passe** (empreinte bcrypt, jamais stocké en clair). Un seul compte pour toute la famille : les membres ajoutés n'ont **pas besoin de compte**, ils sont rattachés au compte du parent et visibles dans le dossier médical côté soignant. L'administration peut aussi **créer des comptes directement** et envoyer une invitation. Les comptes **soignants** sont aussi ouverts à l'inscription, mais ils ne voient aucune donnée de santé tant que notre équipe n'a pas vérifié leur identité professionnelle.
  - **Espace soignant** (web, tableau de bord) : le soignant voit **chaque personne suivie** (enfant ou adulte) et **chaque prise** confirmée par l'utilisateur. À chaque évaluation, il saisit les mesures (poids, taille, périmètre brachial, œdèmes). Il suit les **courbes** (z-scores OMS pour les enfants, IMC et autres indicateurs pour les adultes) au fil des évaluations, et reçoit des **alertes** : prises manquées, perte de poids, absence d'évaluation.
  - **Espace d'administration** (web, réservé à notre équipe) : suivi de tous les comptes (utilisateurs, soignants, personnes suivies). On y fait aussi la maintenance et l'ajout des données (produits de référence, aliments, prix, régions, imports ORKG), la vérification des produits ajoutés par les utilisateurs, et la gestion des comptes et des modules.
- **Le cycle de suivi** : inscription de la personne → choix du produit → prise confirmée par l'utilisateur → visible chez le soignant → évaluation → courbes et alertes → ajustement par le soignant.
- **Rappels et notifications** :
  - le soignant définit un **plan de prises** (heures, produit, quantité, durée) ;
  - à **chaque heure prévue**, l'utilisateur reçoit un rappel sur son téléphone (même verrouillé), avec des réponses directes : « C'est donné », « Plus tard », « Pas donné » ;
  - le **soignant associé** reçoit aussi le rappel s'il l'a activé, et il est notifié **à chaque prise confirmée** ;
  - sans confirmation après un délai (30 minutes par défaut), l'utilisateur est relancé et le soignant reçoit une alerte « prise non confirmée » ;
  - **tout s'active et se désactive** : par type de notification, par personne suivie et par canal (téléphone, SMS, web, e-mail), avec des heures calmes. Si un utilisateur coupe les rappels, le soignant en est informé ;
  - **sans réseau**, les rappels sont aussi programmés dans le téléphone (notifications locales) ;
  - l'administration gère les canaux (Firebase Cloud Messaging pour les notifications, un agrégateur SMS, l'e-mail), les modèles de messages et les règles par défaut.
- **Des interfaces utilisateur très simples** :
  - une seule action principale par écran, et 3 touches au maximum pour obtenir un équivalent ;
  - de gros boutons, des icônes et des photos d'aliments, peu de texte, des phrases courtes ;
  - pas de jargon : « protéines », pas « apport protidique » ; les détails techniques sont repliés derrière un bouton « en savoir plus » ;
  - lisible pour une personne peu habituée au numérique, sur un petit téléphone Android.

  Toute la complexité (données, règles, calculs) reste dans l'espace d'administration et dans le serveur.
- **Plus tard** : un modèle mathématique (optimisation) calculera les quantités. Le MVP prépare sa place sans l'implémenter.

### 1.2 La règle de classement des équivalents (cœur du MVP)

Soit **N** l'ensemble des nutriments « essentiels » du produit de référence (exemple : 3 nutriments pour le F-75). Pour chaque aliment local :

- `m` = nombre de nutriments de N présents dans l'aliment ;
- `e` = nombre de nutriments présents dans l'aliment **en plus** de ceux de N.

Ordre de classement :
1. **`m` décroissant** : un aliment qui contient les 3 nutriments passe avant un aliment qui n'en contient que 2.
2. **À `m` égal, `e` croissant** : un aliment qui contient exactement les 3 passe avant un aliment qui contient les 3 plus un 4ᵉ.
3. **À égalité, la proximité des teneurs (grammes)** : la distance entre les quantités de l'aliment et celles du produit, sur les nutriments de N.
4. **Filtre région** : les aliments disponibles dans la région choisie d'abord, ou seuls si le filtre strict est activé.

Le MVP affiche l'équivalence **en nutriments**, pas encore en quantité. Le grammage de chaque nutriment est affiché à côté.

### 1.3 Cinq points à trancher (✅ décisions à prendre avant le développement)

| # | Question | Pourquoi c'est important | Ma proposition |
|---|---|---|---|
| D1 | **À partir de quelle teneur un aliment « contient » un nutriment ?** | Presque tous les aliments contiennent un peu de protéines ou de fer. Sans seuil, tout le monde a `m = 3` et le classement ne veut plus rien dire. | Seuil réglable par nutriment. Par défaut, l'aliment « contient » le nutriment si sa teneur pour 100 g atteint au moins X % de celle du produit de référence (X à fixer avec Pr Nguefack, par exemple 10 %). |
| D2 | **Qui choisit les nutriments essentiels de chaque produit ?** | Le résultat en dépend entièrement. | L'équipe scientifique les fixe par produit. L'utilisateur peut les modifier pour sa recherche. |
| D3 | **D'où viennent les prix ?** | Données inventées interdites. | Saisie par l'administrateur, par région, avec la date et la source (relevé de marché). Si aucun prix n'existe, afficher « prix non renseigné ». |
| D4 | **Message médical** | Le F-75 et le F-100 sont des produits thérapeutiques prescrits. Un « équivalent local » pourrait être pris pour un remplacement du traitement. | Mention permanente : « Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit. Toute utilisation clinique doit être validée par un professionnel de santé. » |
| D5 | **Produits ajoutés par les utilisateurs** : privés, ou visibles par tous ? | Une composition mal saisie peut tromper d'autres utilisateurs. | L'utilisateur voit tout de suite les équivalents de son produit. Le produit reste privé tant que notre équipe ne l'a pas vérifié depuis l'espace d'administration. Une fois vérifié, il devient visible par tous. |

### 1.4 Différences avec l'architecture des présentations (✅ à valider)

Les présentations proposaient une architecture cible lourde : Spring Boot, PostgreSQL, Flutter, Kubernetes. Pour un MVP rapide hébergé chez OVH avec MySQL, Lovable et Antigravity, je propose une version allégée qui garde les mêmes principes (modules séparés, traçabilité des sources, mobile).

| Brique | Présentations (cible) | **MVP proposé** | Pourquoi |
|---|---|---|---|
| Backend | Spring Boot (Java) | **FastAPI (Python)**, monolithe modulaire | Plus léger. Même langage que le futur modèle d'optimisation (Pyomo, HiGHS). Bien maîtrisé par Antigravity. |
| Base | PostgreSQL | **MySQL 8 managé OVH** | Choix imposé. Pas d'isolation par ligne (RLS) : le filtrage par organisation se fait dans le code. |
| Web | React + TypeScript | **React + TypeScript généré par Lovable** | C'est ce que Lovable produit. |
| Mobile | Flutter | **Expo (React Native + TypeScript)**, généré avec Claude Code, Cursor ou Antigravity | Vraie application Android (puis iPhone), avec rappels programmés qui sonnent même hors ligne et boutons d'action sur l'écran verrouillé (`expo-notifications`). Même langage, mêmes icônes et même client d'API que le web. Lovable ne produit pas d'application native. |
| Infrastructure | Kubernetes | **Un serveur OVH (VPS ou Public Cloud) + Docker + Nginx** | Suffisant pour un pilote de 10 à 100 patients. |

---

## 2. Données ORKG : nous constituons notre propre base

Les API (ORKG, api.tsotsa.org) ne fonctionnent pas toujours. **L'application ne dépend donc d'aucune API externe.** L'équipe extrait les données à la main et les saisit dans une base que nous maîtrisons.

1. **Extraction** : pour chaque comparaison ORKG utile, utiliser l'export CSV de l'interface ORKG, ou recopier les valeurs depuis l'écran de la comparaison.
2. **Gabarit TSOTSA** : un tableur unique, une ligne par aliment et par nutriment, avec les colonnes suivantes :
   - `aliment`, `nom_local`, `categorie` ;
   - `nutriment`, `valeur`, `unite`, `base` (100 g) ;
   - `etat` (cru, cuit, séché…) ;
   - `region`, `pays` ;
   - `orkg_comparaison` (R…), `orkg_contribution`, `article_reference`, `doi` ;
   - `saisi_par`, `date_saisie`, `remarque`.
3. **Import** depuis l'écran d'administration « Base aliments », par lot. Contrôles automatiques : nutriment reconnu (dictionnaire de synonymes), unité convertible, valeur dans des limites plausibles, doublons, source renseignée.
4. **Double validation** : une seconde personne (Fidel ou l'équipe scientifique) relit le lot avant sa publication. Seules les données validées sont visibles par les utilisateurs.
5. **Traçabilité** : chaque valeur garde l'identifiant ORKG, la référence de l'article, la personne qui l'a saisie et la date. Une correction crée une nouvelle version : rien n'est écrasé.
6. **Mise à jour** : nouveau lot quand une comparaison ORKG évolue ou qu'un article est ajouté.

**Ce dont j'ai besoin de ta part** :
- la liste des comparaisons ORKG à extraire (identifiants R…) ;
- une comparaison exportée en CSV, pour caler le gabarit sur la forme réelle des données.

---

## 3. 🛠️ ANTIGRAVITY – Étape 0 : gabarit et base aliments (à faire EN PREMIER)

📍 **OÙ TU ES** : Antigravity, nouveau dossier vide `tsotsa-kids/`. Joins un ou deux exports CSV de comparaisons ORKG.
🎯 **Objectif** : fixer la forme de notre base aliments et l'outil de saisie, avant tout le reste.

```text
Tu es un ingénieur data senior. Projet : TSOTSA Kids, plateforme de nutrition infantile.
Les API ORKG ne sont pas fiables : nous constituons NOTRE PROPRE base d'aliments locaux,
extraite à la main des comparaisons ORKG (exports CSV joints).

Tâche (pas encore d'application) :
1. Analyse les CSV joints : colonnes, nutriments rencontrés (toutes orthographes), unités,
   base de calcul (100 g ou autre), régions, références d'articles. Rapport dans
   docs/data/analyse-exports-orkg.md, avec la liste des problèmes (valeurs manquantes,
   unités incohérentes, texte à la place de nombres).
2. Propose le gabarit de saisie docs/data/gabarit_base_aliments.xlsx : une ligne par aliment et
   par nutriment ; colonnes aliment, nom_local, categorie, etat, nutriment, valeur, unite, base,
   region, pays, orkg_comparaison, orkg_contribution, article_reference, doi, saisi_par,
   date_saisie, remarque ; listes déroulantes pour nutriment, unité, catégorie, région ;
   une feuille « Mode d'emploi ».
3. Propose le dictionnaire des nutriments (docs/data/dictionnaire_nutriments.csv) : nom canonique,
   synonymes, unité de référence, facteurs de conversion, limites plausibles pour 100 g.
4. Écris un script Python autonome scripts/convertir_export_orkg.py (max 200 lignes) qui transforme
   un export CSV ORKG en lignes du gabarit, en signalant tout ce qu'il ne sait pas convertir.
5. Termine par « Questions pour Fidel ».
Interdit : inventer des valeurs ou compléter des données manquantes.
```

✅ **VALIDATION** : tu relis le gabarit et le dictionnaire avec Fidel. Tu fais saisir un premier lot réel de 20 à 50 aliments. Tu fournis ensuite le gabarit et le dictionnaire à Claude (étape 4).

---

## 4. 🧠 CLAUDE – Prompt de contexte (à coller une seule fois, en premier)

📍 **OÙ TU ES** : la conversation Claude où se trouvent les présentations TSOTSA Kids. Joins le gabarit, le dictionnaire des nutriments et le premier lot saisi (étape 3).

```text
Contexte : tu as produit les présentations du projet (fichiers intitulés « TW Wave » :
STRATEGIC et TECHNICAL_ARCHITECTURE). Le projet s'appelle désormais TSOTSA Kids :
utilise uniquement ce nom dans tout ce que tu produis.
Nous lançons maintenant le développement du MVP. Je suis Eric Papain MEZATIO, Tech Lead et
validateur final. Lis attentivement ce cahier des charges ; il servira pour toutes mes
demandes suivantes.

PRODUIT
- Une plateforme, deux interfaces : mobile (prioritaire) et web.
- Trois modules affichés : Nutrition infantile (ACTIF), HTA et Diabète (« bientôt disponible »,
  non cliquables). L'architecture doit accueillir de nouveaux modules sans refonte.
- Écran principal Nutrition : à gauche, un menu déroulant des produits de référence (F-75,
  F-100, Plumpy'Nut, Plumpy'Sup…). Au clic sur un produit : composition nutritionnelle pour
  100 g et petit encart coût. À droite : les aliments locaux équivalents, classés.
- Les aliments locaux viennent de NOTRE base aliments, extraite à la main des comparaisons ORKG
  (les API ne sont pas fiables) : gabarit et dictionnaire joints, import par lots depuis
  l'administration, double validation. Fruits et spécialités locales inclus.
- L'utilisateur peut enregistrer un produit personnalisé (exemple : un fortifiant bébé) avec sa
  composition en grammes par nutriment, et voir immédiatement ses équivalents locaux.
- Filtre par région : les aliments disponibles dans la région choisie sont classés en premier,
  ou seuls affichés en mode strict.
- TROIS ESPACES SÉPARÉS :
  1) ESPACE UTILISATEUR, OUVERT À TOUT LE MONDE (mobile d'abord, puis web) : n'importe qui peut
     s'inscrire, avec Google, téléphone + code SMS, ou e-mail + mot de passe (empreinte bcrypt).
     Un compte suit une ou plusieurs PERSONNES (lui-même, un enfant, un proche) qui n'ont PAS
     besoin de compte : elles sont rattachées au compte et visibles côté soignant. Chaque personne suivie est
     identifiée avec des paramètres de santé adaptés à son âge (enfant : âge, sexe, poids,
     taille, périmètre brachial ; adulte : poids, taille, IMC, puis tension et glycémie avec
     les modules HTA et Diabète). L'utilisateur choisit le produit (F-75, F-100, Plumpy'Nut,
     Plumpy'Sup, ou un aliment local équivalent) pour UNE personne précise et CONFIRME chaque
     prise (produit, quantité, date, heure). Il peut ajouter ses propres produits.
     Inscription des soignants ouverte, mais aucun accès aux données de santé avant
     vérification de leur identité professionnelle par notre équipe.
     L'administration peut aussi créer des comptes directement (avec invitation).
  2) ESPACE SOIGNANT (web, tableau de bord de suivi, comme dans les présentations) : liste de
     toutes les personnes suivies (enfants et adultes) ; prises confirmées par les utilisateurs ; saisie des mesures à chaque
     évaluation (poids, taille, périmètre brachial, œdèmes) ; courbes de croissance (z-scores
     calculés avec les tables OMS officielles) au fil des évaluations ; alertes (prises
     manquées, perte de poids, absence d'évaluation) ; dossier complet de chaque personne suivie ; courbes adaptées à l'âge (z-scores OMS pour les enfants, IMC pour les adultes).
  3) ESPACE D'ADMINISTRATION (web, réservé à notre équipe) : suivi de tous les comptes
     (utilisateurs, soignants, personnes suivies) ; maintenance et ajout des données (produits de référence,
     aliments, prix, régions, imports ORKG) ; vérification des produits ajoutés par les
     utilisateurs (privés jusqu'à vérification) ; gestion des comptes et des modules.
- CYCLE DE SUIVI : inscription de la personne → choix du produit → prise confirmée par l'utilisateur
  → visible chez le soignant → évaluation → courbes et alertes → ajustement par le soignant.
- RAPPELS ET NOTIFICATIONS : le soignant définit un plan de prises (heures, produit, quantité,
  durée). À chaque heure prévue : rappel à l'utilisateur (notification sur le téléphone, même
  verrouillé, avec réponses directes « C'est donné / Plus tard / Pas donné ») et, s'il l'a
  activé, au soignant associé. À chaque prise confirmée : notification au soignant. Sans
  confirmation après un délai (30 min par défaut) : relance de l'utilisateur et alerte
  « prise non confirmée » au soignant. Tout s'active et se désactive par type, par personne
  suivie et par canal (push, SMS, web, e-mail), avec heures calmes ; si un utilisateur coupe
  ses rappels, le soignant en est informé. Hors ligne : rappels aussi programmés en local sur
  le téléphone. Administration : canaux (Firebase Cloud Messaging, agrégateur SMS, e-mail),
  modèles de messages FR/EN, règles par défaut, journal des envois.
- SIMPLICITÉ DE L'ESPACE UTILISATEUR (exigence majeure) : une action principale par écran ;
  3 touches au maximum pour obtenir un équivalent ; gros boutons, icônes et photos d'aliments ;
  peu de texte, phrases courtes, sans jargon ; détails repliés derrière « en savoir plus » ;
  utilisable par une personne peu habituée au numérique, sur un petit téléphone Android.
  Toute la complexité reste dans l'espace d'administration et dans le serveur.
- Plus tard : un modèle d'optimisation calculera les quantités. Prévoir l'emplacement (module
  et interface), sans l'implémenter.

RÈGLE DE CLASSEMENT DES ÉQUIVALENTS
N = nutriments essentiels du produit de référence (choisis par l'équipe scientifique et
modifiables par l'utilisateur). Pour chaque aliment local : m = nombre de nutriments de N
présents ; e = nombre de nutriments présents en plus de N.
Tri : m décroissant ; puis e croissant ; puis distance des teneurs sur N ; puis
disponibilité dans la région.
« Présent » = teneur pour 100 g supérieure ou égale à un seuil configurable par nutriment
(par défaut : X % de la teneur du produit de référence ; X sera validé par la référente médicale).
Le MVP affiche l'équivalence en nutriments, avec le grammage de chaque nutriment, sans calculer
de quantité.

CONTRAINTES TECHNIQUES (décisions MVP)
- Backend : FastAPI (Python 3.12), monolithe modulaire (un dossier par module métier).
- Base : MySQL 8 managé chez OVH (utf8mb4, InnoDB) ; migrations Alembic ; ORM SQLAlchemy 2.
  MySQL n'a pas de Row-Level Security : l'isolation par organisation se fait dans la couche
  dépôt (repository).
- Front web : React + TypeScript + Tailwind, généré avec Lovable (dépôt GitHub séparé).
  Pas de Supabase : le front appelle uniquement notre API.
- Mobile : application Expo (React Native + TypeScript, Expo Router, expo-notifications,
  expo-sqlite, EAS Build), séparée du web mais avec le même langage, les mêmes icônes
  (Font Awesome 5) et le même client d'API. Je ne connais pas le mobile : explique chaque étape.
- Interfaces : reproduire à l'identique la maquette cliquable (document « TSOTSA_Kids_Prompts_
  Interfaces.md » et images de référence) ; logo officiel TSOTSA décliné en « TSOTSA Kids ».
- Hébergement : OVH (serveur VPS ou Public Cloud + Docker + Nginx + HTTPS) et MySQL managé OVH.
- Code : modules courts. Aucun fichier de plus de 300 lignes (cible : moins de 200).
  Une responsabilité par fichier.
- Aucune dépendance à une API externe pour les aliments : base constituée par l'équipe,
  importée par lots, versionnée et tracée (identifiant ORKG, article, auteur, date).

RÈGLES NON NÉGOCIABLES
- AUCUNE DONNÉE MOCKÉE dans l'application : données de notre base aliments (extraite d'ORKG), de sources
  officielles citées saisies par un administrateur, ou des utilisateurs. États vides honnêtes
  (« aucune donnée ») plutôt que des faux exemples. Les données de test sont autorisées
  uniquement dans tests/ et doivent être listées.
- Santé : mention permanente « Équivalence nutritionnelle indicative, ne remplace pas un
  traitement prescrit ; validation par un professionnel de santé. » Chaque valeur affichée
  cite sa source. Données de santé : consentement, pseudonymisation, journal d'audit
  (loi camerounaise n° 2024/017 sur les données personnelles).
- Pas de prix inventés : prix saisis par région avec date et source, sinon « prix non renseigné ».

Réponds d'abord seulement : (1) ta reformulation en 10 lignes ; (2) les points ambigus ou
contradictoires ; (3) ce qui diffère de l'architecture des présentations et pourquoi c'est
acceptable pour un MVP. N'écris rien d'autre tant que je n'ai pas validé.
```

✅ **VALIDATION** : tu corriges la reformulation de Claude jusqu'à ce qu'elle soit juste. Tous les prompts suivants s'appuient dessus.

---

## 5. 🧠 CLAUDE – (a-bis) Document technique `doc_technique_nutrition.md`

📍 **OÙ TU ES** : même conversation Claude, contexte validé.
*Pourquoi avant la maquette : la maquette doit refléter les vraies règles et les vraies données. Le document technique les fixe.*

```text
Produis doc_technique_nutrition.md, le document technique de référence du MVP, à valider par moi.
Écris en français, clairement, pour un Tech Lead qui validera chaque choix.

Sections obligatoires :
1. Résumé et périmètre du MVP (inclus / exclu / plus tard).
2. Décisions à valider : tableau (décision, options, recommandation, impact). Inclure D5 produits ajoutés (privés jusqu'à vérification), D1 seuil
   « présent », D2 nutriments essentiels, D3 prix, D4 message médical, choix de la stack, mobile
   Expo (recommandé) contre Flutter.
3. Les trois espaces et leurs acteurs : ESPACE UTILISATEUR ouvert à tous (inscription libre, personnes suivies de tout âge, choix des
   produits, confirmation des prises), ESPACE SOIGNANT (suivi, évaluations, courbes, alertes)
   et ESPACE D'ADMINISTRATION (notre équipe : comptes, maintenance des données, vérification
   des produits ajoutés). Diagramme du cycle de suivi en Mermaid.
   Matrice des droits (qui voit, crée, modifie quoi). Règles de simplicité de l'espace
   utilisateur, avec le parcours en 3 touches maximum détaillé écran par écran.
4. Liste exhaustive des cas d'usage (identifiant UC-xx, acteur, déclencheur, étapes, règles,
   résultat, critères d'acceptation testables).
5. Flux de données de bout en bout : comparaison ORKG → extraction manuelle → gabarit → import
   par lot → contrôles → double validation → MySQL → API → web/mobile. Schéma en Mermaid.
6. Base aliments : gabarit de saisie (colonnes, listes), import par lots, contrôles (dictionnaire
   de synonymes, unités, conversion pour 100 g, limites plausibles, doublons, source
   obligatoire), circuit de validation (brouillon → à valider → publié), versionnage (aucune
   valeur écrasée), traçabilité (identifiant ORKG, article, auteur, date), saisie manuelle unitaire.
7. Algorithme d'équivalence : spécification formelle (N, m, e, distance, seuils, région),
   pseudo-code, complexité, exemples calculés avec des données RÉELLES tirées du premier lot
   saisi, cas limites (nutriment absent, unités différentes, valeur nulle, aucun résultat).
   Prévoir l'interface du futur moteur d'optimisation (entrées / sorties) sans l'implémenter.
8. Schéma de base de données MySQL 8 : diagramme ER en Mermaid + DDL complet (tables, types,
   clés, index, contraintes, utf8mb4). Au minimum : organisations, utilisateurs, rôles,
   modules (avec activé / bientôt), régions, aliments locaux, disponibilité par région,
   nutriments, synonymes de nutriments, unités, compositions, sources, produits de référence,
   produits personnalisés, nutriments essentiels par produit, prix (région, date, source),
   lots de saisie (statut, auteur, relecteur, rapport de contrôle), versions des valeurs, personnes suivies (tout âge) et lien avec le compte (soi-même, enfant, proche), vérification des soignants, consentements, mesures
   anthropométriques, alertes, visites, journal d'audit. Expliquer l'isolation par
   organisation sans RLS.
9. Architecture backend FastAPI : arborescence complète du dépôt, découpage en modules
   (identity, organizations, modules_registry, regions, foods, nutrients, reference_products,
   custom_products, equivalence, pricing, food_database (lots, contrôles, validation), patients, clinical, monitoring,
   audit, optimization [vide, réservé]), dépendances autorisées entre modules, conventions
   (router / service / repository / schemas / models), règle des fichiers de 300 lignes maximum.
10. API REST : liste des endpoints versionnés /v1, avec exemples de requêtes et réponses.
    Authentification JWT + rôles, pagination, erreurs normalisées, OpenAPI pour générer le
    client du front.
11. Front web (React + Vite + Tailwind) et mobile (Expo), séparés : arborescence des écrans,
    navigation, composants partagés, client API généré depuis OpenAPI ; mobile hors ligne
    (expo-sqlite : consultation des aliments et produits déjà chargés, prises et mesures mises en
    file d'attente puis synchronisées) ; génération de l'APK avec EAS Build, expliquée pas à pas
    pour un débutant en mobile. Interfaces : reproduire à l'identique les écrans de la maquette.
12. Monitoring clinique : indicateurs, règles d'alerte (à valider par la référente médicale),
    calcul des z-scores avec les tables OFFICIELLES OMS (pas de valeurs inventées).
12 bis. Rappels et notifications : modèle de données (plans de prises, rappels planifiés,
    préférences par utilisateur / personne suivie / canal, notifications envoyées et leur
    statut) ; planificateur côté serveur (tâche programmée qui génère les rappels dans le
    fuseau horaire de chaque utilisateur, sans doublon, avec relance et annulation quand la
    prise est confirmée) ; envoi push via expo-notifications et Firebase Cloud Messaging ;
    boutons d'action sur la notification (« C'est donné », « Plus tard », « Pas donné ») ;
    notifications locales programmées sur le téléphone pour le hors-ligne ; SMS via agrégateur (coût) ;
    heures calmes ; journal des envois ; tests (heures, fuseaux, relances, désactivation).
13. Hébergement OVH : quelle offre MySQL managé et quel serveur, réseau (liste blanche d'IP),
    Docker Compose, Nginx, HTTPS, sauvegardes et test de restauration, environnements
    (dev / recette / production), variables d'environnement, coûts à vérifier sur ovhcloud.com.
14. Sécurité et conformité santé : authentification, mots de passe, chiffrement, audit,
    consentement, pseudonymisation, conservation.
15. Stratégie de tests : unitaires (algorithme d'équivalence en priorité), intégration (API +
    MySQL dans Docker), import de lots (avec le premier lot réel), bout en bout (front). Où les
    données de test sont autorisées.
16. Politique « zéro donnée mockée » : règles, vérifications automatiques (par exemple : interdire
    les mots « mock », « fake », « lorem » hors de tests/), et procédure de saisie des données
    de référence (produits thérapeutiques avec source officielle).
17. Risques et questions ouvertes.
18. Planning en sprints d'une semaine avec livrables et démonstrations.

Format : Markdown propre, tableaux, Mermaid. Indique pour chaque choix : [VALIDÉ] si déjà
décidé par moi, [À VALIDER] sinon. Signale tout ce que tu n'as pas pu vérifier.
```

✅ **VALIDATION** : tu relis section par section. Pour chaque [À VALIDER], tu réponds à Claude « validé », ou tu corriges. Tu fais valider les règles médicales (seuils, alertes, message) par Pr Nguefack. Ce document devient la référence : tu le places dans `docs/` du dépôt.

---

## 6. 🧠 CLAUDE – (a) Maquette PowerPoint cliquable de démonstration

📍 **OÙ TU ES** : même conversation, `doc_technique_nutrition.md` validé.

```text
À partir du doc_technique_nutrition.md validé, produis une maquette de démonstration au format
.pptx qui simule l'application, en 16:9, avec l'identité visuelle TSOTSA Kids des présentations.

Principe : en mode plein écran (diaporama), je clique sur les boutons et la présentation se
comporte comme l'application. Chaque écran est une diapositive. Chaque bouton, onglet,
élément de liste ou menu est une forme munie d'un LIEN INTERNE vers la diapositive de l'écran
suivant. Pas d'enchaînement par simple clic sur le fond : seuls les éléments interactifs
font avancer. Chaque écran a un bouton « Retour » et un accès « Accueil ». Les écrans
mobiles sont dessinés dans un cadre de téléphone, les écrans web dans un cadre de navigateur.

Couvre TOUS les cas d'usage UC-xx du document technique, au minimum :
- Connexion, choix du rôle, mot de passe oublié.
- Accueil des modules : Nutrition (actif), HTA et Diabète (« bientôt disponible »).
- Nutrition : menu déroulant ouvert des produits de référence ; détail F-75 (composition,
  encart coût, sources) ; panneau des équivalents locaux classés (m, e, teneurs, badge
  région) ; modification des nutriments essentiels ; filtre région (normal et strict) ;
  détail d'un aliment local avec sa source ORKG ; comparaison côte à côte ; état
  « aucun résultat ».
- Ajout d'un produit personnalisé : formulaire de composition, validation des unités,
  affichage des équivalents.
- Monitoring web : tableau de bord (indicateurs, alertes priorisées), liste des enfants
  avec filtres, dossier d'une personne suivie, enfant ou adulte (mesures, courbes, historique), fiche du compte utilisateur,
  liste des utilisateurs.
- Mobile utilisateur : connexion par Google, téléphone + code SMS, ou e-mail + mot de passe ; ajout d'une personne suivie (soi-même, un enfant, un proche) avec ses paramètres de santé et son consentement ; choix de
  la personne puis du produit (thérapeutique ou local) ; confirmation de la prise (quantité, heure) ;
  historique des prises de la personne ; mode hors ligne et synchronisation.
- Web soignant : prises confirmées visibles en temps réel dans le dossier de la personne suivie ;
  saisie d'une évaluation ; courbes mises à jour après chaque évaluation.
- Rappels et notifications : plan de prises défini par le soignant ; rappel sur l'écran
  verrouillé à l'heure prévue (réponses directes) ; centre de notifications ; réglages avec
  interrupteurs (activer / désactiver, montrer l'écran « rappels désactivés ») ; notifications
  du soignant (prise confirmée, rappel envoyé, prise non confirmée) et ses réglages par type,
  canal et personne suivie ; réglages globaux dans l'administration ; un schéma qui explique
  le cycle complet (planification → rappel → confirmation → relance).
- Administration : utilisateurs et rôles, régions, prix par région, base aliments (import de
  lots, contrôles, validation), produits de référence et nutriments essentiels, modules activés.
- Mentions médicales et sources visibles sur les écrans concernés.

Données affichées : uniquement des valeurs RÉELLES (compositions de produits thérapeutiques
d'après les spécifications OMS / UNICEF avec la source citée ; aliments locaux tirés du
premier lot de la base aliments). Les données de patients sont fictives par nature : marque ces
écrans « Données de démonstration » et pseudonymise (Enfant #A-014).

Commence par la diapositive 1 « Mode d'emploi de la démo », puis le plan de navigation
(chaque écran numéroté avec ses liens). Ajoute en notes de chaque diapositive : le cas
d'usage couvert, ce que je dois dire en démonstration, et ce qui n'est pas encore décidé.
Vérifie que chaque lien interne pointe vers la bonne diapositive et qu'aucun écran n'est
une impasse.
```

✅ **VALIDATION** : tu fais toute la démo en plein écran, en cliquant. Tu notes chaque lien cassé et chaque écran qui ne correspond pas à ce que tu veux, puis tu demandes les corrections. Tu montres ensuite la démo à Fidel et à Pr Nguefack **avant** de développer : corriger une maquette coûte dix fois moins cher que corriger du code.

---

## 7. 🧠 CLAUDE – (b + c + d) Prompts Antigravity et guide de développement

📍 **OÙ TU ES** : même conversation, doc technique et maquette validés.

```text
Produis GUIDE_DEVELOPPEMENT_TSOTSA_KIDS.md : le guide pas à pas pour développer le MVP avec
Antigravity (backend, base, déploiement), Lovable (front web) et Claude Code / Cursor /
Antigravity (application mobile Expo). Je suis le
validateur final et je ne connais pas le développement mobile.

Structure attendue :
A. Vue d'ensemble : dépôts (tsotsa-kids-api pour le backend et l'infra, tsotsa-kids-web pour le
   front Lovable synchronisé avec GitHub, tsotsa-kids-mobile pour l'application Expo), arborescence complète, schéma de déploiement OVH.
B. Prérequis à installer sur mon poste (avec commandes Windows ET macOS) et comptes à créer
   (GitHub, OVH, Lovable, Expo / EAS, Firebase, Google Play Console plus tard).
C. Une suite de prompts Antigravity NUMÉROTÉS (P01, P02…), chacun petit et vérifiable.
   Pour CHAQUE prompt, donne exactement :
   - 📍 Où je suis : outil, dossier, branche Git, ce qui existe déjà ;
   - 🎯 Objectif en une phrase ;
   - ⚙️ Prérequis ;
   - 📝 Le prompt à coller (bloc de code), qui rappelle les règles : modules, fichiers de
     300 lignes maximum, tests, pas de données mockées ;
   - ✅ Ce que je dois vérifier (commandes à lancer, résultat attendu, écran à voir) ;
   - 💾 Le message de commit.
   Ordre proposé (adapte-le) : squelette du projet et outils qualité ; Docker Compose
   local (MySQL 8 + API) ; configuration et connexion MySQL OVH ; migrations Alembic du
   schéma ; module identity (JWT, rôles) ; organisations et régions ; registre des modules
   (Nutrition actif, HTA et Diabète bientôt) ; nutriments, synonymes et unités ; base
   aliments (import de lots du gabarit, contrôles, validation, versions) ; produits
   de référence (saisie avec source) ; produits personnalisés ; moteur d'équivalence
   (avec tests exhaustifs AVANT le code) ; prix ; comptes ouverts à tous, personnes suivies, consentements, vérification des soignants ;
   mesures et z-scores OMS ; alertes et monitoring ; plans de prises, planificateur de
   rappels, notifications (push Firebase, SMS, e-mail) et préférences ; audit ; OpenAPI et génération du
   client ; déploiement OVH (serveur, Nginx, HTTPS, sauvegardes) ; CI GitHub Actions ;
   module optimisation réservé (interface vide).
D. Une suite de prompts Lovable NUMÉROTÉS (L01, L02…) avec le même format, pour le front WEB
   (le mobile est en Expo, section E). Les écrans reprennent à l'identique les prompts
   W00 à W16 du document « TSOTSA_Kids_Prompts_Interfaces.md » : charte et design system ; consigne de ne PAS utiliser Supabase et d'appeler
   notre API (variable VITE_API_URL, client généré) ; navigation par rôle ; écran
   Nutrition (menu produits, détail, équivalents, filtre région) ; produit personnalisé ;
   monitoring ; rappels et notifications (centre de notifications, réglages avec
   interrupteurs) ; administration ; états vides honnêtes ; accessibilité ; français.
E. L'application mobile Expo expliquée à un débutant : création du projet, lancement sur son
   propre téléphone avec Expo Go, écrans repris à l'identique des prompts M00 à M29 du
   document « TSOTSA_Kids_Prompts_Interfaces.md », notifications (expo-notifications :
   permission, rappels locaux programmés, push Firebase, boutons d'action), hors ligne
   (expo-sqlite), génération de l'APK avec EAS Build, test sur un vrai téléphone, publication
   sur Google Play. Chaque commande expliquée. Prompts Antigravity dédiés (M01, M02…).
F. Points de validation (« portes ») où je dois tester et dire OK avant de continuer.
G. Gestion des erreurs : que faire quand Antigravity ou Lovable produit du code cassé, des
   fichiers trop longs ou des données inventées (prompts de correction types).
H. À la fin : la LISTE EXHAUSTIVE des données de test (fichier, contenu, raison) et la liste
   des TESTS à exécuter (unitaires, intégration, bout en bout, recette manuelle), avec leurs
   critères de réussite.

Les prompts doivent être autonomes : chacun rappelle le contexte nécessaire, car Antigravity
et Lovable n'ont pas accès à cette conversation. Chaque prompt Antigravity commence par :
« Lis docs/doc_technique_nutrition.md et docs/GUIDE_DEVELOPPEMENT_TSOTSA_KIDS.md avant de commencer. »
```

✅ **VALIDATION** : tu relis l'ordre des prompts et les portes de validation. Tu places le guide dans `docs/` du dépôt, à côté du document technique.

---

## 8. Étapes supplémentaires pour finir vite et bien (point 4)

| # | Étape | Quand | Pourquoi |
|---|---|---|---|
| E1 | **Lever le risque données d'abord** (étape 3) | Jour 1 | Si tsotsa ne donne pas ce qu'on croit, tout le reste change. |
| E2 | **Fiche « données de référence »** : composition officielle du F-75, du F-100 et des RUTF, avec source, validée par Pr Nguefack | Semaine 1 | Ce sont les seules données que l'application n'importe pas : elles doivent être exactes et sourcées. |
| E3 | **Fixer D1 à D5 par écrit** (seuil, nutriments essentiels, prix, message médical) | Semaine 1 | Sans ces règles, l'algorithme ne peut pas être testé. |
| E4 | **Squelette déployé dès la semaine 1** : une page « Bonjour » sur OVH, connectée à MySQL, en HTTPS | Semaine 1 | Les problèmes d'hébergement découverts à la fin font perdre des semaines. |
| E5 | **Tests de l'algorithme écrits avant le code**, avec des cas calculés à la main | Avant le module équivalence | C'est le cœur métier. Les tests sont ta preuve que le classement respecte ta règle. |
| E6 | **Démo du vendredi** : 20 minutes chaque semaine, avec ce qui marche vraiment | Chaque semaine | Tu valides au fil de l'eau au lieu de tout découvrir à la fin. |
| E7 | **Tableau de suivi** (GitHub Projects) : une carte par prompt P/L/M, colonnes « à faire / en cours / à valider / validé » | En continu | Tu sais toujours où tu en es. |
| E8 | **Définition de « terminé »** pour chaque tâche : tests verts, fichiers de moins de 300 lignes, aucune donnée mockée, documentation à jour, validée par toi | En continu | Évite le « presque fini ». |
| E9 | **Revue de code par Claude** : coller un module et demander une revue (sécurité, longueur, données mockées) avant ta validation | Après chaque module | Un second regard, gratuit et rapide. |
| E10 | **Test avec 5 vrais utilisateurs** (2 agents, 2 parents, 1 médecin) sur leur propre téléphone | Avant le pilote | Révèle les vrais problèmes : lisibilité, connexion, compréhension. |
| E11 | **Sauvegarde restaurée une fois** | Avant le pilote | Une sauvegarde jamais restaurée n'est pas une sauvegarde. |
| E12 | **Cadre éthique et consentement** prêts avant tout enfant réel enregistré | Avant le pilote | Obligatoire en santé (voir la trame IT4WORK T06). |
| E13 | **Gel des fonctionnalités** 1 semaine avant la démo officielle : uniquement des corrections | Fin de projet | Protège la stabilité de la démo. |

### Planning indicatif (à ajuster)

| Semaine | Livrables | Ta validation |
|---|---|---|
| S0 | Exploration tsotsa, doc technique, décisions D1 à D5 | Données et règles validées |
| S1 | Maquette cliquable, squelette déployé sur OVH | Démo maquette avec Fidel et Pr Nguefack |
| S2 | Base MySQL, base aliments (gabarit, import de lots, validation), nutriments | Premier lot validé par Fidel |
| S3 | Produits de référence et personnalisés, moteur d'équivalence | Classement vérifié sur 10 cas |
| S4 | Front Lovable : écran Nutrition complet | Démo web |
| S5 | Patients, mesures, monitoring | Démo monitoring |
| S6 | Application mobile Expo, APK Android, tests avec 5 utilisateurs | Démo sur téléphone |
| S7 | Corrections, sécurité, sauvegardes, documentation | Go / no-go pilote |

---

## 9. Données de test et tests : ce que tu recevras à la fin

Le guide de Claude (section H) doit lister **tout** ce qui suit. Vérifie qu'il est complet.

**Données de test autorisées (dossier `tests/` uniquement)**
- Petits jeux d'aliments et de compositions pour tester l'algorithme (cas calculés à la main).
- Extraits du premier lot réel de la base aliments (fichiers du gabarit) pour tester l'import et les contrôles.
- Utilisateurs et patients fictifs pour les tests automatiques et la démonstration, toujours marqués comme tels.

**Tests à exécuter**
- Algorithme d'équivalence : ordre m puis e, égalités, seuils, unités, région, aucun résultat.
- Import : normalisation, conversion des unités, doublons, données manquantes, reprise après erreur.
- API : droits par rôle, isolation entre organisations, validation des saisies.
- Front : parcours principaux (consulter un produit, ajouter un produit, filtrer par région, enregistrer une mesure).
- Mobile : APK sur un vrai téléphone (EAS Build), rappels hors ligne, mode hors ligne.
- Sécurité : accès non autorisé, mots de passe, journal d'audit.
- Recette manuelle avec toi, puis avec les 5 utilisateurs.
- Contrôle automatique « zéro mock » : aucun mot `mock`, `fake` ou `lorem`, et aucune donnée codée en dur, hors de `tests/`.
