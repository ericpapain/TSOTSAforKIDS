# TSOTSA Kids : prompts pour recréer les interfaces à l'identique

Version 1.0 · 5 novembre 2026 · Eric Papain MEZATIO (IT4WORK)

Ce document permet de reconstruire **au pixel près** chaque écran de la maquette cliquable `TSOTSA_Kids_Demo_Cliquable.pptx`, dans Claude, Lovable, Bolt, v0, Cursor, Antigravity ou Figma.

Les mesures (positions, tailles, couleurs, polices, liens) ne sont **pas estimées à l'œil** : elles ont été enregistrées automatiquement au moment où chaque écran de la maquette a été dessiné, puis converties en pixels.

**Fichiers qui accompagnent ce document** (dossier `references/`) :
- `mobile/<écran>.png` : chaque écran mobile à la taille exacte de 390 × 746 px ;
- `web/<écran>.png` : chaque écran web à la taille exacte de 1440 × 673 px ;
- `logo/logo_tsotsa.svg` et `.png` : le symbole TSOTSA redessiné en vectoriel ;
- `slides/` : les diapositives explicatives (accueil, plan, schéma des notifications).

---

## 0. Mode d'emploi

1. **Choisis la partie** : mobile (section 3 puis 4) ou web (section 5 puis 6). Les deux sont indépendantes.
2. **Colle d'abord le prompt de fondation** (M00 pour le mobile, W00 pour le web). Il crée le projet, les couleurs, les polices, les icônes et les composants partagés. Ne passe aux écrans qu'une fois la fondation vérifiée.
3. **Un écran par prompt.** Colle le prompt de l'écran **et joins son image de référence** (`references/mobile/u_welcome.png`, par exemple). Les outils comprennent beaucoup mieux une mise en page avec l'image sous les yeux.
4. **Vérifie par superposition** (section 8) avant de passer à l'écran suivant.
5. **Si l'outil « améliore » le design**, réponds : « Tu as modifié [élément]. Reviens exactement aux valeurs du prompt : [valeur]. Aucune modification créative. »

**Règles communes à tous les prompts**
- Reproduire, pas réinterpréter : mêmes couleurs, tailles, espacements, ordre, textes, icônes.
- Aucune ombre, aucun dégradé, aucun effet absent de la maquette.
- Les données affichées dans les images servent à vérifier la mise en page. Dans l'application, elles viennent de l'API. Aucune donnée codée en dur hors des tests.
- Les personnes suivies (« Amina », « #A-014 ») sont fictives.

---

## 1. Les vrais outils

| Partie | Technologie | Outil pour générer | Pourquoi |
|---|---|---|---|
| **Mobile** (utilisateurs, et inscription des soignants) | **Expo** (React Native + TypeScript), Expo Router, `@expo/vector-icons` (FontAwesome5), `@expo-google-fonts/carlito`, `react-native-svg`, **`expo-notifications`** (rappels programmés, notifications push, boutons d'action sur l'écran verrouillé), `expo-sqlite` (hors ligne), `@react-native-google-signin/google-signin` (connexion Google ; demande une « development build », pas Expo Go), **EAS Build** (APK et Google Play) | **Claude Code**, **Cursor** ou **Antigravity** ; Bolt accepte aussi les projets Expo | Une vraie application Android (puis iPhone), avec rappels qui sonnent même sans réseau. **Lovable ne produit pas d'application mobile native.** |
| **Web** (soignants, administration, version web utilisateur) | **React 18 + TypeScript + Vite**, **Tailwind CSS 3**, React Router, `react-icons/fa` (Font Awesome 5), `@fontsource/carlito` | **Lovable**, **v0** ou **Bolt** pour le premier jet ; **Cursor** ou **Claude Code** pour les retouches | Écosystème le plus large pour les tableaux de bord. Tailwind permet de fixer chaque valeur en pixels. |
| **Design** | Figma | **Figma** (images de référence en calque), Figma AI | Pour retoucher le design avant le code, si besoin. |
| **Serveur** | FastAPI (Python) + MySQL managé OVH | Antigravity / Claude Code | Inchangé. |

**À valider :** le document de prompts précédent prévoyait, pour le mobile, une version installable du site emballée avec Capacitor. Avec les rappels programmés, les boutons d'action sur l'écran verrouillé et le mode hors ligne, **Expo est plus adapté**. Les deux parties partagent le même langage (TypeScript), les mêmes icônes et le même client d'API.

**Police :** la maquette utilise **Calibri**. Son équivalent libre, **Carlito**, a exactement les mêmes dimensions de caractères. Il est disponible sur Google Fonts et Fontsource.

---

## 2. Fondation commune (système de design)

### 2.1 Couleurs

| Couleur | Nom du jeton et usage |
|---|---|
| `#0F7B5F` | primary (vert) |
| `#E7F4EE` | primary-50 |
| `#BFE3D3` | primary-200 |
| `#F08A24` | accent (orange) |
| `#FFF1E2` | accent-50 |
| `#17302A` | text |
| `#5B6B66` | text-muted |
| `#D5DEDA` | border |
| `#EEF2F0` | canvas |
| `#C93C3C` | danger |
| `#FDECEC` | danger-50 |
| `#B7791F` | warning |
| `#FFF4D6` | warning-50 |
| `#1F5FA8` | care (bleu soignant) |
| `#E8F0FA` | care-50 |
| `#334155` | admin (ardoise) |
| `#EEF1F5` | admin-50 |
| `#FFFFFF` | white |
| `#8A9893` | text-subtle |
| `#F7F9F8` | surface-2 |
| `#F6F8F7` | sidebar |
| `#F1F3F2` | neutral-100 |
| `#C9D1CE` | toggle-off |
| `#DDE2E0` | neutral-200 |
| `#534AB7` | chart (violet) |
| `#B4610C` | accent-700 |
| `#7A5300` | warning-900 |
| `#E6F4EC` | chart-normal |
| `#D9DFDC` | chart-grid |
| `#F26142` | brand (orange TSOTSA) |
| `#1E3A33` | lockscreen |
| `#3A544D` | lockscreen-2 |
| `#CFE9DE` | primary-100 |
| `#F4F7F6` | surface-3 |
| `#5B6662` | overlay |
| `#F1B5B5` | danger-200 |
| `#0C6650` | primary-800 |
| `#E5484D` | badge (rouge) |

**Rôle des couleurs :**
- vert `#0F7B5F` : espace utilisateur ;
- bleu `#1F5FA8` : espace soignant ;
- ardoise `#334155` : administration ;
- orange `#F08A24` : mises en évidence (nouveau, à cliquer) ;
- orange TSOTSA `#F26142` : **réservé au logo**.

### 2.2 Typographie : Carlito (Calibri)

Deux graisses seulement : normal (400) et gras (700). Interligne 1,2. Correspondance des tailles :

| Taille dans la maquette | Mobile (écran 390 px) | Web (écran 1440 px) |
|---|---|---|
| 7 pt | 11 px | 11 px |
| 8 pt | 13 px | 13 px |
| 9 pt | 14 px | 14 px |
| 10 pt | 16 px | 16 px |
| 11 pt | 18 px | 17 px |
| 12 pt | 19 px | 19 px |
| 13 pt | 21 px | 21 px |
| 14 pt | 22 px | 22 px |
| 15 pt | 24 px | 24 px |
| 16 pt | 25 px | 25 px |
| 17 pt | 27 px | 27 px |
| 18 pt | 29 px | 29 px |
| 20 pt | 32 px | 32 px |
| 22 pt | 35 px | 35 px |
| 24 pt | 38 px | 38 px |
| 48 pt | 76 px | 76 px |

### 2.3 Formes

**Bordures et effets**
- Bordures de 1 px, couleur `#D5DEDA`.
- Aucune ombre, aucun dégradé.

**Rayons des coins**

| Élément | Rayon |
|---|---|
| Cartes et listes | 9 px |
| Boutons | 11 px |
| Champs de saisie | 7 px |
| Pastilles | moitié de la hauteur (forme de pilule) |
| Cadre du téléphone (maquette seulement) | ne pas reproduire |

### 2.4 Icônes

- **Bibliothèque :** Font Awesome 5, style plein (*solid*), et rien d'autre. Sur le web : `react-icons/fa`. Sur mobile : `FontAwesome5` de `@expo/vector-icons`. Chaque prompt d'écran donne le nom exact de l'icône.
- **Illustrations :** aucune. Les visuels sont des icônes posées dans des cercles de couleur claire.

### 2.5 Logo (composant `BrandLogo`)

- **Symbole :** le logo officiel TSOTSA, un disque orange `#F26142` découpé (fente verticale, cercle central, fente horizontale vers la droite). Il a été redessiné en vectoriel d'après le fichier fourni (44 px). **Demander le fichier vectoriel officiel au propriétaire de la marque** et le substituer s'il diffère.
- **Mot :** « TSOTSA » en Carlito gras, espacement des lettres 0,04 em.
- **Pastille « KIDS » :** Carlito gras, espacement 0,08 em, forme de pilule.

**Proportions, pour une hauteur de symbole h :**

| Élément | Valeur |
|---|---|
| Symbole | h × h |
| Espace entre le symbole et « TSOTSA » | 0,45 h |
| « TSOTSA » | police 0,6 h, largeur ≈ 2,1 h |
| Espace entre « TSOTSA » et la pastille | 0,22 h |
| Pastille « KIDS » | hauteur 0,72 h, largeur ≈ 1,58 h, police 0,42 h, centrée verticalement sur le mot |

**Variante sur fond clair**
- « TSOTSA » en `#17302A`.
- Pastille `#F26142`, texte blanc.

**Variante sur fond foncé** (en-têtes vert, bleu ou ardoise)
- Le symbole est posé sur un **disque blanc de 1,24 h** de diamètre.
- « TSOTSA » en blanc.
- Pastille blanche, texte `#F26142`.

**Tailles utilisées dans la maquette**
- En-tête web : h = 34 px.
- Accueil mobile : symbole seul de 103 px dans un cercle `#E7F4EE` de 161 px, puis mot et pastille centrés (h = 53 px).
- Icône de notification : symbole de 28 px dans un carré blanc de 37 px, bordure `#D5DEDA`, rayon 8 px.

**Code SVG du symbole :**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 84 84">
  <defs><mask id="m"><rect width="100" height="100" fill="#fff"/>
    <rect x="46.9" y="0" width="6.2" height="100" fill="#000"/>
    <circle cx="50" cy="50" r="11.6" fill="#000"/>
    <rect x="50" y="46.4" width="50" height="7.2" fill="#000"/></mask></defs>
  <circle cx="50" cy="50" r="42" fill="#F26142" mask="url(#m)"/>
</svg>
```

### 2.6 Composants partagés (mesures mobile ; web entre parenthèses)

| Composant | Spécification |
|---|---|
| `Button` | Hauteur selon l'écran (souvent 69 px ou 63 px sur mobile) ; rayon 11 px ; texte centré gras. **Plein :** fond couleur de l'espace, texte blanc. **Contour :** fond blanc, bordure 1 px et texte de la couleur de l'espace. |
| `Chip` (pastille) | Forme de pilule ; texte gras centré ; couleurs données par écran. |
| `Card` | Fond blanc, bordure 1 px `#D5DEDA`, rayon 9 px. |
| `ListItem` | Carte, icône 32 px à 14 px du bord gauche, titre 18 px gras, sous-titre 14 px `#5B6B66`, chevron « › » à droite si cliquable. |
| `Field` | Libellé 14 px gras `#5B6B66` (hauteur 25 px). Zone 44 px de haut, fond `#F7F9F8`, bordure `#D5DEDA`, rayon 7 px, texte 18 px, marge intérieure 14 px. |
| `Toggle` | 60 × 32 px. Piste `#0F7B5F` (activé) ou `#C9D1CE` (désactivé), bouton blanc 25 px. |
| `Notice` (avertissement) | Fond `#FFF4D6`, texte `#7A5300`, rayon 7 px. |
| `AppBar` (mobile) | 390 × 67 px sous la barre d'état ; titre 22 px gras blanc centré ; icônes 32 px. |
| `BottomNav` (mobile) | 390 × 57 px ; 4 onglets ; icône 23 px ; libellé 13 px. |
| `AppHeader` (web) | 1440 × 63 px, logo h = 34 px, titre de l'espace 22 px gras. |
| `Sidebar` (web) | 262 px de large, fond `#F6F8F7`, éléments 239 × 50 px. |
| `KpiCard` (web) | 114 px de haut, barre colorée 9 px à gauche, valeur 38 px gras, libellé 16 px. |
| `DataTable` (web) | En-tête 41 px coloré, texte blanc gras ; lignes de 46 à 63 px, fond alterné `#F7F9F8` / blanc. |
| `ZScoreChart` | Courbe en SVG maison : bandes de fond par zone, grille, points et valeurs (détail dans les écrans soignant). |

### 2.7 Animations (les seules autorisées)

| Moment | Animation |
|---|---|
| Toucher ou clic sur un élément | opacité 0,85, puis retour, 100 ms |
| Changement d'écran (mobile) | transition native de la pile de navigation, glissement de droite, 250 ms |
| Changement de page (web) | aucun effet |
| Interrupteur | le bouton glisse en 150 ms, la couleur change en même temps |
| Fenêtre superposée (« bientôt disponible ») | fond assombri `#5B6662` et carte en fondu, 200 ms |
| Notifications | gérées par le système du téléphone |

### 2.8 Responsive

**Mobile**
- Référence : 390 px de large.
- De 360 à 430 px : marges latérales fixes de 17 px ; les éléments pleine largeur s'étirent ; les éléments côte à côte gardent leurs proportions.
- Le contenu défile verticalement s'il dépasse la hauteur. En-tête et barre du bas restent fixes.
- Les zones de sécurité (encoche, barre système) sont respectées.

**Web**
- Référence : 1440 px.
- Au-delà de 1440 px : la zone de contenu s'élargit, le menu latéral reste à 262 px.
- De 1024 à 1279 px : le menu se réduit aux icônes (72 px) et les tableaux défilent horizontalement.
- Sous 1024 px : non prévu (proposer l'application mobile).

### 2.9 Accessibilité

- Zones tactiles d'au moins 44 × 44 px.
- Libellés accessibles sur toutes les icônes cliquables.
- Les couleurs de statut sont toujours accompagnées d'un texte ou d'une icône.

---

## 3. Prompt de fondation mobile (M00)

```text
Crée la fondation de l'application mobile TSOTSA Kids avec Expo (React Native, TypeScript, Expo Router).
Ne crée aucun écran métier pour l'instant : uniquement le socle ci-dessous, à reproduire exactement.

1. Projet : Expo SDK récent, TypeScript strict, Expo Router (dossier app/), structure en modules :
   src/theme (couleurs, typographie, espacements), src/components (composants partagés),
   src/features/<domaine> (écrans et logique par domaine), src/api (client d'API), src/notifications.
   Aucun fichier de plus de 300 lignes.
2. Dépendances : @expo/vector-icons (FontAwesome5 uniquement), @expo-google-fonts/carlito,
   react-native-svg, expo-notifications, expo-sqlite, expo-secure-store, react-native-safe-area-context,
   @react-native-google-signin/google-signin (connexion Google ; nécessite une development build EAS,
   pas Expo Go). Trois connexions : Google, téléphone + code SMS, e-mail + mot de passe.
3. Thème (src/theme/colors.ts) : reprends EXACTEMENT ces couleurs (hexadécimal) et ces noms :
   primary #0F7B5F, primary-50 #E7F4EE, primary-100 #CFE9DE, primary-200 #BFE3D3, accent #F08A24,
   accent-50 #FFF1E2, accent-700 #B4610C, text #17302A, text-muted #5B6B66, text-subtle #8A9893,
   border #D5DEDA, canvas #EEF2F0, surface-2 #F7F9F8, surface-3 #F4F7F6, neutral-100 #F1F3F2,
   neutral-200 #DDE2E0, toggle-off #C9D1CE, danger #C93C3C, danger-50 #FDECEC, danger-200 #F1B5B5,
   warning #B7791F, warning-50 #FFF4D6, warning-900 #7A5300, care #1F5FA8, care-50 #E8F0FA,
   admin #334155, admin-50 #EEF1F5, brand #F26142, lockscreen #1E3A33, lockscreen-2 #3A544D,
   overlay #5B6662, white #FFFFFF.
4. Typographie : police Carlito (400 et 700) chargée au démarrage. Tailles utilisées (px) :
   11, 13, 14, 16, 18, 19, 21, 22, 24, 25, 29, 32, 35, 38, 76. Interligne 1,2. Aucune autre police.
5. Composants partagés (src/components), avec ces mesures exactes pour un écran de 390 px :
   - AppBar : hauteur 67 px sous la zone de sécurité, fond = couleur passée (défaut primary),
     titre centré 22 px gras blanc, bouton retour à gauche (FontAwesome5 arrow-left 32 px blanc,
     zone tactile 69 × 67), icône optionnelle à droite (32 px, zone 69 × 67).
   - BottomNav : 390 × 57 px, fond surface-2, filet haut 1 px border, 4 onglets égaux : Modules (home),
     Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé
     13 px dessous ; actif : primary + gras ; inactif : text-subtle.
   - Button : rayon 11 px, texte centré gras ; variantes plein (fond primary, texte blanc) et contour
     (fond blanc, bordure 1 px et texte primary) ; la couleur peut être surchargée (care, admin, danger).
   - Chip : pilule, texte gras centré, couleurs passées en propriétés.
   - Card : fond blanc, bordure 1 px border, rayon 9 px.
   - ListItem : carte ; icône 32 px à 14 px du bord ; titre 18 px gras text ; sous-titre 14 px
     text-muted ; badge optionnel en haut à droite ; chevron « › » 25 px text-subtle si cliquable.
   - Field : libellé 14 px gras text-muted (25 px de haut), zone 44 px, fond surface-2, bordure border,
     rayon 7 px, texte 18 px, marge intérieure 14 px ; texte indicatif en text-subtle.
   - Toggle : 60 × 32 px, piste primary (activé) / toggle-off (désactivé), bouton blanc 25 px, animation 150 ms.
   - Notice : fond warning-50, texte warning-900 13 px, rayon 7 px.
   - BrandLogo : symbole SVG fourni (fichier references/logo/logo_tsotsa.svg), mot « TSOTSA »
     (Carlito gras, 0,6 × h, espacement 0,04 em) et pastille « KIDS » (hauteur 0,72 h, police 0,42 h,
     espacement 0,08 em) ; variante claire (TSOTSA text, pastille brand texte blanc) et variante
     foncée (symbole sur disque blanc 1,24 h, TSOTSA blanc, pastille blanche texte brand).
6. Animations : retour visuel au toucher (opacité 0,85, 100 ms), transitions natives de la pile
   (250 ms), interrupteurs 150 ms. Rien d'autre : pas d'ombre, pas de dégradé.
7. Responsive : maquette à 390 px ; marges latérales fixes 17 px ; éléments pleine largeur étirés ;
   défilement vertical si nécessaire ; AppBar et BottomNav fixes ; respect des zones de sécurité.
8. Routes à créer (fichiers vides avec titre provisoire), selon ce tableau :
| M01 | Accueil | `u_welcome` | `app/u-welcome.tsx` |
| M02 | Connexion Google | `u_google` | `app/u-google.tsx` |
| M03 | Connexion téléphone | `u_signup` | `app/u-signup.tsx` |
| M04 | Connexion e-mail | `u_email` | `app/u-email.tsx` |
| M05 | Code SMS | `u_otp` | `app/u-otp.tsx` |
| M06 | Modules | `u_modules` | `app/u-modules.tsx` |
| M07 | Module bientôt | `u_soon` | `app/u-soon.tsx` |
| M08 | Personnes suivies | `u_persons` | `app/u-persons.tsx` |
| M09 | Ajouter une personne | `u_addperson` | `app/u-addperson.tsx` |
| M10 | Consentement | `u_consent` | `app/u-consent.tsx` |
| M11 | Profil | `u_profile` | `app/u-profile.tsx` |
| M12 | Choisir un produit | `u_choose` | `app/u-choose.tsx` |
| M13 | Liste des produits | `u_dropdown` | `app/u-dropdown.tsx` |
| M14 | F-75 (hôpital) | `u_f75` | `app/u-f75.tsx` |
| M15 | Produit + équivalents | `u_product` | `app/u-product.tsx` |
| M16 | Filtre région | `u_region` | `app/u-region.tsx` |
| M17 | Aucun résultat | `u_empty` | `app/u-empty.tsx` |
| M18 | Détail aliment | `u_food` | `app/u-food.tsx` |
| M19 | Nutriments | `u_nutrients` | `app/u-nutrients.tsx` |
| M20 | Confirmer la prise | `u_give` | `app/u-give.tsx` |
| M21 | Prise enregistrée | `u_given` | `app/u-given.tsx` |
| M22 | Historique | `u_history` | `app/u-history.tsx` |
| M23 | Hors ligne | `u_offline` | `app/u-offline.tsx` |
| M24 | Ajouter mon produit | `u_addproduct` | `app/u-addproduct.tsx` |
| M25 | Équivalents de mon produit | `u_myproduct_eq` | `app/u-myproduct-eq.tsx` |
| M26 | Rappel à l'heure prévue | `u_lock` | `app/u-lock.tsx` |
| M27 | Mes notifications | `u_notif_center` | `app/u-notif-center.tsx` |
| M28 | Réglages notifications | `u_notif_settings` | `app/u-notif-settings.tsx` |
| M29 | Rappels désactivés | `u_notif_off` | `app/u-notif-off.tsx` |
| M30 | Heures prévues | `u_schedule` | `app/u-schedule.tsx` |
| M31 | Compte en attente | `s_pending` | `app/s-pending.tsx` |
9. Aucune donnée inventée : les écrans liront l'API (FastAPI) via src/api ; états vides honnêtes.
Montre-moi la structure du projet et un écran de démonstration des composants (catalogue) pour validation.
```

| N° | Écran | Identifiant | Fichier Expo Router |
|---|---|---|---|
| M01 | Accueil | `u_welcome` | `app/u-welcome.tsx` |
| M02 | Connexion Google | `u_google` | `app/u-google.tsx` |
| M03 | Connexion téléphone | `u_signup` | `app/u-signup.tsx` |
| M04 | Connexion e-mail | `u_email` | `app/u-email.tsx` |
| M05 | Code SMS | `u_otp` | `app/u-otp.tsx` |
| M06 | Modules | `u_modules` | `app/u-modules.tsx` |
| M07 | Module bientôt | `u_soon` | `app/u-soon.tsx` |
| M08 | Personnes suivies | `u_persons` | `app/u-persons.tsx` |
| M09 | Ajouter une personne | `u_addperson` | `app/u-addperson.tsx` |
| M10 | Consentement | `u_consent` | `app/u-consent.tsx` |
| M11 | Profil | `u_profile` | `app/u-profile.tsx` |
| M12 | Choisir un produit | `u_choose` | `app/u-choose.tsx` |
| M13 | Liste des produits | `u_dropdown` | `app/u-dropdown.tsx` |
| M14 | F-75 (hôpital) | `u_f75` | `app/u-f75.tsx` |
| M15 | Produit + équivalents | `u_product` | `app/u-product.tsx` |
| M16 | Filtre région | `u_region` | `app/u-region.tsx` |
| M17 | Aucun résultat | `u_empty` | `app/u-empty.tsx` |
| M18 | Détail aliment | `u_food` | `app/u-food.tsx` |
| M19 | Nutriments | `u_nutrients` | `app/u-nutrients.tsx` |
| M20 | Confirmer la prise | `u_give` | `app/u-give.tsx` |
| M21 | Prise enregistrée | `u_given` | `app/u-given.tsx` |
| M22 | Historique | `u_history` | `app/u-history.tsx` |
| M23 | Hors ligne | `u_offline` | `app/u-offline.tsx` |
| M24 | Ajouter mon produit | `u_addproduct` | `app/u-addproduct.tsx` |
| M25 | Équivalents de mon produit | `u_myproduct_eq` | `app/u-myproduct-eq.tsx` |
| M26 | Rappel à l'heure prévue | `u_lock` | `app/u-lock.tsx` |
| M27 | Mes notifications | `u_notif_center` | `app/u-notif-center.tsx` |
| M28 | Réglages notifications | `u_notif_settings` | `app/u-notif-settings.tsx` |
| M29 | Rappels désactivés | `u_notif_off` | `app/u-notif-off.tsx` |
| M30 | Heures prévues | `u_schedule` | `app/u-schedule.tsx` |
| M31 | Compte en attente | `s_pending` | `app/s-pending.tsx` |


---

## 4. Écrans mobiles, un prompt par écran

À coller dans Claude Code, Cursor ou Antigravity (projet Expo), un écran à la fois, avec l'image de référence jointe.

### M01 · Accueil de l'application (`u_welcome`)

Référence : `mobile/u_welcome.png` · cas d'usage : UC-01 · Découvrir l'application

```text
Recrée À L'IDENTIQUE l'écran « Accueil de l'application » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_welcome.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Ouvre l'application. Se connecte en un geste avec Google, avec son numéro de téléphone (code par SMS), ou avec l'adresse e-mail de son choix et un mot de passe. La même action sert à créer le compte et à se reconnecter.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
Pas d'en-tête sur cet écran.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Cercle / ellipse — x 115, y 106, 161×161 px ; fond `#E7F4EE` (primary-50)
2. Symbole TSOTSA seul, variante sur fond clair — x 143, y 134, 103×103 px (voir composant `BrandLogo`)
3. Mot « TSOTSA » + pastille « KIDS », variante sur fond clair — x 92, y 291, 206×53 px (voir composant `BrandLogo`)
4. Texte « Bien nourrir, bien suivre. » — x 17, y 346, 356×40 px ; 21 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
5. Bouton « Continuer avec Google » — x 17, y 415, 356×63 px ; fond `#FFFFFF` (white) ; texte 19 px gras `#17302A` (text) centré ; rayon 11 px ; bordure 1 px `#D5DEDA` (border) → ouvre **Connexion Google** (`u_google`)
6. Icône FontAwesome 5 solid `google` (react-icons : `FaGoogle`) — x 36, y 432, 30 px, couleur `#4285F4`
7. Bouton « Continuer avec mon téléphone » — x 17, y 492, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Connexion téléphone** (`u_signup`)
8. Icône FontAwesome 5 solid `mobile-alt` (react-icons : `FaMobileAlt`) — x 36, y 509, 30 px, couleur `#FFFFFF` (white)
9. Bouton « Continuer avec mon e-mail » — x 17, y 569, 356×63 px ; fond `#FFFFFF` (white) ; texte 19 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Connexion e-mail** (`u_email`)
10. Icône FontAwesome 5 solid `envelope` (react-icons : `FaEnvelope`) — x 36, y 586, 30 px, couleur `#0F7B5F` (primary (vert))
11. Texte « Un seul compte pour toute la famille. » — x 17, y 639, 356×32 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
12. Texte « Français ▾ » — x 17, y 685, 356×32 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre

Interactions :
- « Continuer avec Google » → ouvre **Connexion Google** (`u_google`)
- « Continuer avec mon téléphone » → ouvre **Connexion téléphone** (`u_signup`)
- « Continuer avec mon e-mail » → ouvre **Connexion e-mail** (`u_email`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Avec Google, le serveur vérifie le jeton d'identité Google puis crée ou retrouve le compte. Avec le téléphone, un code à usage unique est envoyé par SMS. Un seul compte suffit pour toute la famille.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M02 · Connexion avec Google (`u_google`)

Référence : `mobile/u_google.png` · cas d'usage : UC-02 bis · Se connecter avec Google

```text
Recrée À L'IDENTIQUE l'écran « Connexion avec Google » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_google.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Choisit son compte Google dans la fenêtre du téléphone. C'est tout : pas de code, pas de mot de passe.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
Pas d'en-tête sur cet écran.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle — x 0, y 32, 390×711 px ; fond `#5B6662` (overlay)
2. Rectangle arrondi — x 0, y 301, 390×443 px ; fond `#FFFFFF` (white) ; rayon 23 px — dans l'élément n° 1
3. Icône FontAwesome 5 solid `google` (react-icons : `FaGoogle`) — x 176, y 323, 39 px, couleur `#4285F4` — dans l'élément n° 2
4. Texte « Choisir un compte » — x 17, y 375, 356×46 px ; 24 px gras (700), couleur `#17302A` (text), aligné au centre — dans l'élément n° 2
5. Texte « pour continuer vers TSOTSA Kids » — x 17, y 418, 356×34 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 2
6. Carte de liste « Compte Google de démo » / sous-titre « parent.demo@gmail.com » — x 17, y 467, 356×80 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `user-circle` (react-icons : `FaUserCircle`) 32 px `#5B6B66` (text-muted) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous ; chevron « › » 25 px `#8A9893` (text-subtle) à droite → ouvre **Modules** (`u_modules`) — dans l'élément n° 2
7. Texte « Je suis soignant › » — x 17, y 570, 356×34 px ; 18 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné au centre → ouvre **Compte en attente** (`s_pending`) (zone tactile = l'élément entier) — dans l'élément n° 2
8. Texte « Google partagera votre nom, votre adresse e-mail et votre photo avec TSOTSA Kids. » — x 17, y 622, 356×52 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 2

Interactions :
- « Compte Google de démo » → ouvre **Modules** (`u_modules`)
- « Je suis soignant » → ouvre **Compte en attente** (`s_pending`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : L'application reçoit un jeton d'identité Google, le serveur le vérifie, puis crée le compte (première fois) ou retrouve le compte existant. Un soignant qui se connecte avec Google passe aussi par la vérification de son identité professionnelle.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M03 · Connexion par téléphone (`u_signup`)

Référence : `mobile/u_signup.png` · cas d'usage : UC-02 · S'inscrire ou se connecter par téléphone

```text
Recrée À L'IDENTIQUE l'écran « Connexion par téléphone » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_signup.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Saisit son numéro de téléphone et dit qui il est : utilisateur ou soignant.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Mon numéro » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Champ « Numéro de téléphone » — bloc x 17, y 123, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 151, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « +237  6XX XX XX XX » 18 px `#8A9893` (text-subtle) (texte indicatif)
2. Texte « Je m'inscris : » — x 17, y 243, 356×34 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche
3. Carte de liste « Pour moi ou un proche » / sous-titre « Enfant, adulte, parent âgé… » — x 17, y 283, 356×92 px ; fond `#E7F4EE` (primary-50), bordure 1 px `#0F7B5F` (primary (vert)), rayon 9 px ; icône à gauche FontAwesome 5 solid `user-friends` (react-icons : `FaUserFriends`) 32 px `#0F7B5F` (primary (vert)) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous ; chevron « › » 25 px `#8A9893` (text-subtle) à droite → ouvre **Code SMS** (`u_otp`)
4. Carte de liste « Je suis soignant » / sous-titre « Vérification par notre équipe » — x 17, y 390, 356×92 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `user-md` (react-icons : `FaUserMd`) 32 px `#1F5FA8` (care (bleu soignant)) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous ; chevron « › » 25 px `#8A9893` (text-subtle) à droite → ouvre **Compte en attente** (`s_pending`)
5. Texte « En continuant, j'accepte les conditions d'utilisation et la politique de confidentialité. » — x 17, y 507, 356×52 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
6. Bouton « Continuer » — x 17, y 587, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Code SMS** (`u_otp`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Accueil** (`u_welcome`)
- « Pour moi ou un proche » → ouvre **Code SMS** (`u_otp`)
- « Je suis soignant » → ouvre **Compte en attente** (`s_pending`)
- « Continuer » → ouvre **Code SMS** (`u_otp`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le compte est créé. Un code est envoyé par SMS pour vérifier le numéro. Un compte soignant est bloqué tant que notre équipe ne l'a pas vérifié.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M04 · Connexion par e-mail (`u_email`)

Référence : `mobile/u_email.png` · cas d'usage : UC-02 ter · S'inscrire ou se connecter par e-mail

```text
Recrée À L'IDENTIQUE l'écran « Connexion par e-mail » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_email.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Saisit l'adresse e-mail de son choix et un mot de passe. À la création du compte, il confirme son adresse grâce à un lien reçu par e-mail.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Mon e-mail » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 176×46 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
2. Texte « Se connecter » — x 17, y 117, 176×46 px ; 18 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 1
3. Rectangle arrondi — x 197, y 117, 176×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px → ouvre **Connexion e-mail** (`u_email`) (zone tactile = l'élément entier)
4. Texte « Créer un compte » — x 197, y 117, 176×46 px ; 18 px normal (400), couleur `#17302A` (text), aligné au centre → ouvre **Connexion e-mail** (`u_email`) (zone tactile = l'élément entier) — dans l'élément n° 3
5. Champ « Adresse e-mail » — bloc x 17, y 186, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 214, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « nom@exemple.com » 18 px `#8A9893` (text-subtle) (texte indicatif)
6. Champ « Mot de passe » — bloc x 17, y 266, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 294, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « •••••••••• » 18 px `#17302A` (text)
7. Texte « 8 caractères minimum » — x 17, y 342, 206×29 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
8. Texte « Mot de passe oublié ? » — x 201, y 342, 172×29 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite
9. Bouton « Continuer » — x 17, y 398, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Modules** (`u_modules`)
10. Texte « Je suis soignant › » — x 17, y 484, 356×34 px ; 18 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné au centre → ouvre **Compte en attente** (`s_pending`) (zone tactile = l'élément entier)
11. Rectangle arrondi — x 17, y 541, 356×86 px ; fond `#F1F3F2` (neutral-100) ; rayon 9 px
12. Texte « Votre mot de passe est chiffré : personne, même notre équipe, ne peut le lire. » — x 80, y 541, 281×86 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
13. Icône FontAwesome 5 solid `lock` (react-icons : `FaLock`) — x 34, y 567, 32 px, couleur `#5B6B66` (text-muted) — dans l'élément n° 11

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Accueil** (`u_welcome`)
- « Créer un compte » → ouvre **Connexion e-mail** (`u_email`)
- « Continuer » → ouvre **Modules** (`u_modules`)
- « Je suis soignant » → ouvre **Compte en attente** (`s_pending`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le mot de passe n'est jamais stocké en clair : le serveur n'enregistre que son empreinte bcrypt (facteur de coût 12). Tentatives limitées, lien de confirmation et de réinitialisation à usage unique, valable 30 minutes.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M05 · Code de vérification (`u_otp`)

Référence : `mobile/u_otp.png` · cas d'usage : UC-02 · S'inscrire (suite)

```text
Recrée À L'IDENTIQUE l'écran « Code de vérification » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_otp.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Saisit le code à 6 chiffres reçu par SMS.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Vérification » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Entrez le code reçu par SMS au +237 6XX XX XX XX » — x 17, y 140, 356×57 px ; 19 px normal (400), couleur `#17302A` (text), aligné au centre
2. Rectangle arrondi — x 23, y 226, 48×63 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
3. Texte « • » — x 23, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
4. Rectangle arrondi — x 81, y 226, 48×63 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
5. Texte « • » — x 81, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
6. Rectangle arrondi — x 140, y 226, 48×63 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
7. Texte « • » — x 140, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
8. Rectangle arrondi — x 198, y 226, 48×63 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
9. Texte « • » — x 198, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
10. Rectangle arrondi — x 257, y 226, 48×63 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
11. Texte «  » — x 257, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
12. Rectangle arrondi — x 315, y 226, 48×63 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
13. Texte «  » — x 315, y 226, 48×63 px ; 32 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre
14. Texte « Renvoyer le code (0:42) » — x 17, y 318, 356×34 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
15. Bouton « Valider » — x 17, y 415, 356×69 px ; fond `#0F7B5F` (primary (vert)) ; texte 22 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Modules** (`u_modules`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Connexion téléphone** (`u_signup`)
- « Valider » → ouvre **Modules** (`u_modules`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le serveur vérifie le code, active le compte et ouvre une session sécurisée sur le téléphone.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M06 · Choix du module (`u_modules`)

Référence : `mobile/u_modules.png` · cas d'usage : UC-03 · Choisir un module

```text
Recrée À L'IDENTIQUE l'écran « Choix du module » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_modules.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Choisit le module Nutrition. HTA et Diabète sont visibles mais pas encore disponibles.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Bonjour » 22 px gras blanc, centré ; à droite : icône FontAwesome 5 solid `wifi` (react-icons : `FaWifi`) 32 px blanche, x 337 (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Modules » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Que voulez-vous suivre ? » — x 17, y 117, 356×40 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 17, y 169, 356×184 px ; fond `#0F7B5F` (primary (vert)) ; rayon 14 px → ouvre **Personnes suivies** (`u_persons`) (zone tactile = l'élément entier)
3. Texte « Nutrition » — x 132, y 192, 229×52 px ; 32 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 2
4. Icône FontAwesome 5 solid `apple-alt` (react-icons : `FaAppleAlt`) — x 46, y 197, 69 px, couleur `#FFFFFF` (white) — dans l'élément n° 2
5. Texte « Produits, aliments locaux, suivi des prises » — x 132, y 243, 229×69 px ; 16 px normal (400), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 2
6. Rectangle arrondi — x 17, y 375, 170×166 px ; fond `#F1F3F2` (neutral-100) ; bordure 1 px `#D5DEDA` (border) ; rayon 14 px → ouvre **Module bientôt** (`u_soon`) (zone tactile = l'élément entier)
7. Icône FontAwesome 5 solid `heartbeat` (react-icons : `FaHeartbeat`) — x 78, y 392, 48 px, couleur `#8A9893` (text-subtle) — dans l'élément n° 6
8. Texte « HTA » — x 17, y 450, 170×34 px ; 21 px gras (700), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 6
9. Pastille « Bientôt » — x 50, y 493, 103×28 px ; fond `#DDE2E0` (neutral-200) ; texte 13 px gras `#5B6B66` (text-muted) centré ; rayon 14 px (forme de pilule) — dans l'élément n° 6
10. Rectangle arrondi — x 203, y 375, 170×166 px ; fond `#F1F3F2` (neutral-100) ; bordure 1 px `#D5DEDA` (border) ; rayon 14 px → ouvre **Module bientôt** (`u_soon`) (zone tactile = l'élément entier)
11. Icône FontAwesome 5 solid `tint` (react-icons : `FaTint`) — x 264, y 392, 48 px, couleur `#8A9893` (text-subtle) — dans l'élément n° 10
12. Texte « Diabète » — x 203, y 450, 170×34 px ; 21 px gras (700), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 10
13. Pastille « Bientôt » — x 236, y 493, 103×28 px ; fond `#DDE2E0` (neutral-200) ; texte 13 px gras `#5B6B66` (text-muted) centré ; rayon 14 px (forme de pilule) — dans l'élément n° 10

Interactions :
- Icône wifi (en-tête, à droite) : État de la connexion → ouvre **Hors ligne** (`u_offline`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Nutrition » → ouvre **Personnes suivies** (`u_persons`)
- « HTA » → ouvre **Module bientôt** (`u_soon`)
- « Diabète » → ouvre **Module bientôt** (`u_soon`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : La liste des modules vient du serveur. Notre équipe active ou désactive chaque module depuis l'administration, sans nouvelle version de l'application.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M07 · Module pas encore disponible (`u_soon`)

Référence : `mobile/u_soon.png` · cas d'usage : UC-03 · Choisir un module (cas « bientôt »)

```text
Recrée À L'IDENTIQUE l'écran « Module pas encore disponible » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_soon.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : A touché HTA. Un message simple explique que le module arrive bientôt.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Bonjour » 22 px gras blanc, centré.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle — x 0, y 99, 390×642 px ; fond `#5B6662` (overlay)
2. Rectangle arrondi — x 17, y 232, 356×298 px ; fond `#FFFFFF` (white) ; rayon 17 px — dans l'élément n° 1
3. Icône FontAwesome 5 solid `heartbeat` (react-icons : `FaHeartbeat`) — x 166, y 255, 57 px, couleur `#C93C3C` (danger) — dans l'élément n° 2
4. Texte « Bientôt disponible » — x 17, y 323, 356×46 px ; 25 px gras (700), couleur `#17302A` (text), aligné au centre — dans l'élément n° 2
5. Texte « Le suivi de la tension artérielle arrive dans une prochaine version. » — x 40, y 369, 310×63 px ; 18 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 2
6. Bouton « Me prévenir » — x 40, y 444, 149×55 px ; fond `#0F7B5F` (primary (vert)) ; texte 18 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Modules** (`u_modules`) — dans l'élément n° 2
7. Bouton « Fermer » — x 201, y 444, 149×55 px ; fond `#FFFFFF` (white) ; texte 18 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Modules** (`u_modules`) — dans l'élément n° 2

Interactions :
- « Me prévenir » → ouvre **Modules** (`u_modules`)
- « Fermer » → ouvre **Modules** (`u_modules`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Rien n'est enregistré. Option possible : noter l'intérêt de l'utilisateur pour le prévenir à l'ouverture du module.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, apparition de la fenêtre superposée en fondu 200 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M08 · Les personnes que je suis (`u_persons`)

Référence : `mobile/u_persons.png` · cas d'usage : UC-04 · Choisir la personne suivie

```text
Recrée À L'IDENTIQUE l'écran « Les personnes que je suis » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_persons.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Choisit pour qui il agit : un enfant, lui-même, un proche. Peut ajouter une nouvelle personne.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Nutrition » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Personnes suivies » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Pour qui ? » — x 17, y 117, 356×40 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Carte de liste « Amina · 1 an 11 mois » / sous-titre « Suivie par le CMA de démo » — x 17, y 163, 356×89 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `child` (react-icons : `FaChild`) 32 px `#0F7B5F` (primary (vert)) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous ; pastille « Démo » en haut à droite (fond `#FFF1E2` (accent-50), texte `#B4610C` (accent-700), 13 px gras) ; chevron « › » 25 px `#8A9893` (text-subtle) à droite → ouvre **Profil** (`u_profile`)
3. Carte de liste « Moi-même · adulte » / sous-titre « Profil à compléter » — x 17, y 264, 356×89 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `user` (react-icons : `FaUser`) 32 px `#8A9893` (text-subtle) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous
4. Rectangle arrondi — x 17, y 376, 356×71 px ; fond `#FFFFFF` (white) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 9 px → ouvre **Ajouter une personne** (`u_addperson`) (zone tactile = l'élément entier)
5. Texte « Ajouter une personne » — x 75, y 376, 275×71 px ; 19 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 4
6. Icône FontAwesome 5 solid `plus` (react-icons : `FaPlus`) — x 34, y 396, 30 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 4
7. Texte « Explorer les produits sans profil  › » — x 17, y 478, 356×40 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre → ouvre **Choisir un produit** (`u_choose`) (zone tactile = l'élément entier)
8. Rectangle arrondi — x 17, y 541, 356×71 px ; fond `#E7F4EE` (primary-50) ; rayon 9 px
9. Texte « Ajoutez les membres de votre famille : pas besoin de leur créer un compte. » — x 31, y 541, 328×71 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 8

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Modules** (`u_modules`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Amina · 1 an 11 mois » → ouvre **Profil** (`u_profile`)
- « Ajouter une personne » → ouvre **Ajouter une personne** (`u_addperson`)
- « Explorer » → ouvre **Choisir un produit** (`u_choose`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le serveur renvoie uniquement les personnes liées à ce compte. Chaque prise et chaque mesure sera rattachée à une personne précise.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M09 · Ajouter une personne suivie (`u_addperson`)

Référence : `mobile/u_addperson.png` · cas d'usage : UC-05 · Inscrire une personne

```text
Recrée À L'IDENTIQUE l'écran « Ajouter une personne suivie » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_addperson.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Ajoute un membre de sa famille (un enfant ici) avec ses informations de base. Aucun compte n'est créé pour cette personne : elle est rattachée au compte du parent et apparaît dans le dossier médical côté soignant.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Ajouter une personne » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Qui ? » — x 17, y 111, 356×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 17, y 142, 115×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
3. Texte « Moi-même » — x 17, y 142, 115×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 2
4. Rectangle arrondi — x 136, y 142, 115×41 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
5. Texte « Un enfant » — x 136, y 142, 115×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 4
6. Rectangle arrondi — x 256, y 142, 115×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
7. Texte « Un proche » — x 256, y 142, 115×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 6
8. Champ « Prénom » — bloc x 17, y 195, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 223, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « Amina » 18 px `#17302A` (text)
9. Champ « Date de naissance » — bloc x 17, y 271, 212×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 299, 212×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « 12/12/2024 » 18 px `#17302A` (text)
10. Texte « Sexe » — x 241, y 271, 126×25 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
11. Rectangle arrondi — x 241, y 298, 132×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
12. Texte « Fille ▾ » — x 252, y 298, 115×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Champ « Poids » — bloc x 17, y 346, 172×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 374, 172×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « 7,0 kg » 18 px `#17302A` (text)
14. Texte « Taille (couchée) » — x 201, y 346, 172×25 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
15. Rectangle arrondi — x 201, y 374, 172×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
16. Texte « 76,0 cm » — x 214, y 374, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
17. Champ « Périmètre brachial (facultatif) » — bloc x 17, y 422, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 450, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « 112 mm » 18 px `#17302A` (text)
18. Texte « Pas de compte à créer : la personne est suivie depuis le vôtre. » — x 17, y 501, 356×34 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche
19. Bouton « Continuer » — x 17, y 564, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Consentement** (`u_consent`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Personnes suivies** (`u_persons`)
- « Continuer » → ouvre **Consentement** (`u_consent`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : L'âge exact est calculé en jours à partir de la date de naissance. Les champs demandés s'adaptent à l'âge : périmètre brachial pour un enfant, IMC pour un adulte.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M10 · Consentement (`u_consent`)

Référence : `mobile/u_consent.png` · cas d'usage : UC-06 · Donner son consentement

```text
Recrée À L'IDENTIQUE l'écran « Consentement » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_consent.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Lit trois phrases simples et donne son accord pour le suivi.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Votre accord » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Les informations d'Amina servent à suivre sa nutrition. » — x 80, y 131, 287×63 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche
2. Icône FontAwesome 5 solid `clipboard-check` (react-icons : `FaClipboardCheck`) — x 23, y 140, 39 px, couleur `#0F7B5F` (primary (vert))
3. Texte « Seul son soignant les voit. » — x 80, y 228, 287×63 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche
4. Icône FontAwesome 5 solid `user-md` (react-icons : `FaUserMd`) — x 23, y 237, 39 px, couleur `#0F7B5F` (primary (vert))
5. Texte « Vous pouvez retirer votre accord à tout moment. » — x 80, y 326, 287×63 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche
6. Icône FontAwesome 5 solid `undo` (react-icons : `FaUndo`) — x 23, y 335, 39 px, couleur `#0F7B5F` (primary (vert))
7. Texte « J'ai lu et j'accepte pour Amina » — x 61, y 440, 298×37 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
8. Rectangle arrondi — x 17, y 444, 30×30 px ; fond `#0F7B5F` (primary (vert)) ; rayon 5 px
9. Texte « ✓ » — x 17, y 444, 30×30 px ; 18 px gras (700), couleur `#FFFFFF` (white), aligné au centre
10. Texte « Lire le texte complet » — x 17, y 490, 356×34 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche
11. Bouton « J'accepte » — x 17, y 564, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Profil** (`u_profile`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Ajouter une personne** (`u_addperson`)
- « J'accepte » → ouvre **Profil** (`u_profile`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le consentement est enregistré avec la date, la version du texte et la personne concernée. Il peut être retiré à tout moment. Rien n'est visible par un soignant sans cet accord.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M11 · Profil de la personne suivie (`u_profile`)

Référence : `mobile/u_profile.png` · cas d'usage : UC-07 · Voir le suivi d'une personne

```text
Recrée À L'IDENTIQUE l'écran « Profil de la personne suivie » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_profile.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit l'essentiel en un coup d'œil, puis choisit une action : donner un produit ou voir les prises.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Amina » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px) ; à droite : icône FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche, x 337 (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Personnes suivies » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 356×166 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 11 px
2. Texte « Amina » — x 120, y 131, 184×34 px ; 24 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Cercle / ellipse — x 34, y 134, 71×71 px ; fond `#E7F4EE` (primary-50) — dans l'élément n° 1
4. Pastille « Démo » — x 287, y 134, 69×25 px ; fond `#FFF1E2` (accent-50) ; texte 13 px gras `#B4610C` (accent-700) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 1
5. Icône FontAwesome 5 solid `child` (react-icons : `FaChild`) — x 52, y 151, 37 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 1
6. Texte « Fille · 1 an 11 mois » — x 120, y 165, 184×29 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
7. Pastille « À surveiller » — x 34, y 220, 178×32 px ; fond `#FFF4D6` (warning-50) ; texte 16 px gras `#B7791F` (warning) centré ; rayon 16 px (forme de pilule) — dans l'élément n° 1
8. Texte « Dernière visite : 29/10 · 7,9 kg » — x 34, y 252, 321×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
9. Rectangle arrondi — x 17, y 301, 356×63 px ; fond `#E7F4EE` (primary-50) ; rayon 9 px
10. Texte « Prochain rendez-vous : 12 novembre » — x 34, y 301, 321×63 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 9
11. Bouton « Donner un produit » — x 17, y 387, 356×86 px ; fond `#0F7B5F` (primary (vert)) ; texte 24 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Choisir un produit** (`u_choose`)
12. Bouton « Mes prises » — x 17, y 490, 356×69 px ; fond `#FFFFFF` (white) ; texte 21 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Historique** (`u_history`)
13. Bouton « Rappels : 08:00 · 12:30 · 18:00 » — x 17, y 576, 356×63 px ; fond `#E7F4EE` (primary-50) ; texte 18 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px → ouvre **Heures prévues** (`u_schedule`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Personnes suivies** (`u_persons`)
- Icône bell (en-tête, à droite) : Notifications → ouvre **Mes notifications** (`u_notif_center`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Donner un produit » → ouvre **Choisir un produit** (`u_choose`)
- « Mes prises » → ouvre **Historique** (`u_history`)
- « Rappels : 08:00 · 12:30 · 18:00 » → ouvre **Heures prévues** (`u_schedule`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le statut affiché vient de la dernière évaluation faite par le soignant. Le parent voit un message simple, sans chiffre de z-score.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M12 · Choisir un produit (`u_choose`)

Référence : `mobile/u_choose.png` · cas d'usage : UC-08 · Consulter un produit

```text
Recrée À L'IDENTIQUE l'écran « Choisir un produit » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_choose.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Ouvre la liste des produits. Sa région est déjà renseignée.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Choisir un produit » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Choisir un produit » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Pastille « Pour : Amina » — x 17, y 117, 161×34 px ; fond `#E7F4EE` (primary-50) ; texte 16 px gras `#0F7B5F` (primary (vert)) centré ; rayon 17 px (forme de pilule)
2. Pastille « Ma région : Ouest » — x 189, y 117, 184×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
3. Rectangle arrondi — x 17, y 174, 356×71 px ; fond `#FFFFFF` (white) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 9 px → ouvre **Liste des produits** (`u_dropdown`) (zone tactile = l'élément entier)
4. Texte « Choisir un produit » — x 34, y 174, 275×71 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
5. Texte « ▾ » — x 327, y 174, 34×71 px ; 25 px normal (400), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 3
6. Icône FontAwesome 5 solid `search` (react-icons : `FaSearch`) — x 166, y 295, 57 px, couleur `#BFE3D3` (primary-200)
7. Texte « Choisissez un produit pour voir sa composition et les aliments locaux équivalents. » — x 40, y 364, 310×69 px ; 18 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
8. Texte « + Ajouter mon produit » — x 17, y 473, 356×46 px ; 19 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre → ouvre **Ajouter mon produit** (`u_addproduct`) (zone tactile = l'élément entier)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Profil** (`u_profile`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Ouvrir la liste » → ouvre **Liste des produits** (`u_dropdown`)
- « Ajouter mon produit » → ouvre **Ajouter mon produit** (`u_addproduct`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : La liste des produits de référence est tenue à jour par notre équipe (composition et source). Les produits ajoutés par l'utilisateur apparaissent aussi.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M13 · Liste des produits (`u_dropdown`)

Référence : `mobile/u_dropdown.png` · cas d'usage : UC-08 · Consulter un produit (liste ouverte)

```text
Recrée À L'IDENTIQUE l'écran « Liste des produits » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_dropdown.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit les produits de référence et ses propres produits, puis en choisit un.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Choisir un produit » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Choisir un produit » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Pastille « Pour : Amina » — x 17, y 117, 161×34 px ; fond `#E7F4EE` (primary-50) ; texte 16 px gras `#0F7B5F` (primary (vert)) centré ; rayon 17 px (forme de pilule)
2. Pastille « Ma région : Ouest » — x 189, y 117, 184×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
3. Rectangle arrondi — x 17, y 174, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 9 px
4. Texte « Choisir un produit » — x 34, y 174, 275×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
5. Texte « ▴ » — x 327, y 174, 34×57 px ; 25 px normal (400), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 3
6. Rectangle arrondi — x 17, y 234, 356×424 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
7. Texte « PRODUITS DE RÉFÉRENCE » — x 34, y 241, 287×29 px ; 13 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
8. Zone tactile « F-75 » — x 17, y 272, 356×60 px → ouvre **F-75 (hôpital)** (`u_f75`) — dans l'élément n° 6
9. Texte « F-75 » — x 40, y 272, 287×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
10. Texte « Lait thérapeutique · à l'hôpital » — x 40, y 303, 310×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
11. Texte « F-100 » — x 40, y 335, 287×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
12. Texte « Lait thérapeutique · à l'hôpital » — x 40, y 366, 310×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
13. Rectangle arrondi — x 23, y 398, 344×60 px ; fond `#E7F4EE` (primary-50) ; rayon 6 px → ouvre **Produit + équivalents** (`u_product`) (zone tactile = l'élément entier) — dans l'élément n° 6
14. Texte « Plumpy'Nut » — x 40, y 398, 287×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 13
15. Texte « Pâte prête à l'emploi (ATPE) » — x 40, y 429, 310×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 13
16. Texte « Plumpy'Sup » — x 40, y 461, 287×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
17. Texte « Supplément prêt à l'emploi » — x 40, y 492, 310×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
18. Texte « MES PRODUITS » — x 34, y 528, 287×29 px ; 13 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
19. Zone tactile « Farine infantile enrichie » — x 17, y 553, 356×41 px → ouvre **Équivalents de mon produit** (`u_myproduct_eq`) — dans l'élément n° 6
20. Texte « Farine infantile enrichie » — x 40, y 556, 229×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
21. Pastille « En vérification » — x 264, y 561, 98×25 px ; fond `#FFF4D6` (warning-50) ; texte 11 px gras `#B7791F` (warning) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 6
22. Zone tactile « Ajouter mon produit » — x 17, y 601, 356×46 px → ouvre **Ajouter mon produit** (`u_addproduct`) — dans l'élément n° 6
23. Texte « + Ajouter mon produit » — x 40, y 604, 287×40 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 6

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « F-75 » → ouvre **F-75 (hôpital)** (`u_f75`)
- « Plumpy'Nut » → ouvre **Produit + équivalents** (`u_product`)
- « Farine infantile enrichie » → ouvre **Équivalents de mon produit** (`u_myproduct_eq`)
- « Ajouter mon produit » → ouvre **Ajouter mon produit** (`u_addproduct`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les produits « en vérification » sont visibles seulement par la personne qui les a ajoutés, jusqu'à leur vérification par notre équipe.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M14 · Produit hospitalier : F-75 (`u_f75`)

Référence : `mobile/u_f75.png` · cas d'usage : UC-09 · Consulter un produit thérapeutique hospitalier

```text
Recrée À L'IDENTIQUE l'écran « Produit hospitalier : F-75 » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_f75.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Consulte la composition du F-75. Un message rappelle qu'il s'utilise à l'hôpital.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « F-75 » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Choisir un produit » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 356×80 px ; fond `#FDECEC` (danger-50) ; rayon 9 px
2. Texte « Lait thérapeutique de stabilisation, donné à l'hôpital sous surveillance médicale. » — x 31, y 117, 328×80 px ; 16 px gras (700), couleur `#C93C3C` (danger), aligné à gauche — dans l'élément n° 1
3. Texte « Composition pour 100 ml » — x 17, y 214, 356×34 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche
4. Rectangle — x 17, y 255, 356×38 px ; fond `#F7F9F8` (surface-2)
5. Texte « Énergie » — x 31, y 255, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
6. Texte « 75 kcal » — x 189, y 255, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
7. Texte « Protéines » — x 31, y 292, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
8. Texte « 0,9 g » — x 189, y 292, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
9. Rectangle — x 17, y 330, 356×38 px ; fond `#F7F9F8` (surface-2)
10. Texte « Lactose » — x 31, y 330, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
11. Texte « 1,3 g » — x 189, y 330, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
12. Texte « Potassium » — x 31, y 368, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
13. Texte « 3,6 mmol » — x 189, y 368, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
14. Rectangle — x 17, y 406, 356×38 px ; fond `#F7F9F8` (surface-2)
15. Texte « Sodium » — x 31, y 406, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
16. Texte « 0,6 mmol » — x 189, y 406, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
17. Texte « Magnésium » — x 31, y 444, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
18. Texte « 0,43 mmol » — x 189, y 444, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
19. Rectangle — x 17, y 482, 356×38 px ; fond `#F7F9F8` (surface-2)
20. Texte « Zinc » — x 31, y 482, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
21. Texte « 2,0 mg » — x 189, y 482, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
22. Texte « Cuivre » — x 31, y 520, 161×38 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
23. Texte « 0,25 mg » — x 189, y 520, 170×38 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite
24. Texte « Source : OMS, prise en charge de la malnutrition sévère (1999). À confirmer par la référente médicale. » — x 17, y 564, 356×46 px ; 13 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche
25. Bouton « Choisir un autre produit » — x 17, y 616, 356×52 px ; fond `#FFFFFF` (white) ; texte 18 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Liste des produits** (`u_dropdown`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Liste des produits** (`u_dropdown`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Choisir un autre produit » → ouvre **Liste des produits** (`u_dropdown`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Composition pour 100 ml de lait reconstitué, saisie par notre équipe avec sa source officielle. Les équivalents locaux sont masqués par défaut pour ce produit (décision à valider).

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M15 · Produit et équivalents locaux (`u_product`)

Référence : `mobile/u_product.png` · cas d'usage : UC-10 · Voir les équivalents locaux d'un produit

```text
Recrée À L'IDENTIQUE l'écran « Produit et équivalents locaux » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_product.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit la composition, le coût, puis la liste des aliments locaux classés. Peut filtrer par région, changer les nutriments, ou donner le produit à Amina.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Plumpy'Nut » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 111, 356×184 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Plumpy'Nut » — x 31, y 115, 252×37 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Texte « Détails › » — x 270, y 117, 92×34 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite — dans l'élément n° 1
4. Texte « ATPE · pour 100 g » — x 31, y 149, 252×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
5. Texte « Énergie » — x 31, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Texte « 520–550 kcal » — x 102, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
7. Texte « Protéines » — x 200, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
8. Texte « ≈ 13–16 g » — x 271, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
9. Texte « Lipides » — x 31, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
10. Texte « ≈ 26–37 g » — x 102, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
11. Texte « Fer » — x 200, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
12. Texte « 10–14 mg » — x 271, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
13. Rectangle arrondi — x 26, y 255, 337×32 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 1
14. Texte « Coût : prix non renseigné pour l'Ouest » — x 34, y 255, 321×32 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
15. Texte « Aliments locaux équivalents » — x 17, y 303, 356×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche
16. Pastille « Nutriments : 3 ✎ » — x 17, y 337, 184×30 px ; fond `#E7F4EE` (primary-50) ; texte 14 px gras `#0F7B5F` (primary (vert)) centré ; rayon 15 px (forme de pilule)
17. Zone tactile « Nutriments » — x 17, y 337, 184×30 px → ouvre **Nutriments** (`u_nutrients`)
18. Pastille « Toutes régions ▾ » — x 212, y 337, 161×30 px ; fond `#F1F3F2` (neutral-100) ; texte 14 px gras `#17302A` (text) centré ; rayon 15 px (forme de pilule)
19. Zone tactile « Région » — x 212, y 337, 161×30 px → ouvre **Filtre région** (`u_region`)
20. Rectangle arrondi — x 17, y 379, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
21. Texte « 1 » — x 23, y 379, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 20
22. Texte « Graines de courge » — x 57, y 382, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
23. Pastille « 3/3 » — x 252, y 385, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 20
24. Texte « Ouest ✓ » — x 57, y 408, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 20
25. Rectangle arrondi — x 17, y 440, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
26. Texte « 2 » — x 23, y 440, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 25
27. Texte « Sésame » — x 57, y 444, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 25
28. Pastille « 3/3 » — x 252, y 447, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 25
29. Texte « Autres régions » — x 57, y 470, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 25
30. Texte « + calcium » — x 229, y 473, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 25
31. Rectangle arrondi — x 17, y 502, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px → ouvre **Détail aliment** (`u_food`) (zone tactile = l'élément entier)
32. Texte « 3 » — x 23, y 502, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 31
33. Texte « › » — x 348, y 502, 23×57 px ; 24 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 31
34. Texte « Arachide » — x 57, y 506, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 31
35. Pastille « 3/3 » — x 252, y 509, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 31
36. Texte « Ouest ✓ » — x 57, y 532, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 31
37. Texte « + calcium » — x 229, y 535, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 31
38. Rectangle arrondi — x 17, y 564, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
39. Texte « 4 » — x 23, y 564, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 38
40. Texte « Soja » — x 57, y 568, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 38
41. Pastille « 3/3 » — x 252, y 571, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 38
42. Texte « Ouest ✓ » — x 57, y 594, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 38
43. Texte « + calcium » — x 229, y 596, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 38
44. Bouton « Donner à Amina » — x 252, y 619, 120×46 px ; fond `#0F7B5F` (primary (vert)) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`)
45. Texte « Voir les 7 résultats · Version web › » — x 17, y 625, 229×23 px ; 13 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche → ouvre **Version web utilisateur** (`w_nutrition`) (zone tactile = l'élément entier)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Liste des produits** (`u_dropdown`)
- « Nutriments » → ouvre **Nutriments** (`u_nutrients`)
- « Région » → ouvre **Filtre région** (`u_region`)
- « Arachide » → ouvre **Détail aliment** (`u_food`)
- « Version web » → ouvre **Version web utilisateur** (`w_nutrition`)
- « Donner à Amina » → ouvre **Confirmer la prise** (`u_give`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le moteur compare les nutriments essentiels (protéines, lipides, fer) aux aliments de notre base (données extraites d'ORKG à la main, puis validées). Classement : nombre de nutriments en commun, puis le moins de nutriments en plus, puis la proximité des teneurs.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M16 · Filtre par région (`u_region`)

Référence : `mobile/u_region.png` · cas d'usage : UC-11 · Filtrer les équivalents par région

```text
Recrée À L'IDENTIQUE l'écran « Filtre par région » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_region.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Choisit « Ouest uniquement » : seuls les aliments disponibles dans sa région restent affichés.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Plumpy'Nut » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 111, 356×184 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Plumpy'Nut » — x 31, y 115, 252×37 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Texte « Détails › » — x 270, y 117, 92×34 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite — dans l'élément n° 1
4. Texte « ATPE · pour 100 g » — x 31, y 149, 252×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
5. Texte « Énergie » — x 31, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Texte « 520–550 kcal » — x 102, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
7. Texte « Protéines » — x 200, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
8. Texte « ≈ 13–16 g » — x 271, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
9. Texte « Lipides » — x 31, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
10. Texte « ≈ 26–37 g » — x 102, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
11. Texte « Fer » — x 200, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
12. Texte « 10–14 mg » — x 271, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
13. Rectangle arrondi — x 26, y 255, 337×32 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 1
14. Texte « Coût : prix non renseigné pour l'Ouest » — x 34, y 255, 321×32 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
15. Texte « Aliments locaux équivalents » — x 17, y 303, 356×32 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche
16. Pastille « Ouest uniquement ✕ » — x 17, y 337, 184×30 px ; fond `#0F7B5F` (primary (vert)) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 15 px (forme de pilule)
17. Zone tactile « Retirer le filtre » — x 17, y 337, 184×30 px → ouvre **Produit + équivalents** (`u_product`)
18. Pastille « Changer ▾ » — x 212, y 337, 161×30 px ; fond `#F1F3F2` (neutral-100) ; texte 14 px gras `#17302A` (text) centré ; rayon 15 px (forme de pilule)
19. Zone tactile « Changer de région » — x 212, y 337, 161×30 px → ouvre **Aucun résultat** (`u_empty`)
20. Rectangle arrondi — x 17, y 379, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
21. Texte « 1 » — x 23, y 379, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 20
22. Texte « Graines de courge » — x 57, y 382, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
23. Pastille « 3/3 » — x 252, y 385, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 20
24. Texte « Disponible dans l'Ouest » — x 57, y 408, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 20
25. Rectangle arrondi — x 17, y 440, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px → ouvre **Détail aliment** (`u_food`) (zone tactile = l'élément entier)
26. Texte « 2 » — x 23, y 440, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 25
27. Texte « › » — x 348, y 440, 23×57 px ; 24 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 25
28. Texte « Arachide » — x 57, y 444, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 25
29. Pastille « 3/3 » — x 252, y 447, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 25
30. Texte « Disponible dans l'Ouest » — x 57, y 470, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 25
31. Texte « + calcium » — x 229, y 473, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 25
32. Rectangle arrondi — x 17, y 502, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
33. Texte « 3 » — x 23, y 502, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 32
34. Texte « Soja » — x 57, y 506, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 32
35. Pastille « 3/3 » — x 252, y 509, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 32
36. Texte « Disponible dans l'Ouest » — x 57, y 532, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 32
37. Texte « + calcium » — x 229, y 535, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 32
38. Rectangle arrondi — x 17, y 564, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
39. Texte « 4 » — x 23, y 564, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 38
40. Texte « Niébé » — x 57, y 568, 195×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 38
41. Pastille « 2/3 » — x 252, y 571, 55×23 px ; fond `#FFF4D6` (warning-50) ; texte 13 px gras `#B7791F` (warning) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 38
42. Texte « Disponible dans l'Ouest » — x 57, y 594, 195×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 38
43. Texte « + calcium » — x 229, y 596, 115×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 38
44. Bouton « Donner à Amina » — x 252, y 619, 120×46 px ; fond `#0F7B5F` (primary (vert)) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`)
45. Texte « 5 aliments disponibles dans l'Ouest » — x 17, y 625, 229×23 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Liste des produits** (`u_dropdown`)
- « Retirer le filtre » → ouvre **Produit + équivalents** (`u_product`)
- « Changer de région » → ouvre **Aucun résultat** (`u_empty`)
- « Arachide » → ouvre **Détail aliment** (`u_food`)
- « Donner à Amina » → ouvre **Confirmer la prise** (`u_give`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Chaque aliment est relié aux régions où il est disponible (données à collecter avec les partenaires). En mode normal, ces aliments sont seulement classés en premier.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M17 · Aucun résultat (`u_empty`)

Référence : `mobile/u_empty.png` · cas d'usage : UC-11 · Filtre par région (cas sans résultat)

```text
Recrée À L'IDENTIQUE l'écran « Aucun résultat » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_empty.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : A choisi « Extrême-Nord uniquement ». Aucun aliment n'est encore renseigné pour cette région.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Plumpy'Nut » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 111, 356×184 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Plumpy'Nut » — x 31, y 115, 252×37 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Texte « Détails › » — x 270, y 117, 92×34 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite — dans l'élément n° 1
4. Texte « ATPE · pour 100 g » — x 31, y 149, 252×25 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
5. Texte « Énergie » — x 31, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Texte « 520–550 kcal » — x 102, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
7. Texte « Protéines » — x 200, y 178, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
8. Texte « ≈ 13–16 g » — x 271, y 178, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
9. Texte « Lipides » — x 31, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
10. Texte « ≈ 26–37 g » — x 102, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
11. Texte « Fer » — x 200, y 214, 86×34 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
12. Texte « 10–14 mg » — x 271, y 214, 92×34 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
13. Rectangle arrondi — x 26, y 255, 337×32 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 1
14. Texte « Coût : prix non renseigné pour l'Ouest » — x 34, y 255, 321×32 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
15. Pastille « Extrême-Nord uniquement ✕ » — x 17, y 312, 229×30 px ; fond `#0F7B5F` (primary (vert)) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 15 px (forme de pilule)
16. Zone tactile « Retirer le filtre » — x 17, y 312, 229×30 px → ouvre **Produit + équivalents** (`u_product`)
17. Icône FontAwesome 5 solid `map-marker-alt` (react-icons : `FaMapMarkerAlt`) — x 166, y 375, 57 px, couleur `#BFE3D3` (primary-200)
18. Texte « Aucun aliment local n'est encore renseigné pour cette région. » — x 34, y 444, 321×63 px ; 18 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
19. Bouton « Afficher toutes les régions » — x 17, y 530, 356×57 px ; fond `#0F7B5F` (primary (vert)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Produit + équivalents** (`u_product`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Filtre région** (`u_region`)
- « Retirer le filtre » → ouvre **Produit + équivalents** (`u_product`)
- « Afficher toutes les régions » → ouvre **Produit + équivalents** (`u_product`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Pas de faux exemple : l'application dit honnêtement qu'il n'y a pas encore de donnée, et propose d'élargir la recherche.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M18 · Détail d'un aliment local (`u_food`)

Référence : `mobile/u_food.png` · cas d'usage : UC-12 · Comparer un aliment local au produit

```text
Recrée À L'IDENTIQUE l'écran « Détail d'un aliment local » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_food.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Compare l'arachide au Plumpy'Nut, nutriment par nutriment, et voit la source scientifique.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Arachide » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Graine crue · pour 100 g » — x 17, y 111, 356×32 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
2. Pastille « 3/3 nutriments » — x 247, y 114, 126×28 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 14 px (forme de pilule)
3. Rectangle — x 17, y 157, 356×37 px ; fond `#0F7B5F` (primary (vert))
4. Texte « Nutriment » — x 26, y 157, 115×37 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche
5. Texte « Plumpy'Nut » — x 143, y 157, 115×37 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche
6. Texte « Arachide » — x 260, y 157, 115×37 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche
7. Rectangle — x 17, y 194, 356×41 px ; fond `#F7F9F8` (surface-2)
8. Texte « Protéines ★ » — x 26, y 194, 115×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 7
9. Texte « ≈ 13–16 g » — x 143, y 194, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 7
10. Texte « 25,8 g » — x 260, y 194, 109×41 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 7
11. Rectangle — x 17, y 235, 356×41 px ; fond `#FFFFFF` (white)
12. Texte « Lipides ★ » — x 26, y 235, 115×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Texte « ≈ 26–37 g » — x 143, y 235, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
14. Texte « 49,2 g » — x 260, y 235, 109×41 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 11
15. Rectangle — x 17, y 276, 356×41 px ; fond `#F7F9F8` (surface-2)
16. Texte « Fer ★ » — x 26, y 276, 115×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
17. Texte « 10–14 mg » — x 143, y 276, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
18. Texte « 4,6 mg » — x 260, y 276, 109×41 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 15
19. Rectangle — x 17, y 318, 356×41 px ; fond `#FFFFFF` (white)
20. Texte « Calcium » — x 26, y 318, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
21. Texte « 300–600 mg » — x 143, y 318, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
22. Texte « 92 mg » — x 260, y 318, 109×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
23. Rectangle — x 17, y 359, 356×41 px ; fond `#F7F9F8` (surface-2)
24. Texte « Énergie » — x 26, y 359, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 23
25. Texte « 520–550 kcal » — x 143, y 359, 115×41 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 23
26. Texte « 567 kcal » — x 260, y 359, 109×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 23
27. Texte « ★ nutriment essentiel recherché » — x 17, y 404, 356×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
28. Rectangle arrondi — x 17, y 432, 356×69 px ; fond `#F1F3F2` (neutral-100) ; rayon 7 px
29. Texte « Source : article [référence] · comparaison ORKG [identifiant] · validé le [date]. Valeurs de la démo : USDA, indicatives. » — x 29, y 432, 333×69 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 28
30. Encart d'avertissement — x 17, y 513, 356×48 px ; fond `#FFF4D6` (warning-50) ; texte « Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit : demandez l'avis de votre soignant. » 13 px `#7A5300` (warning-900) ; rayon 7 px
31. Bouton « Donner à Amina » — x 17, y 576, 356×57 px ; fond `#0F7B5F` (primary (vert)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Produit + équivalents** (`u_product`)
- « Donner à Amina » → ouvre **Confirmer la prise** (`u_give`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les valeurs viennent de notre base aliments, extraite à la main des comparaisons ORKG puis validée. Chaque valeur garde l'identifiant ORKG et la référence de l'article.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M19 · Choisir les nutriments essentiels (`u_nutrients`)

Référence : `mobile/u_nutrients.png` · cas d'usage : UC-13 · Modifier les nutriments recherchés

```text
Recrée À L'IDENTIQUE l'écran « Choisir les nutriments essentiels » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_nutrients.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Coche ou décoche les nutriments à retrouver dans les aliments locaux.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Nutriments » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « Nutriments à retrouver dans les aliments locaux : » — x 17, y 117, 356×52 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 17, y 177, 356×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
3. Texte « Énergie » — x 72, y 177, 275×46 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 2
4. Rectangle arrondi — x 31, y 187, 25×25 px ; fond `#FFFFFF` (white) ; bordure 1 px `#8A9893` (text-subtle) ; rayon 3 px — dans l'élément n° 2
5. Rectangle arrondi — x 17, y 227, 356×46 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
6. Texte « Protéines » — x 72, y 227, 275×46 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
7. Rectangle arrondi — x 31, y 237, 25×25 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 3 px — dans l'élément n° 5
8. Texte « ✓ » — x 31, y 237, 25×25 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 5
9. Rectangle arrondi — x 17, y 278, 356×46 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
10. Texte « Lipides » — x 72, y 278, 275×46 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 9
11. Rectangle arrondi — x 31, y 288, 25×25 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 3 px — dans l'élément n° 9
12. Texte « ✓ » — x 31, y 288, 25×25 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 9
13. Rectangle arrondi — x 17, y 328, 356×46 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
14. Texte « Fer » — x 72, y 328, 275×46 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 13
15. Rectangle arrondi — x 31, y 338, 25×25 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 3 px — dans l'élément n° 13
16. Texte « ✓ » — x 31, y 338, 25×25 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 13
17. Rectangle arrondi — x 17, y 379, 356×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
18. Texte « Calcium » — x 72, y 379, 275×46 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
19. Rectangle arrondi — x 31, y 389, 25×25 px ; fond `#FFFFFF` (white) ; bordure 1 px `#8A9893` (text-subtle) ; rayon 3 px — dans l'élément n° 17
20. Rectangle arrondi — x 17, y 429, 356×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
21. Texte « Zinc » — x 72, y 429, 275×46 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
22. Rectangle arrondi — x 31, y 439, 25×25 px ; fond `#FFFFFF` (white) ; bordure 1 px `#8A9893` (text-subtle) ; rayon 3 px — dans l'élément n° 20
23. Rectangle arrondi — x 17, y 479, 356×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
24. Texte « Vitamine A » — x 72, y 479, 275×46 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 23
25. Rectangle arrondi — x 31, y 490, 25×25 px ; fond `#FFFFFF` (white) ; bordure 1 px `#8A9893` (text-subtle) ; rayon 3 px — dans l'élément n° 23
26. Texte « Rétablir le choix par défaut » — x 17, y 536, 356×34 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre → ouvre **Produit + équivalents** (`u_product`) (zone tactile = l'élément entier)
27. Bouton « Appliquer » — x 17, y 587, 356×57 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Produit + équivalents** (`u_product`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Produit + équivalents** (`u_product`)
- « Rétablir » → ouvre **Produit + équivalents** (`u_product`)
- « Appliquer » → ouvre **Produit + équivalents** (`u_product`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le choix par défaut est fixé par l'équipe scientifique pour chaque produit. Le changement ne vaut que pour cette recherche.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M20 · Confirmer une prise (`u_give`)

Référence : `mobile/u_give.png` · cas d'usage : UC-14 · Enregistrer ce qui a été donné

```text
Recrée À L'IDENTIQUE l'écran « Confirmer une prise » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_give.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Indique ce qu'il a donné à Amina, combien, quand, et si elle a tout mangé.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Confirmer la prise » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Carte de liste « Pour : Amina » — x 17, y 117, 356×69 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `child` (react-icons : `FaChild`) 32 px `#0F7B5F` (primary (vert)) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text)
2. Carte de liste « Plumpy'Nut » — x 17, y 195, 356×69 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `apple-alt` (react-icons : `FaAppleAlt`) 32 px `#0F7B5F` (primary (vert)) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text)
3. Texte « Quantité » — x 17, y 278, 356×29 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
4. Rectangle arrondi — x 17, y 309, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
5. Texte « 1 sachet » — x 75, y 309, 241×57 px ; 22 px gras (700), couleur `#17302A` (text), aligné au centre — dans l'élément n° 4
6. Bouton « − » — x 26, y 315, 44×44 px ; fond `#E7F4EE` (primary-50) ; texte 25 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px — dans l'élément n° 4
7. Bouton « + » — x 320, y 315, 44×44 px ; fond `#E7F4EE` (primary-50) ; texte 25 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px — dans l'élément n° 4
8. Texte « Quand ? » — x 17, y 381, 356×29 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
9. Rectangle arrondi — x 17, y 410, 356×52 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
10. Texte « Aujourd'hui · 12:30 ▾ » — x 31, y 410, 287×52 px ; 19 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 9
11. Texte « Amina a mangé : » — x 17, y 475, 356×29 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
12. Rectangle arrondi — x 17, y 505, 115×48 px ; fond `#0F7B5F` (primary (vert)) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px
13. Texte « Tout » — x 17, y 505, 115×48 px ; 18 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 12
14. Rectangle arrondi — x 136, y 505, 115×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
15. Texte « La moitié » — x 136, y 505, 115×48 px ; 18 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 14
16. Rectangle arrondi — x 256, y 505, 115×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
17. Texte « Refusé » — x 256, y 505, 115×48 px ; 18 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 16
18. Bouton « Confirmer » — x 17, y 582, 356×69 px ; fond `#0F7B5F` (primary (vert)) ; texte 24 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Prise enregistrée** (`u_given`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Produit + équivalents** (`u_product`)
- « Confirmer » → ouvre **Prise enregistrée** (`u_given`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : La prise est enregistrée sur le téléphone, puis envoyée au serveur (immédiatement, ou dès le retour du réseau). Elle apparaît dans le dossier d'Amina chez le soignant.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M21 · Prise enregistrée (`u_given`)

Référence : `mobile/u_given.png` · cas d'usage : UC-14 · Enregistrer ce qui a été donné (confirmation)

```text
Recrée À L'IDENTIQUE l'écran « Prise enregistrée » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_given.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit une confirmation claire.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
Pas d'en-tête sur cet écran.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Cercle / ellipse — x 120, y 117, 149×149 px ; fond `#0F7B5F` (primary (vert))
2. Icône FontAwesome 5 solid `check` (react-icons : `FaCheck`) — x 155, y 151, 80 px, couleur `#FFFFFF` (white)
3. Texte « Prise enregistrée » — x 17, y 289, 356×52 px ; 29 px gras (700), couleur `#17302A` (text), aligné au centre
4. Texte « Plumpy'Nut · 1 sachet · 12:30 / Amina a tout mangé. » — x 17, y 346, 356×69 px ; 19 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
5. Rectangle arrondi — x 17, y 432, 356×63 px ; fond `#E7F4EE` (primary-50) ; rayon 9 px
6. Texte « Votre soignant est prévenu et la voit dans le suivi d'Amina. » — x 29, y 432, 333×63 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 5
7. Bouton « Retour à Amina » — x 17, y 518, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Profil** (`u_profile`)
8. Bouton « Voir côté soignant → » — x 17, y 599, 356×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Dossier + courbes** (`s_file`)

Interactions :
- « Retour à Amina » → ouvre **Profil** (`u_profile`)
- « Voir côté soignant → » → ouvre **Dossier + courbes** (`s_file`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : La prise est dans le dossier d'Amina. Le soignant reçoit une notification « Amina a reçu Plumpy'Nut » (s'il l'a activée). La relance prévue 30 minutes après l'heure est annulée.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M22 · Historique des prises (`u_history`)

Référence : `mobile/u_history.png` · cas d'usage : UC-15 · Voir l'historique des prises

```text
Recrée À L'IDENTIQUE l'écran « Historique des prises » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_history.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Revoit ce qui a été donné ces derniers jours, et ce qui n'a pas été confirmé.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Prises d'Amina » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).
Barre de navigation du bas : y 679, 390 × 57 px, fond `#F7F9F8` (surface-2), filet haut 1 px `#D5DEDA` (border) ; 4 onglets de 97,5 px : Modules (home), Personnes (users), Produits (apple-alt), Prises (history) ; icône 23 px à 6 px du haut, libellé 13 px dessous ; onglet actif « Historique » en `#0F7B5F` (primary (vert)) gras, les autres en `#8A9893` (text-subtle).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 356×73 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Aujourd'hui 12:30 » — x 75, y 123, 229×32 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Icône FontAwesome 5 solid `check-circle` (react-icons : `FaCheckCircle`) — x 31, y 138, 32 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 1
4. Texte « Plumpy'Nut · 1 sachet · tout » — x 75, y 154, 252×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
5. Rectangle arrondi — x 17, y 200, 356×73 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
6. Texte « Hier 18:00 » — x 75, y 205, 229×32 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
7. Icône FontAwesome 5 solid `check-circle` (react-icons : `FaCheckCircle`) — x 31, y 220, 32 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 5
8. Texte « Plumpy'Nut · 1 sachet · tout » — x 75, y 236, 252×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 5
9. Rectangle arrondi — x 17, y 282, 356×73 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
10. Texte « Hier 12:00 » — x 75, y 288, 229×32 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 9
11. Icône FontAwesome 5 solid `adjust` (react-icons : `FaAdjust`) — x 31, y 303, 32 px, couleur `#B7791F` (warning) — dans l'élément n° 9
12. Texte « Plumpy'Nut · 1 sachet · la moitié » — x 75, y 319, 252×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 9
13. Rectangle arrondi — x 17, y 365, 356×73 px ; fond `#FDECEC` (danger-50) ; bordure 1 px `#F1B5B5` (danger-200) ; rayon 9 px
14. Texte « Avant-hier 18:00 » — x 75, y 370, 229×32 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 13
15. Bouton « Confirmer » — x 270, y 383, 92×37 px ; fond `#C93C3C` (danger) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`) — dans l'élément n° 13
16. Icône FontAwesome 5 solid `exclamation-circle` (react-icons : `FaExclamationCircle`) — x 31, y 385, 32 px, couleur `#C93C3C` (danger) — dans l'élément n° 13
17. Texte « Non confirmée » — x 75, y 401, 252×30 px ; 14 px normal (400), couleur `#C93C3C` (danger), aligné à gauche — dans l'élément n° 13
18. Rectangle arrondi — x 17, y 447, 356×73 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
19. Texte « Avant-hier 12:00 » — x 75, y 453, 229×32 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 18
20. Icône FontAwesome 5 solid `check-circle` (react-icons : `FaCheckCircle`) — x 31, y 468, 32 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 18
21. Texte « Plumpy'Nut · 1 sachet · tout » — x 75, y 484, 252×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 18
22. Texte « Prises des 7 derniers jours : 11 sur 14 (démo) » — x 17, y 541, 356×34 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Profil** (`u_profile`)
- Onglet « Modules » (barre du bas) → ouvre **Modules** (`u_modules`)
- Onglet « Personnes » (barre du bas) → ouvre **Personnes suivies** (`u_persons`)
- Onglet « Produits » (barre du bas) → ouvre **Choisir un produit** (`u_choose`)
- Onglet « Prises » (barre du bas) → ouvre **Historique** (`u_history`)
- « Confirmer » → ouvre **Confirmer la prise** (`u_give`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les prises non confirmées sont signalées au soignant. Le parent peut confirmer une prise oubliée après coup (avec l'heure réelle).

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M23 · Mode hors ligne (`u_offline`)

Référence : `mobile/u_offline.png` · cas d'usage : UC-16 · Utiliser l'application sans réseau

```text
Recrée À L'IDENTIQUE l'écran « Mode hors ligne » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_offline.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Continue d'enregistrer les prises même sans réseau. Voit ce qui attend d'être envoyé.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer (elle affiche « Hors ligne » en rouge sur cet écran). Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Connexion » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 356×69 px ; fond `#FFF4D6` (warning-50) ; rayon 9 px
2. Texte « Pas de réseau. Vos prises sont gardées sur le téléphone. » — x 80, y 117, 281×69 px ; 16 px gras (700), couleur `#7A5300` (warning-900), aligné à gauche — dans l'élément n° 1
3. Icône FontAwesome 5 solid `wifi` (react-icons : `FaWifi`) — x 34, y 134, 34 px, couleur `#B7791F` (warning) — dans l'élément n° 1
4. Texte « En attente d'envoi (2) » — x 17, y 209, 356×34 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche
5. Carte de liste « Amina · Plumpy'Nut · 1 sachet » / sous-titre « Aujourd'hui 12:30 » — x 17, y 249, 356×69 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `clock` (react-icons : `FaClock`) 32 px `#B7791F` (warning) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous
6. Carte de liste « Amina · Plumpy'Nut · 1 sachet » / sous-titre « Hier 18:00 » — x 17, y 327, 356×69 px ; fond `#FFFFFF` (white), bordure 1 px `#D5DEDA` (border), rayon 9 px ; icône à gauche FontAwesome 5 solid `clock` (react-icons : `FaClock`) 32 px `#B7791F` (warning) centrée verticalement à x 14 px du bord ; titre 18 px gras `#17302A` (text), sous-titre 14 px `#5B6B66` (text-muted) juste dessous
7. Texte « Envoi automatique dès le retour du réseau. » — x 17, y 415, 356×34 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
8. Bouton « Réessayer maintenant » — x 17, y 473, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Modules** (`u_modules`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Modules** (`u_modules`)
- « Réessayer maintenant » → ouvre **Modules** (`u_modules`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les prises sont gardées dans le téléphone, dans une file d'attente, puis envoyées automatiquement au retour du réseau, sans doublon. Les produits et aliments déjà consultés restent lisibles.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M24 · Ajouter mon propre produit (`u_addproduct`)

Référence : `mobile/u_addproduct.png` · cas d'usage : UC-17 · Enregistrer un produit personnel

```text
Recrée À L'IDENTIQUE l'écran « Ajouter mon propre produit » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_addproduct.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Saisit le nom et la composition pour 100 g d'un produit qu'il a (lue sur l'étiquette).

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Ajouter mon produit » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Champ « Nom du produit » — bloc x 17, y 111, 356×71 px : libellé en haut (14 px gras `#5B6B66` (text-muted), hauteur 25 px) ; zone de saisie à y 139, 356×44 px, fond `#F7F9F8` (surface-2), bordure 1 px `#D5DEDA` (border), rayon 7 px, marge intérieure 14 px ; valeur « Farine infantile enrichie » 18 px `#17302A` (text)
2. Texte « Composition pour 100 g (étiquette) » — x 17, y 192, 356×29 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
3. Texte « Énergie » — x 17, y 223, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
4. Rectangle arrondi — x 172, y 223, 115×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
5. Texte « 400 » — x 184, y 223, 98×44 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
6. Rectangle arrondi — x 295, y 223, 78×44 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
7. Texte « kcal ▾ » — x 298, y 223, 71×44 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 6
8. Texte « Protéines » — x 17, y 273, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
9. Rectangle arrondi — x 172, y 273, 115×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
10. Texte « 15 » — x 184, y 273, 98×44 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 9
11. Rectangle arrondi — x 295, y 273, 78×44 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
12. Texte « g ▾ » — x 298, y 273, 71×44 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 11
13. Texte « Lipides » — x 17, y 323, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
14. Rectangle arrondi — x 172, y 323, 115×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
15. Texte « 9 » — x 184, y 323, 98×44 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 14
16. Rectangle arrondi — x 295, y 323, 78×44 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
17. Texte « g ▾ » — x 298, y 323, 71×44 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 16
18. Texte « Fer » — x 17, y 374, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
19. Rectangle arrondi — x 172, y 374, 115×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
20. Texte « 8 » — x 184, y 374, 98×44 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
21. Rectangle arrondi — x 295, y 374, 78×44 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
22. Texte « mg ▾ » — x 298, y 374, 71×44 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 21
23. Texte « Calcium » — x 17, y 424, 149×44 px ; 18 px normal (400), couleur `#17302A` (text), aligné à gauche
24. Rectangle arrondi — x 172, y 424, 115×44 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
25. Texte « 300 » — x 184, y 424, 98×44 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
26. Rectangle arrondi — x 295, y 424, 78×44 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
27. Texte « mg ▾ » — x 298, y 424, 71×44 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 26
28. Texte « + Ajouter un nutriment      + Photo de l'étiquette » — x 17, y 478, 356×34 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche
29. Bouton « Voir les équivalents » — x 17, y 576, 356×63 px ; fond `#0F7B5F` (primary (vert)) ; texte 21 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Équivalents de mon produit** (`u_myproduct_eq`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Choisir un produit** (`u_choose`)
- « Voir les équivalents » → ouvre **Équivalents de mon produit** (`u_myproduct_eq`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les unités sont contrôlées (g, mg, µg). Le produit reste privé jusqu'à sa vérification par notre équipe. Les équivalents sont calculés tout de suite.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M25 · Équivalents de mon produit (`u_myproduct_eq`)

Référence : `mobile/u_myproduct_eq.png` · cas d'usage : UC-17 · Enregistrer un produit personnel (résultat)

```text
Recrée À L'IDENTIQUE l'écran « Équivalents de mon produit » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_myproduct_eq.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit immédiatement les aliments locaux qui apportent les mêmes nutriments que son produit.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Mon produit » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 111, 356×86 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Farine infantile enrichie » — x 31, y 115, 333×37 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Pastille « Privé · en vérification » — x 31, y 157, 218×28 px ; fond `#FFF4D6` (warning-50) ; texte 13 px gras `#B7791F` (warning) centré ; rayon 14 px (forme de pilule) — dans l'élément n° 1
4. Texte « Nutriments : protéines, fer, calcium » — x 17, y 211, 356×32 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
5. Rectangle arrondi — x 17, y 249, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
6. Texte « 1 » — x 23, y 249, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 5
7. Texte « Niébé » — x 57, y 252, 206×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
8. Pastille « 3/3 » — x 292, y 256, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 5
9. Texte « Prot. 23,5 g · fer 8,3 mg · Ca 110 mg » — x 57, y 280, 287×23 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 5
10. Rectangle arrondi — x 17, y 311, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
11. Texte « 2 » — x 23, y 311, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 10
12. Texte « Feuilles de moringa » — x 57, y 314, 206×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
13. Pastille « 3/3 » — x 292, y 318, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 10
14. Texte « Prot. 9,4 g · fer 4,0 mg · Ca 185 mg » — x 57, y 342, 287×23 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 10
15. Rectangle arrondi — x 17, y 373, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
16. Texte « 3 » — x 23, y 373, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 15
17. Texte « Arachide » — x 57, y 376, 206×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
18. Pastille « 3/3 » — x 292, y 380, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 15
19. Texte « Prot. 25,8 g · fer 4,6 mg · Ca 92 mg » — x 57, y 404, 287×23 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 15
20. Texte « + lipides » — x 247, y 405, 109×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 15
21. Rectangle arrondi — x 17, y 435, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
22. Texte « 4 » — x 23, y 435, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 21
23. Texte « Soja » — x 57, y 438, 206×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 21
24. Pastille « 3/3 » — x 292, y 442, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 21
25. Texte « Prot. 36,5 g · fer 15,7 mg · Ca 277 mg » — x 57, y 466, 287×23 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 21
26. Texte « + lipides » — x 247, y 467, 109×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 21
27. Rectangle arrondi — x 17, y 497, 356×57 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
28. Texte « 5 » — x 23, y 497, 32×57 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre — dans l'élément n° 27
29. Texte « Sésame » — x 57, y 500, 206×29 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 27
30. Pastille « 3/3 » — x 292, y 504, 55×23 px ; fond `#0F7B5F` (primary (vert)) ; texte 13 px gras `#FFFFFF` (white) centré ; rayon 12 px (forme de pilule) — dans l'élément n° 27
31. Texte « Prot. 17,7 g · fer 14,6 mg · Ca 975 mg » — x 57, y 528, 287×23 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 27
32. Texte « + lipides » — x 247, y 529, 109×21 px ; 11 px normal (400), couleur `#5B6B66` (text-muted), aligné à droite — dans l'élément n° 27
33. Bouton « Donner à Amina » — x 17, y 576, 356×57 px ; fond `#0F7B5F` (primary (vert)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Liste des produits** (`u_dropdown`)
- « Donner à Amina » → ouvre **Confirmer la prise** (`u_give`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Même moteur de classement. Nutriments essentiels proposés automatiquement : les plus riches du produit (ici protéines, fer, calcium).

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M26 · Rappel à l'heure prévue (`u_lock`)

Référence : `mobile/u_lock.png` · cas d'usage : UC-40 · Recevoir un rappel de prise

```text
Recrée À L'IDENTIQUE l'écran « Rappel à l'heure prévue » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_lock.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : À 12:30, le téléphone affiche un rappel, même verrouillé. Le parent répond directement depuis la notification.
ATTENTION : cet écran simule l'écran verrouillé du téléphone. Ne pas le coder comme un écran de l'application. Il définit le contenu de la notification envoyée avec expo-notifications : titre « C'est l'heure du repas de {prénom} », texte « {produit} · {quantité} prévu à {heure} », icône de l'application = symbole TSOTSA, et trois boutons d'action (catégorie de notification) : « C'est donné » (ouvre Confirmer la prise), « Plus tard » (reprogramme le rappel 15 min plus tard), « Pas donné » (ouvre l'historique). L'apparence exacte de la notification dépend du système (Android / iOS).

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
Pas d'en-tête sur cet écran.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 0, y 0, 390×746 px ; fond `#1E3A33` (lockscreen) ; rayon 25 px
2. Texte « 12:30 » — x 0, y 65, 390×103 px ; 76 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 1
3. Texte « jeudi 12 novembre » — x 0, y 163, 390×40 px ; 21 px normal (400), couleur `#CFE9DE` (primary-100), aligné au centre — dans l'élément n° 1
4. Rectangle arrondi — x 11, y 237, 367×258 px ; fond `#F4F7F6` (surface-3) ; rayon 16 px — dans l'élément n° 1
5. Rectangle arrondi — x 29, y 252, 37×37 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 8 px — dans l'élément n° 4
6. Texte « TSOTSA Kids · maintenant » — x 75, y 252, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
7. Symbole TSOTSA seul, variante sur fond clair — x 33, y 257, 28×28 px (voir composant `BrandLogo`) — dans l'élément n° 4
8. Texte « C'est l'heure du repas d'Amina » — x 29, y 295, 333×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
9. Texte « Plumpy'Nut · 1 sachet prévu à 12:30 » — x 29, y 333, 333×34 px ; 18 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
10. Bouton « C'est donné » — x 29, y 381, 333×48 px ; fond `#0F7B5F` (primary (vert)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Confirmer la prise** (`u_give`) — dans l'élément n° 4
11. Bouton « Plus tard » — x 29, y 436, 161×44 px ; fond `#FFFFFF` (white) ; texte 16 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Profil** (`u_profile`) — dans l'élément n° 4
12. Bouton « Pas donné » — x 201, y 436, 161×44 px ; fond `#FFFFFF` (white) ; texte 16 px gras `#C93C3C` (danger) centré ; rayon 11 px ; bordure 1 px `#C93C3C` (danger) → ouvre **Historique** (`u_history`) — dans l'élément n° 4
13. Rectangle arrondi — x 11, y 513, 367×86 px ; fond `#3A544D` (lockscreen-2) ; rayon 14 px → ouvre **Mes notifications** (`u_notif_center`) (zone tactile = l'élément entier) — dans l'élément n° 1
14. Texte « Hier 18:30 · Prise de 18:00 non confirmée » — x 29, y 513, 333×86 px ; 16 px normal (400), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 13

Interactions :
- « C'est donné » → ouvre **Confirmer la prise** (`u_give`)
- « Plus tard » → ouvre **Profil** (`u_profile`)
- « Pas donné » → ouvre **Historique** (`u_history`)
- « Notifications » → ouvre **Mes notifications** (`u_notif_center`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le serveur envoie le rappel à l'heure prévue par le soignant (dans le fuseau horaire du parent). Un rappel local est aussi programmé dans le téléphone, au cas où il n'y aurait pas de réseau. Le soignant associé est prévenu s'il l'a activé.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M27 · Mes notifications (`u_notif_center`)

Référence : `mobile/u_notif_center.png` · cas d'usage : UC-41 · Consulter ses notifications

```text
Recrée À L'IDENTIQUE l'écran « Mes notifications » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_notif_center.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Retrouve tous les rappels et messages reçus, et agit directement : confirmer une prise, voir une évaluation.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Notifications » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px) ; à droite : icône FontAwesome 5 solid `cog` (react-icons : `FaCog`) 32 px blanche, x 337 (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 117, 356×85 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#BFE3D3` (primary-200) ; rayon 9 px → ouvre **Confirmer la prise** (`u_give`) (zone tactile = l'élément entier)
2. Texte « 12:30 · Repas d'Amina » — x 77, y 124, 264×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
3. Cercle / ellipse — x 348, y 131, 13×13 px ; fond `#F08A24` (accent (orange)) — dans l'élément n° 1
4. Icône FontAwesome 5 solid `bell` (react-icons : `FaBell`) — x 31, y 142, 34 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 1
5. Texte « Plumpy'Nut · 1 sachet · à confirmer » — x 77, y 158, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Rectangle arrondi — x 17, y 211, 356×85 px ; fond `#E7F4EE` (primary-50) ; bordure 1 px `#BFE3D3` (primary-200) ; rayon 9 px → ouvre **Historique** (`u_history`) (zone tactile = l'élément entier)
7. Texte « Hier 18:30 · Prise non confirmée » — x 77, y 218, 264×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
8. Cercle / ellipse — x 348, y 225, 13×13 px ; fond `#F08A24` (accent (orange)) — dans l'élément n° 6
9. Icône FontAwesome 5 solid `exclamation-circle` (react-icons : `FaExclamationCircle`) — x 31, y 236, 34 px, couleur `#B7791F` (warning) — dans l'élément n° 6
10. Texte « La prise de 18:00 n'a pas été confirmée » — x 77, y 252, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6
11. Rectangle arrondi — x 17, y 305, 356×85 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
12. Texte « Hier 10:15 · Dr [Nom] » — x 77, y 312, 264×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Icône FontAwesome 5 solid `comment-medical` (react-icons : `FaCommentMedical`) — x 31, y 330, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 11
14. Texte « « Pensez à venir au CMA le 12/11. » » — x 77, y 346, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
15. Rectangle arrondi — x 17, y 399, 356×85 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px → ouvre **Profil** (`u_profile`) (zone tactile = l'élément entier)
16. Texte « 29/10 · Évaluation d'Amina » — x 77, y 406, 264×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
17. Icône FontAwesome 5 solid `chart-line` (react-icons : `FaChartLine`) — x 31, y 424, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 15
18. Texte « Votre soignant a mis à jour son suivi » — x 77, y 440, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 15
19. Rectangle arrondi — x 17, y 493, 356×85 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
20. Texte « 29/10 · Rappel de 12:30 » — x 77, y 500, 264×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
21. Icône FontAwesome 5 solid `check-circle` (react-icons : `FaCheckCircle`) — x 31, y 518, 34 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 19
22. Texte « Prise confirmée à 12:42 » — x 77, y 535, 275×37 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 19
23. Texte « Réglages des notifications  › » — x 17, y 599, 356×40 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné au centre → ouvre **Réglages notifications** (`u_notif_settings`) (zone tactile = l'élément entier)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Profil** (`u_profile`)
- Icône cog (en-tête, à droite) : Réglages → ouvre **Réglages notifications** (`u_notif_settings`)
- « 12:30 · Repas d'Amina » → ouvre **Confirmer la prise** (`u_give`)
- « Hier 18:30 · Prise non confirmée » → ouvre **Historique** (`u_history`)
- « 29/10 · Évaluation d'Amina » → ouvre **Profil** (`u_profile`)
- « Réglages » → ouvre **Réglages notifications** (`u_notif_settings`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Chaque notification est enregistrée sur le serveur (date, personne suivie, statut lu ou non), ce qui permet de la retrouver même si la notification du téléphone a été effacée.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M28 · Activer ou désactiver les notifications (`u_notif_settings`)

Référence : `mobile/u_notif_settings.png` · cas d'usage : UC-42 · Régler ses notifications

```text
Recrée À L'IDENTIQUE l'écran « Activer ou désactiver les notifications » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_notif_settings.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Choisit ce qu'il veut recevoir, pour chaque personne suivie, et comment (téléphone, SMS). Peut définir des heures calmes.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Réglages » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « POUR AMINA » — x 17, y 111, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
2. Texte « Rappels aux heures prévues » — x 17, y 146, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
3. Interrupteur ACTIVÉ — x 310, y 153, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite → ouvre **Rappels désactivés** (`u_notif_off`)
4. Texte « 08:00 · 12:30 · 18:00 » — x 17, y 174, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
5. Texte « Relance si non confirmée » — x 17, y 211, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
6. Interrupteur ACTIVÉ — x 310, y 218, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
7. Texte « 30 minutes après l'heure » — x 17, y 240, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
8. Texte « GÉNÉRAL » — x 17, y 283, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
9. Texte « Messages du soignant » — x 17, y 318, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
10. Interrupteur ACTIVÉ — x 310, y 325, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
11. Texte « Résultats des évaluations » — x 17, y 366, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
12. Interrupteur ACTIVÉ — x 310, y 373, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
13. Texte « COMMENT ? » — x 17, y 415, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
14. Texte « Notification sur le téléphone » — x 17, y 450, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
15. Interrupteur ACTIVÉ — x 310, y 457, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
16. Texte « SMS si pas d'internet » — x 17, y 498, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
17. Interrupteur DÉSACTIVÉ — x 310, y 505, 60×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche
18. Texte « Peut être payant » — x 17, y 526, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
19. Texte « Heures calmes » — x 17, y 553, 184×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
20. Texte « 21:00 – 06:00 › » — x 201, y 553, 172×34 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Mes notifications** (`u_notif_center`)
- « Interrupteur » → ouvre **Rappels désactivés** (`u_notif_off`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les préférences sont enregistrées sur le serveur et dans le téléphone. Les rappels prévus tiennent compte des heures calmes (sauf alertes urgentes, à valider).

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M29 · Rappels désactivés (`u_notif_off`)

Référence : `mobile/u_notif_off.png` · cas d'usage : UC-42 · Régler ses notifications (rappels désactivés)

```text
Recrée À L'IDENTIQUE l'écran « Rappels désactivés » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_notif_off.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : A désactivé les rappels d'Amina. Il peut les réactiver à tout moment d'un seul geste.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Réglages » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Texte « POUR AMINA » — x 17, y 111, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
2. Texte « Rappels aux heures prévues » — x 17, y 146, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
3. Interrupteur DÉSACTIVÉ — x 310, y 153, 60×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche → ouvre **Réglages notifications** (`u_notif_settings`)
4. Texte « 08:00 · 12:30 · 18:00 » — x 17, y 174, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
5. Texte « Relance si non confirmée » — x 17, y 211, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
6. Interrupteur DÉSACTIVÉ — x 310, y 218, 60×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche
7. Texte « 30 minutes après l'heure » — x 17, y 240, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
8. Rectangle arrondi — x 17, y 272, 356×71 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px
9. Texte « Rappels désactivés pour Amina. Votre soignant en est informé. » — x 29, y 272, 333×71 px ; 16 px gras (700), couleur `#7A5300` (warning-900), aligné à gauche — dans l'élément n° 8
10. Texte « GÉNÉRAL » — x 17, y 358, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
11. Texte « Messages du soignant » — x 17, y 392, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
12. Interrupteur ACTIVÉ — x 310, y 399, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
13. Texte « Résultats des évaluations » — x 17, y 440, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
14. Interrupteur ACTIVÉ — x 310, y 447, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
15. Texte « COMMENT ? » — x 17, y 490, 356×32 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
16. Texte « Notification sur le téléphone » — x 17, y 524, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
17. Interrupteur ACTIVÉ — x 310, y 531, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
18. Texte « SMS si pas d'internet » — x 17, y 572, 275×30 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
19. Interrupteur DÉSACTIVÉ — x 310, y 579, 60×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche
20. Texte « Peut être payant » — x 17, y 601, 275×25 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
21. Texte « Heures calmes » — x 17, y 627, 184×34 px ; 18 px gras (700), couleur `#17302A` (text), aligné à gauche
22. Texte « 21:00 – 06:00 › » — x 201, y 627, 172×34 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Mes notifications** (`u_notif_center`)
- « Interrupteur » → ouvre **Réglages notifications** (`u_notif_settings`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Les rappels programmés sont annulés (serveur et téléphone). Le soignant associé voit dans le dossier que les rappels sont désactivés, car cela peut expliquer des prises manquées.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M30 · Les heures prévues (`u_schedule`)

Référence : `mobile/u_schedule.png` · cas d'usage : UC-43 · Voir et gérer les heures de prise

```text
Recrée À L'IDENTIQUE l'écran « Les heures prévues » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/u_schedule.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Voit les heures prévues par le soignant, et peut couper un rappel précis ou ajouter un rappel personnel.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#0F7B5F` (primary (vert)), titre « Rappels d'Amina » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Rectangle arrondi — x 17, y 111, 356×71 px ; fond `#E8F0FA` (care-50) ; rayon 9 px
2. Texte « Plan défini par Dr [Nom] · du 01/10 au 26/11 » — x 31, y 111, 328×71 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 1
3. Rectangle arrondi — x 17, y 203, 356×78 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
4. Texte « 08:00 » — x 34, y 203, 103×78 px ; 29 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 3
5. Texte « Plumpy'Nut · 1 sachet » — x 138, y 203, 161×78 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 3
6. Interrupteur ACTIVÉ — x 298, y 226, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
7. Rectangle arrondi — x 17, y 292, 356×78 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
8. Texte « 12:30 » — x 34, y 292, 103×78 px ; 29 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 7
9. Texte « Plumpy'Nut · 1 sachet » — x 138, y 292, 161×78 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 7
10. Interrupteur ACTIVÉ — x 298, y 315, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 7
11. Rectangle arrondi — x 17, y 382, 356×78 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
12. Texte « 18:00 » — x 34, y 382, 103×78 px ; 29 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 11
13. Texte « Plumpy'Nut · 1 sachet » — x 138, y 382, 161×78 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
14. Interrupteur ACTIVÉ — x 298, y 405, 60×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 11
15. Texte « + Ajouter un rappel personnel » — x 17, y 484, 356×40 px ; 18 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche
16. Texte « (par exemple : « donner de l'eau ») » — x 17, y 518, 356×29 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
17. Bouton « Réglages des notifications » — x 17, y 576, 356×57 px ; fond `#FFFFFF` (white) ; texte 19 px gras `#0F7B5F` (primary (vert)) centré ; rayon 11 px ; bordure 1 px `#0F7B5F` (primary (vert)) → ouvre **Réglages notifications** (`u_notif_settings`)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Profil** (`u_profile`)
- « Réglages des notifications » → ouvre **Réglages notifications** (`u_notif_settings`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le plan de prises est défini par le soignant dans le dossier d'Amina. Chaque heure génère un rappel. Une modification du soignant met à jour les rappels du téléphone automatiquement.

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### M31 · Compte soignant en attente (`s_pending`)

Référence : `mobile/s_pending.png` · cas d'usage : UC-20 · S'inscrire comme soignant

```text
Recrée À L'IDENTIQUE l'écran « Compte soignant en attente » de l'application mobile React Native (Expo) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `mobile/s_pending.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).
Rôle de l'écran : Le soignant s'inscrit, envoie sa carte professionnelle et son établissement, puis attend la vérification.

Cadre : écran de 390 × 746 px. Barre d'état système de 32 px en haut (y 0 à 32), dessinée par le téléphone : ne pas la recréer. Fond de l'écran : blanc #FFFFFF.
En-tête : y 32, 390 × 67 px, fond `#1F5FA8` (care (bleu soignant)), titre « Compte soignant » 22 px gras blanc, centré ; à gauche : icône FontAwesome 5 solid `arrow-left` (react-icons : `FaArrowLeft`) 32 px blanche, x 21, centrée verticalement (zone tactile 69 × 67 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; la barre d'état occupe y 0 à 32) :
1. Cercle / ellipse — x 120, y 123, 149×149 px ; fond `#E8F0FA` (care-50)
2. Icône FontAwesome 5 solid `user-clock` (react-icons : `FaUserClock`) — x 155, y 157, 80 px, couleur `#1F5FA8` (care (bleu soignant))
3. Texte « Vérification en cours » — x 17, y 295, 356×46 px ; 27 px gras (700), couleur `#17302A` (text), aligné au centre
4. Texte « Notre équipe vérifie votre identité professionnelle. Vous serez prévenu par SMS. » — x 29, y 346, 333×75 px ; 18 px normal (400), couleur `#5B6B66` (text-muted), aligné au centre
5. Texte « Carte professionnelle » — x 29, y 438, 195×37 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
6. Texte « envoyée ✓ » — x 201, y 438, 161×37 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite
7. Texte « Établissement » — x 29, y 479, 195×37 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
8. Texte « CMA de démo ✓ » — x 201, y 479, 161×37 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite
9. Texte « Numéro d'ordre » — x 29, y 521, 195×37 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche
10. Texte « envoyé ✓ » — x 201, y 521, 161×37 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite
11. Bouton « Voir côté administration → » — x 17, y 576, 356×57 px ; fond `#334155` (admin (ardoise)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Vérifications** (`a_verify`)
12. Texte « Compris » — x 17, y 639, 356×34 px ; 18 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné au centre → ouvre **Accueil** (`u_welcome`) (zone tactile = l'élément entier)

Interactions :
- Flèche retour (en-tête, à gauche) → ouvre **Connexion téléphone** (`u_signup`)
- « Voir côté administration → » → ouvre **Vérifications** (`a_verify`)
- « Compris » → ouvre **Accueil** (`u_welcome`)

Comportement attendu derrière l'écran (à brancher sur l'API, pas de données inventées) : Le compte existe, mais il ne donne accès à aucune donnée de santé. La demande apparaît dans l'administration, onglet « Vérifications ».

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (marges latérales fixes de 17 px, éléments pleine largeur étirés, défilement vertical si le contenu dépasse, barre du bas fixe).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```


---

## 5. Prompt de fondation web (W00)

À coller en premier dans Lovable, v0 ou Bolt. Dans Lovable, ajouter la phrase : « N'utilise pas Supabase. »

```text
Crée la fondation de l'application web TSOTSA Kids : React 18 + TypeScript + Vite + Tailwind CSS 3
+ React Router + react-icons (Font Awesome 5 uniquement, import depuis react-icons/fa).
Connexion : Google (Google Identity Services, paquet @react-oauth/google), téléphone + code SMS,
ou e-mail + mot de passe (le mot de passe n'est jamais stocké côté navigateur).
N'utilise PAS Supabase ni aucun backend intégré : toutes les données viendront de notre API REST
(variable d'environnement VITE_API_URL). Ne crée aucune donnée fictive dans le code applicatif.

1. Police : Carlito (paquet @fontsource/carlito, graisses 400 et 700), seule police du projet.
   Tailles utilisées (px) : 11, 13, 14, 16, 17, 19, 21, 22, 24, 25, 29, 38. Interligne 1,2.
2. Tailwind (tailwind.config) : ajoute EXACTEMENT ces couleurs :
   primary #0F7B5F, primary-50 #E7F4EE, primary-200 #BFE3D3, accent #F08A24, accent-50 #FFF1E2,
   accent-700 #B4610C, text #17302A, text-muted #5B6B66, text-subtle #8A9893, border #D5DEDA,
   canvas #EEF2F0, sidebar #F6F8F7, surface-2 #F7F9F8, neutral-100 #F1F3F2, toggle-off #C9D1CE,
   danger #C93C3C, danger-50 #FDECEC, warning #B7791F, warning-50 #FFF4D6, warning-900 #7A5300,
   care #1F5FA8, care-50 #E8F0FA, admin #334155, admin-50 #EEF1F5, chart #534AB7, chart-normal #E6F4EC,
   chart-grid #D9DFDC, brand #F26142, badge #E5484D.
   Rayons : card 9px, button 11px, field 7px. Aucune ombre (shadow-none partout), aucun dégradé.
3. Mise en page (composant AppShell) pour une fenêtre de 1440 px :
   - AppHeader : hauteur 63 px, pleine largeur, fond = couleur de l'espace (care pour le soignant,
     admin pour l'administration, primary pour l'utilisateur) ; à gauche (x 29 px) le BrandLogo
     variante foncée, hauteur 34 px, puis « ·  <nom de l'espace> » 22 px gras blanc ; à droite le nom
     de la personne connectée 17 px blanc (marge droite 21 px) ; pour le soignant, une cloche
     FaBell 32 px blanche à x 884 px avec pastille ronde #E5484D de 23 px (nombre en 13 px gras blanc).
   - Sidebar : largeur fixe 262 px, fond sidebar, sous l'en-tête ; éléments de 239 × 50 px à partir de
     y 19 px, espacés de 57 px, marge gauche 11 px ; icône 23 px à x 29 px, libellé 17 px à x 65 px ;
     élément actif : fond care-50 / admin-50 / primary-50 selon l'espace, rayon 7 px, icône et libellé
     de la couleur de l'espace en gras ; inactif : icône text-subtle, libellé text.
   - Zone de contenu : fond blanc, marge gauche 23 px après le menu (x 285 px depuis le bord).
4. Composants partagés : Button (plein / contour, rayon 11 px, texte gras centré), Chip (pilule),
   Card (blanc, bordure 1 px border, rayon 9 px), KpiCard (114 px de haut, barre gauche 9 px de la
   couleur, valeur 38 px gras colorée, libellé 16 px text-muted), DataTable (en-tête 41 px coloré,
   texte blanc 14 px gras ; lignes alternées surface-2 / blanc ; marge de cellule 7 px), Toggle
   (60 × 32 px), Notice (warning-50 / warning-900), ZScoreChart (SVG maison : bandes de fond
   chart-normal ≥ −2, warning-50 de −3 à −2, danger-50 < −3 ; grille chart-grid 1 px ; ligne 0 en
   pointillés text-subtle ; courbe chart 2 px ; points 16 px à bordure blanche ; valeur au-dessus
   13 px gras), BrandLogo (symbole SVG fourni, mot « TSOTSA » gras 0,6 h, pastille « KIDS »).
5. Routes (React Router), une page vide par ligne pour l'instant :
| W01 | Version web utilisateur | `w_nutrition` | `/nutrition/produits/plumpy-nut` |
| W02 | Tableau de bord | `s_dashboard` | `/soignant` |
| W03 | Personnes suivies | `s_list` | `/soignant/personnes` |
| W04 | Dossier + courbes | `s_file` | `/soignant/personnes/A-014` |
| W05 | Nouvelle évaluation | `s_eval` | `/soignant/personnes/A-014/evaluation` |
| W06 | Dossier mis à jour | `s_file_updated` | `/soignant/personnes/A-014` |
| W07 | Plan de prises | `s_plan` | `/soignant/personnes/A-014/plan` |
| W08 | Notifications | `s_notif` | `/soignant/notifications` |
| W09 | Réglages notifications | `s_notif_settings` | `/soignant/parametres/notifications` |
| W10 | Vue d'ensemble | `a_dashboard` | `/` |
| W11 | Vérifications | `a_verify` | `/verifications` |
| W12 | Comptes | `a_accounts` | `/comptes` |
| W13 | Base aliments ORKG | `a_import` | `/base-aliments` |
| W14 | Saisie d'un aliment | `a_food_new` | `/base-aliments/nouveau` |
| W15 | Import d'un fichier | `a_import_preview` | `/base-aliments/import` |
| W16 | Produits de référence | `a_products` | `/produits-reference` |
| W17 | Prix par région | `a_prices` | `/prix` |
| W18 | Optimisation | `a_optim` | `/optimisation` |
| W19 | Modules | `a_modules` | `/modules` |
| W20 | Notifications | `a_notif` | `/notifications` |
6. Animations : uniquement le retour visuel au clic (opacité 0,85, 100 ms) et l'interrupteur (150 ms).
7. Responsive : référence 1440 px ; au-delà, contenu fluide et menu fixe ; de 1024 à 1279 px, menu
   réduit aux icônes (72 px) et tableaux à défilement horizontal ; sous 1024 px non prévu.
Montre-moi le shell (en-tête + menu) des trois espaces pour validation avant de créer les pages.
```

| N° | Écran | Identifiant | Route web |
|---|---|---|---|
| W01 | Version web utilisateur | `w_nutrition` | `/nutrition/produits/plumpy-nut` |
| W02 | Tableau de bord | `s_dashboard` | `/soignant` |
| W03 | Personnes suivies | `s_list` | `/soignant/personnes` |
| W04 | Dossier + courbes | `s_file` | `/soignant/personnes/A-014` |
| W05 | Nouvelle évaluation | `s_eval` | `/soignant/personnes/A-014/evaluation` |
| W06 | Dossier mis à jour | `s_file_updated` | `/soignant/personnes/A-014` |
| W07 | Plan de prises | `s_plan` | `/soignant/personnes/A-014/plan` |
| W08 | Notifications | `s_notif` | `/soignant/notifications` |
| W09 | Réglages notifications | `s_notif_settings` | `/soignant/parametres/notifications` |
| W10 | Vue d'ensemble | `a_dashboard` | `/` |
| W11 | Vérifications | `a_verify` | `/verifications` |
| W12 | Comptes | `a_accounts` | `/comptes` |
| W13 | Base aliments ORKG | `a_import` | `/base-aliments` |
| W14 | Saisie d'un aliment | `a_food_new` | `/base-aliments/nouveau` |
| W15 | Import d'un fichier | `a_import_preview` | `/base-aliments/import` |
| W16 | Produits de référence | `a_products` | `/produits-reference` |
| W17 | Prix par région | `a_prices` | `/prix` |
| W18 | Optimisation | `a_optim` | `/optimisation` |
| W19 | Modules | `a_modules` | `/modules` |
| W20 | Notifications | `a_notif` | `/notifications` |


---

## 6. Écrans web, un prompt par écran

À coller dans Lovable, v0, Bolt ou Cursor (projet React), un écran à la fois, avec l'image de référence jointe.

### W01 · Version web utilisateur (`w_nutrition`)

Référence : `web/w_nutrition.png`

```text
Recrée À L'IDENTIQUE l'écran « Version web utilisateur » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/w_nutrition.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/nutrition/produits/plumpy-nut`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#0F7B5F` (primary (vert)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace utilisateur (web) » 22 px gras blanc ; à droite « Compte démo · Amina » 17 px blanc aligné à droite (marge droite 21 px).

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Rectangle arrondi — x 29, y 86, 524×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Texte « Produit » — x 51, y 97, 228×29 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
3. Rectangle arrondi — x 51, y 129, 479×51 px ; fond `#FFFFFF` (white) ; bordure 1 px `#0F7B5F` (primary (vert)) ; rayon 7 px — dans l'élément n° 1
4. Texte « Plumpy'Nut  ▾ » — x 68, y 129, 445×51 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
5. Texte « Composition pour 100 g · spécification OMS/UNICEF » — x 51, y 194, 479×29 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Rectangle — x 51, y 228, 479×41 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 1
7. Texte « Énergie » — x 63, y 228, 148×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
8. Texte « 520 – 550 kcal » — x 200, y 228, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 6
9. Texte « Protéines ★ » — x 63, y 269, 148×41 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
10. Texte « ≈ 13 – 16 g (10–12 % de l'énergie) » — x 200, y 269, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
11. Rectangle — x 51, y 310, 479×41 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 1
12. Texte « Lipides ★ » — x 63, y 310, 148×41 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Texte « ≈ 26 – 37 g (45–60 % de l'énergie) » — x 200, y 310, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 11
14. Texte « Fer ★ » — x 63, y 351, 148×41 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
15. Texte « 10 – 14 mg » — x 200, y 351, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
16. Rectangle — x 51, y 392, 479×41 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 1
17. Texte « Calcium » — x 63, y 392, 148×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 16
18. Texte « 300 – 600 mg » — x 200, y 392, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 16
19. Texte « Zinc » — x 63, y 433, 148×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
20. Texte « 11 – 14 mg » — x 200, y 433, 325×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
21. Rectangle arrondi — x 51, y 490, 479×51 px ; fond `#F1F3F2` (neutral-100) ; rayon 7 px — dans l'élément n° 1
22. Texte « Coût : prix non renseigné pour l'Ouest » — x 68, y 490, 456×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 21
23. Rectangle arrondi — x 51, y 559, 479×80 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px — dans l'élément n° 1
24. Texte « Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit. » — x 68, y 559, 450×80 px ; 14 px normal (400), couleur `#7A5300` (warning-900), aligné à gauche — dans l'élément n° 23
25. Rectangle arrondi — x 576, y 86, 838×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
26. Texte « Aliments locaux équivalents » — x 599, y 95, 456×40 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 25
27. Texte « ← Version mobile » — x 1169, y 95, 228×40 px ; 17 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à droite → ouvre **Produit + équivalents** (`u_product`) (zone tactile = l'élément entier) — dans l'élément n° 25
28. Pastille « Nutriments : protéines, lipides, fer » — x 599, y 140, 274×30 px ; fond `#E7F4EE` (primary-50) ; texte 13 px gras `#0F7B5F` (primary (vert)) centré ; rayon 15 px (forme de pilule) — dans l'élément n° 25
29. Pastille « Toutes régions ▾ » — x 884, y 140, 160×30 px ; fond `#F1F3F2` (neutral-100) ; texte 13 px gras `#17302A` (text) centré ; rayon 15 px (forme de pilule) — dans l'élément n° 25
30. Rectangle — x 599, y 188, 798×39 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 25
31. Texte « # » — x 603, y 188, 34×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
32. Texte « Aliment local » — x 637, y 188, 194×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
33. Texte « Commun » — x 831, y 188, 86×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
34. Texte « En plus » — x 917, y 188, 97×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
35. Texte « Protéines » — x 1014, y 188, 97×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
36. Texte « Lipides » — x 1110, y 188, 91×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
37. Texte « Fer » — x 1202, y 188, 80×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
38. Texte « Région Ouest » — x 1282, y 188, 108×39 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 25
39. Rectangle — x 599, y 227, 798×50 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 25
40. Texte « 1 » — x 603, y 227, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
41. Texte « Graines de courge » — x 637, y 227, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
42. Texte « 3/3 » — x 831, y 227, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
43. Texte « — » — x 917, y 227, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
44. Texte « 30,2 g » — x 1014, y 227, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
45. Texte « 49,1 g » — x 1110, y 227, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
46. Texte « 8,8 mg » — x 1202, y 227, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
47. Texte « ✓ » — x 1282, y 227, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
48. Rectangle — x 599, y 277, 798×50 px ; fond `#FFFFFF` (white) — dans l'élément n° 25
49. Texte « 2 » — x 603, y 277, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
50. Texte « Sésame » — x 637, y 277, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
51. Texte « 3/3 » — x 831, y 277, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
52. Texte « + calcium » — x 917, y 277, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
53. Texte « 17,7 g » — x 1014, y 277, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
54. Texte « 49,7 g » — x 1110, y 277, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
55. Texte « 14,6 mg » — x 1202, y 277, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
56. Texte « — » — x 1282, y 277, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 48
57. Rectangle — x 599, y 327, 798×50 px ; fond `#F7F9F8` (surface-2) → ouvre **Détail aliment** (`u_food`) (zone tactile = l'élément entier) — dans l'élément n° 25
58. Texte « 3 » — x 603, y 327, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
59. Texte « Arachide » — x 637, y 327, 194×50 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 57
60. Texte « 3/3 » — x 831, y 327, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
61. Texte « + calcium » — x 917, y 327, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
62. Texte « 25,8 g » — x 1014, y 327, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
63. Texte « 49,2 g » — x 1110, y 327, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
64. Texte « 4,6 mg » — x 1202, y 327, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
65. Texte « ✓ » — x 1282, y 327, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 57
66. Rectangle — x 599, y 377, 798×50 px ; fond `#FFFFFF` (white) — dans l'élément n° 25
67. Texte « 4 » — x 603, y 377, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
68. Texte « Soja » — x 637, y 377, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
69. Texte « 3/3 » — x 831, y 377, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
70. Texte « + calcium » — x 917, y 377, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
71. Texte « 36,5 g » — x 1014, y 377, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
72. Texte « 19,9 g » — x 1110, y 377, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
73. Texte « 15,7 mg » — x 1202, y 377, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
74. Texte « ✓ » — x 1282, y 377, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 66
75. Rectangle — x 599, y 428, 798×50 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 25
76. Texte « 5 » — x 603, y 428, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
77. Texte « Niébé » — x 637, y 428, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
78. Texte « 2/3 » — x 831, y 428, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
79. Texte « + calcium » — x 917, y 428, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
80. Texte « 23,5 g » — x 1014, y 428, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
81. Texte « 1,3 g » — x 1110, y 428, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
82. Texte « 8,3 mg » — x 1202, y 428, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
83. Texte « ✓ » — x 1282, y 428, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 75
84. Rectangle — x 599, y 478, 798×50 px ; fond `#FFFFFF` (white) — dans l'élément n° 25
85. Texte « 6 » — x 603, y 478, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
86. Texte « Lait entier en poudre » — x 637, y 478, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
87. Texte « 2/3 » — x 831, y 478, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
88. Texte « + calcium » — x 917, y 478, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
89. Texte « 26,3 g » — x 1014, y 478, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
90. Texte « 26,7 g » — x 1110, y 478, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
91. Texte « 0,5 mg » — x 1202, y 478, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
92. Texte « — » — x 1282, y 478, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 84
93. Rectangle — x 599, y 528, 798×50 px ; fond `#F7F9F8` (surface-2) — dans l'élément n° 25
94. Texte « 7 » — x 603, y 528, 34×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
95. Texte « Feuilles de moringa » — x 637, y 528, 194×50 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
96. Texte « 2/3 » — x 831, y 528, 86×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
97. Texte « + calcium » — x 917, y 528, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
98. Texte « 9,4 g » — x 1014, y 528, 97×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
99. Texte « 1,4 g » — x 1110, y 528, 91×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
100. Texte « 4,0 mg » — x 1202, y 528, 80×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
101. Texte « ✓ » — x 1282, y 528, 108×50 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 93
102. Texte « Valeurs pour 100 g. Démo : USDA indicatives ; en production : base aliments extraite d'ORKG et validée. » — x 599, y 604, 798×34 px ; 13 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 25

Interactions :
- « Arachide » → ouvre **Détail aliment** (`u_food`)
- « Version mobile » → ouvre **Produit + équivalents** (`u_product`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W02 · Tableau de bord (`s_dashboard`)

Référence : `web/s_dashboard.png`

```text
Recrée À L'IDENTIQUE l'écran « Tableau de bord » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_dashboard.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Carte indicateur — x 285, y 86, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#1F5FA8` (care (bleu soignant)) ; valeur « 4 » 38 px gras `#1F5FA8` (care (bleu soignant)) ; libellé « personnes suivies (démo) » 16 px `#5B6B66` (text-muted) → ouvre **Personnes suivies** (`s_list`)
2. Carte indicateur — x 570, y 86, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#0F7B5F` (primary (vert)) ; valeur « 79 % » 38 px gras `#0F7B5F` (primary (vert)) ; libellé « prises confirmées sur 7 jours » 16 px `#5B6B66` (text-muted)
3. Carte indicateur — x 855, y 86, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#C93C3C` (danger) ; valeur « 2 » 38 px gras `#C93C3C` (danger) ; libellé « alertes prioritaires » 16 px `#5B6B66` (text-muted)
4. Carte indicateur — x 1140, y 86, 279×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#B7791F` (warning) ; valeur « 1 » 38 px gras `#B7791F` (warning) ; libellé « évaluation en retard » 16 px `#5B6B66` (text-muted)
5. Rectangle arrondi — x 285, y 222, 695×433 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
6. Texte « Alertes à traiter, par priorité » — x 308, y 231, 570×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
7. Rectangle arrondi — x 308, y 285, 650×78 px ; fond `#FDECEC` (danger-50) ; rayon 7 px — dans l'élément n° 5
8. Texte « #A-022 · Œdèmes bilatéraux signalés » — x 376, y 292, 547×34 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 7
9. Icône FontAwesome 5 solid `exclamation-triangle` (react-icons : `FaExclamationTriangle`) — x 325, y 308, 32 px, couleur `#C93C3C` (danger) — dans l'élément n° 7
10. Texte « Évaluation du 11/11 · à revoir en urgence » — x 376, y 326, 547×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 7
11. Rectangle arrondi — x 308, y 374, 650×78 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px → ouvre **Dossier + courbes** (`s_file`) (zone tactile = l'élément entier) — dans l'élément n° 5
12. Texte « Ouvrir › » — x 844, y 374, 103×78 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 11
13. Texte « #A-014 · Amina · gain de poids insuffisant » — x 376, y 381, 547×34 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
14. Icône FontAwesome 5 solid `chart-line` (react-icons : `FaChartLine`) — x 325, y 397, 32 px, couleur `#B7791F` (warning) — dans l'élément n° 11
15. Texte « 2,8 g/kg/j du 15/10 au 29/10 · évaluation aujourd'hui » — x 376, y 415, 547×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
16. Rectangle arrondi — x 308, y 463, 650×78 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px — dans l'élément n° 5
17. Texte « #B-007 · 3 prises non confirmées » — x 376, y 470, 547×34 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 16
18. Icône FontAwesome 5 solid `utensils` (react-icons : `FaUtensils`) — x 325, y 486, 32 px, couleur `#B7791F` (warning) — dans l'élément n° 16
19. Texte « Depuis le 09/11 » — x 376, y 504, 547×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 16
20. Rectangle arrondi — x 308, y 552, 650×78 px ; fond `#E8F0FA` (care-50) ; rayon 7 px — dans l'élément n° 5
21. Texte « #B-011 · évaluation en retard » — x 376, y 559, 547×34 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
22. Icône FontAwesome 5 solid `calendar-times` (react-icons : `FaCalendarTimes`) — x 325, y 575, 32 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 20
23. Texte « Prévue le 07/11 » — x 376, y 593, 547×30 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 20
24. Rectangle arrondi — x 1003, y 222, 416×433 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
25. Texte « Évaluations prévues » — x 1026, y 231, 365×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
26. Texte « Aujourd'hui » — x 1026, y 285, 125×51 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 24
27. Texte « #A-014 · Amina » — x 1152, y 285, 251×51 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
28. Texte « 13/11 » — x 1026, y 348, 125×51 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 24
29. Texte « #A-022 » — x 1152, y 348, 251×51 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
30. Texte « 13/11 » — x 1026, y 410, 125×51 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 24
31. Texte « #B-007 » — x 1152, y 410, 251×51 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
32. Texte « En retard » — x 1026, y 473, 125×51 px ; 16 px gras (700), couleur `#C93C3C` (danger), aligné à gauche — dans l'élément n° 24
33. Texte « #B-011 » — x 1152, y 473, 251×51 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
34. Bouton « Voir toutes les personnes » — x 1026, y 564, 371×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Personnes suivies** (`s_list`) — dans l'élément n° 24

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « personnes suivies (démo) » → ouvre **Personnes suivies** (`s_list`)
- « #A-014 · Amina · gain de poids insuffisant » → ouvre **Dossier + courbes** (`s_file`)
- « Voir toutes les personnes » → ouvre **Personnes suivies** (`s_list`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W03 · Personnes suivies (`s_list`)

Référence : `web/s_list.png`

```text
Recrée À L'IDENTIQUE l'écran « Personnes suivies » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_list.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/personnes`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Personnes suivies » — x 285, y 80, 456×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 1015, y 136, 405×43 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
3. Texte « Rechercher un nom ou un identifiant » — x 1026, y 136, 388×43 px ; 16 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 2
4. Pastille « Statut ▾ » — x 285, y 140, 154×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
5. Pastille « Région ▾ » — x 450, y 140, 154×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
6. Pastille « Établissement ▾ » — x 616, y 140, 154×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
7. Pastille « Âge ▾ » — x 781, y 140, 154×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
8. Tableau — x 285, y 205, 1134×292 px ; colonnes : « Identifiant » 125 px, « Prénom » 114 px, « Âge » 114 px, « P/T (z) » 103 px, « PB » 91 px, « Statut » 200 px, « Prises 7 j » 114 px, « Prochaine éval. » 143 px, «  » 131 px ; en-tête hauteur 41 px fond `#1F5FA8` (care (bleu soignant)) texte blanc 14 px gras ; lignes hauteur 63 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 17 px, marge gauche 7 px :
      - ligne 1 : #A-014 | **Amina** (`#1F5FA8` (care (bleu soignant))) | 1 a 11 m | −2,03 | 119 mm | **Modérée** (`#B7791F` (warning)) | 11/14 | Aujourd'hui | **Ouvrir ›** (`#1F5FA8` (care (bleu soignant))) — fond `#E8F0FA` (care-50) → ouvre **Dossier + courbes** (`s_file`) (toute la ligne cliquable)
      - ligne 2 : #A-022 | — | 2 a 3 m | œdèmes | 118 mm | **Sévère (œdèmes)** (`#C93C3C` (danger)) | 12/14 | 13/11 | 
      - ligne 3 : #B-007 | — | 1 a 4 m | −2,4 | 117 mm | **Modérée** (`#B7791F` (warning)) | 8/14 | 13/11 | 
      - ligne 4 : #B-011 | — | 3 a 1 m | −1,4 | 131 mm | **Normal** (`#0F7B5F` (primary (vert))) | 14/14 | En retard (`#C93C3C` (danger)) | 
9. Texte « Personnes et valeurs fictives (démo). Les z-scores sont calculés à partir des tables OMS ; en cas d'œdèmes, le poids-pour-taille n'est pas interprété. » — x 285, y 542, 1129×57 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- Ligne 1 du tableau → ouvre **Dossier + courbes** (`s_file`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W04 · Dossier + courbes (`s_file`)

Référence : `web/s_file.png`

```text
Recrée À L'IDENTIQUE l'écran « Dossier + courbes » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_file.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/personnes/A-014`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Rectangle arrondi — x 285, y 86, 308×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Cercle / ellipse — x 308, y 103, 68×68 px ; fond `#E8F0FA` (care-50) — dans l'élément n° 1
3. Texte « Amina » — x 393, y 103, 182×36 px ; 24 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
4. Icône FontAwesome 5 solid `child` (react-icons : `FaChild`) — x 325, y 120, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 1
5. Texte « #A-014 · démo » — x 393, y 138, 182×29 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Pastille « Malnutrition aiguë modérée » — x 308, y 188, 262×32 px ; fond `#FFF4D6` (warning-50) ; texte 14 px gras `#B7791F` (warning) centré ; rayon 16 px (forme de pilule) — dans l'élément n° 1
7. Texte « Sexe » — x 308, y 239, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
8. Texte « Fille » — x 422, y 239, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
9. Texte « Naissance » — x 308, y 283, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
10. Texte « 12/12/2024 » — x 422, y 283, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
11. Texte « Âge » — x 308, y 326, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
12. Texte « 1 an 11 mois » — x 422, y 326, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
13. Texte « Région » — x 308, y 369, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
14. Texte « Ouest » — x 422, y 369, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
15. Texte « Établissement » — x 308, y 413, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
16. Texte « CMA de démo » — x 422, y 413, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
17. Texte « Compte lié » — x 308, y 456, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
18. Texte « Parent · 6XX… » — x 422, y 456, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
19. Texte « Consentement » — x 308, y 499, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
20. Texte « ✓ 01/10/2026 » — x 422, y 499, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
21. Texte « Produit en cours » — x 308, y 543, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
22. Texte « Plumpy'Nut » — x 422, y 543, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
23. Bouton « Plan de prises et rappels › » — x 308, y 593, 262×48 px ; fond `#FFFFFF` (white) ; texte 16 px gras `#1F5FA8` (care (bleu soignant)) centré ; rayon 11 px ; bordure 1 px `#1F5FA8` (care (bleu soignant)) → ouvre **Plan de prises** (`s_plan`) — dans l'élément n° 1
24. Rectangle arrondi — x 616, y 86, 519×71 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px
25. Texte « Gain de poids insuffisant du 15/10 au 29/10 : 2,8 g/kg/j (repère OMS : au moins 5). 3 prises non confirmées. » — x 629, y 86, 491×71 px ; 14 px gras (700), couleur `#7A5300` (warning-900), aligné à gauche — dans l'élément n° 24
26. Rectangle arrondi — x 1152, y 86, 268×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
27. Texte « Prises confirmées » — x 1169, y 91, 234×40 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 26
28. Rectangle arrondi — x 1165, y 137, 241×64 px ; fond `#FFF1E2` (accent-50) ; bordure 1 px `#F08A24` (accent (orange)) ; rayon 6 px — dans l'élément n° 26
29. Rectangle — x 1165, y 137, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 28
30. Texte « 12/11 12:30  · nouveau » — x 1180, y 140, 222×29 px ; 14 px gras (700), couleur `#B4610C` (accent-700), aligné à gauche — dans l'élément n° 28
31. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 169, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 28
32. Rectangle arrondi — x 1165, y 208, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
33. Rectangle — x 1165, y 208, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 32
34. Texte « 11/11 18:00 » — x 1180, y 211, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 32
35. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 239, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 32
36. Rectangle arrondi — x 1165, y 278, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
37. Rectangle — x 1165, y 278, 7×64 px ; fond `#B7791F` (warning) — dans l'élément n° 36
38. Texte « 11/11 12:00 » — x 1180, y 282, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 36
39. Texte « Plumpy'Nut · 1 · moitié » — x 1180, y 310, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 36
40. Rectangle arrondi — x 1165, y 349, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
41. Rectangle — x 1165, y 349, 7×64 px ; fond `#C93C3C` (danger) — dans l'élément n° 40
42. Texte « 10/11 18:00 » — x 1180, y 352, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 40
43. Texte « Non confirmée » — x 1180, y 381, 222×27 px ; 14 px normal (400), couleur `#C93C3C` (danger), aligné à gauche — dans l'élément n° 40
44. Rectangle arrondi — x 1165, y 420, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
45. Rectangle — x 1165, y 420, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 44
46. Texte « 10/11 12:00 » — x 1180, y 423, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 44
47. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 451, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 44
48. Bouton « Nouvelle évaluation » — x 1165, y 502, 241×63 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Nouvelle évaluation** (`s_eval`) — dans l'élément n° 26
49. Texte « La prise « nouveau » est celle confirmée par le parent dans la démo mobile. » — x 1165, y 604, 241×48 px ; 13 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 26
50. Rectangle arrondi — x 616, y 168, 165×34 px ; fond `#1F5FA8` (care (bleu soignant)) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 6 px
51. Texte « Poids-pour-taille » — x 616, y 168, 165×34 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné au centre
52. Rectangle arrondi — x 787, y 168, 165×34 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
53. Texte « Périm. brachial » — x 787, y 168, 165×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné au centre
54. Rectangle arrondi — x 958, y 168, 165×34 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
55. Texte « Taille-pour-âge » — x 958, y 168, 165×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné au centre
56. Graphique de z-score (composant `ZScoreChart`) — x 621, y 222, 507×245 px : axe vertical de +1 à −4 (graduations +1, 0, −1, −2, −3, −4, étiquettes 13 px `#5B6B66` (text-muted) à gauche) ; bandes de fond : z ≥ −2 `#E6F4EC` (chart-normal) (libellé « Normal » `#0F7B5F` (primary (vert))), −3 à −2 `#FFF4D6` (warning-50) (« Modérée » `#B7791F` (warning)), < −3 `#FDECEC` (danger-50) (« Sévère » `#C93C3C` (danger)) ; lignes de grille 1 px `#D9DFDC` (chart-grid), ligne 0 en pointillés `#8A9893` (text-subtle) ; courbe 2 px `#534AB7` (chart (violet)) ; points ronds 16 px bordure blanche, valeur au-dessus (13 px gras) ; 4 emplacements horizontaux répartis ; points : 01/10 : -3,35, 15/10 : -2,38, 29/10 : -2,03
57. Tableau — x 616, y 477, 519×133 px ; colonnes : « Date » 97 px, « Poids » 97 px, « Taille » 108 px, « PB » 103 px, « z P/T » 114 px ; en-tête hauteur 41 px fond `#1F5FA8` (care (bleu soignant)) texte blanc 14 px gras ; lignes hauteur 31 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 14 px, marge gauche 7 px :
      - ligne 1 : 01/10 | 7,0 kg | 76,0 cm | 112 mm | −3,35
      - ligne 2 : 15/10 | 7,6 kg | 76,0 cm | 116 mm | −2,38
      - ligne 3 : 29/10 | 7,9 kg | 76,5 cm | 119 mm | −2,03

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Plan de prises et rappels › » → ouvre **Plan de prises** (`s_plan`)
- « Nouvelle évaluation » → ouvre **Nouvelle évaluation** (`s_eval`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W05 · Nouvelle évaluation (`s_eval`)

Référence : `web/s_eval.png`

```text
Recrée À L'IDENTIQUE l'écran « Nouvelle évaluation » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_eval.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/personnes/A-014/evaluation`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Nouvelle évaluation · Amina (#A-014) » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Texte « Date » — x 285, y 148, 239×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
3. Texte « Poids » — x 547, y 148, 239×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
4. Rectangle arrondi — x 827, y 148, 593×496 px ; fond `#E8F0FA` (care-50) ; rayon 9 px
5. Texte « Calcul automatique (tables OMS) » — x 849, y 160, 547×40 px ; 21 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 4
6. Texte « Âge » — x 849, y 211, 205×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
7. Texte « 1 an 11 mois (700 jours) » — x 1049, y 211, 353×51 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
8. Texte « Poids-pour-taille » — x 849, y 268, 205×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
9. Texte « z = −1,17 → dans la norme (≥ −2) » — x 1049, y 268, 353×51 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 4
10. Texte « Périmètre brachial » — x 849, y 325, 205×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
11. Texte « 122 mm → modérée (115 à 125 mm) » — x 1049, y 325, 353×51 px ; 16 px gras (700), couleur `#B7791F` (warning), aligné à gauche — dans l'élément n° 4
12. Texte « Œdèmes » — x 849, y 382, 205×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
13. Texte « Non » — x 1049, y 382, 353×51 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
14. Texte « Gain depuis le 29/10 » — x 849, y 439, 205×51 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 4
15. Texte « 5,2 g/kg/j → repère atteint (≥ 5) » — x 1049, y 439, 353×51 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 4
16. Rectangle arrondi — x 849, y 507, 547×108 px ; fond `#FFFFFF` (white) ; rayon 7 px — dans l'élément n° 4
17. Texte « Classement proposé : malnutrition aiguë modérée (PB < 125 mm). À confirmer par le soignant, selon le protocole national. » — x 863, y 507, 520×108 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 16
18. Rectangle arrondi — x 285, y 179, 239×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
19. Texte « 12/11/2026 » — x 299, y 179, 217×48 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 18
20. Rectangle arrondi — x 547, y 179, 239×48 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 7 px
21. Texte « 8,5 kg » — x 561, y 179, 217×48 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
22. Texte « Longueur / taille » — x 285, y 245, 239×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
23. Texte « Position de mesure » — x 547, y 245, 251×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
24. Rectangle arrondi — x 285, y 276, 239×48 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 7 px
25. Texte « 76,5 cm » — x 299, y 276, 217×48 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
26. Rectangle arrondi — x 547, y 276, 117×48 px ; fond `#1F5FA8` (care (bleu soignant)) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 7 px
27. Texte « Couchée » — x 547, y 276, 117×48 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 26
28. Rectangle arrondi — x 669, y 276, 117×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
29. Texte « Debout » — x 669, y 276, 117×48 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 28
30. Texte « Périmètre brachial » — x 285, y 342, 239×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
31. Texte « Œdèmes bilatéraux » — x 547, y 342, 251×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
32. Rectangle arrondi — x 285, y 373, 239×48 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 7 px
33. Texte « 122 mm » — x 299, y 373, 217×48 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 32
34. Rectangle arrondi — x 547, y 373, 57×48 px ; fond `#1F5FA8` (care (bleu soignant)) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 6 px
35. Texte « Non » — x 547, y 373, 57×48 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre
36. Rectangle arrondi — x 608, y 373, 57×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
37. Texte « + » — x 608, y 373, 57×48 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre
38. Rectangle arrondi — x 668, y 373, 57×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
39. Texte « ++ » — x 668, y 373, 57×48 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre
40. Rectangle arrondi — x 729, y 373, 57×48 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
41. Texte « +++ » — x 729, y 373, 57×48 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre
42. Texte « Observations » — x 285, y 439, 228×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
43. Rectangle arrondi — x 285, y 470, 502×91 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
44. Texte « Appétit correct. Prises mieux suivies depuis 10 jours. » — x 299, y 470, 479×91 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 43
45. Bouton « Enregistrer l'évaluation » — x 285, y 587, 296×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Dossier mis à jour** (`s_file_updated`)
46. Bouton « Annuler » — x 599, y 587, 182×57 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#1F5FA8` (care (bleu soignant)) centré ; rayon 11 px ; bordure 1 px `#1F5FA8` (care (bleu soignant)) → ouvre **Dossier + courbes** (`s_file`)

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Enregistrer l'évaluation » → ouvre **Dossier mis à jour** (`s_file_updated`)
- « Annuler » → ouvre **Dossier + courbes** (`s_file`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W06 · Dossier mis à jour (`s_file_updated`)

Référence : `web/s_file_updated.png`

```text
Recrée À L'IDENTIQUE l'écran « Dossier mis à jour » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_file_updated.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/personnes/A-014`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Rectangle arrondi — x 285, y 86, 308×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
2. Cercle / ellipse — x 308, y 103, 68×68 px ; fond `#E8F0FA` (care-50) — dans l'élément n° 1
3. Texte « Amina » — x 393, y 103, 182×36 px ; 24 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 1
4. Icône FontAwesome 5 solid `child` (react-icons : `FaChild`) — x 325, y 120, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 1
5. Texte « #A-014 · démo » — x 393, y 138, 182×29 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
6. Pastille « Malnutrition aiguë modérée » — x 308, y 188, 262×32 px ; fond `#FFF4D6` (warning-50) ; texte 14 px gras `#B7791F` (warning) centré ; rayon 16 px (forme de pilule) — dans l'élément n° 1
7. Texte « Sexe » — x 308, y 239, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
8. Texte « Fille » — x 422, y 239, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
9. Texte « Naissance » — x 308, y 283, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
10. Texte « 12/12/2024 » — x 422, y 283, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
11. Texte « Âge » — x 308, y 326, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
12. Texte « 1 an 11 mois » — x 422, y 326, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
13. Texte « Région » — x 308, y 369, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
14. Texte « Ouest » — x 422, y 369, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
15. Texte « Établissement » — x 308, y 413, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
16. Texte « CMA de démo » — x 422, y 413, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
17. Texte « Compte lié » — x 308, y 456, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
18. Texte « Parent · 6XX… » — x 422, y 456, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
19. Texte « Consentement » — x 308, y 499, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
20. Texte « ✓ 01/10/2026 » — x 422, y 499, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
21. Texte « Produit en cours » — x 308, y 543, 125×39 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 1
22. Texte « Plumpy'Nut » — x 422, y 543, 165×39 px ; 14 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 1
23. Bouton « Plan de prises et rappels › » — x 308, y 593, 262×48 px ; fond `#FFFFFF` (white) ; texte 16 px gras `#1F5FA8` (care (bleu soignant)) centré ; rayon 11 px ; bordure 1 px `#1F5FA8` (care (bleu soignant)) → ouvre **Plan de prises** (`s_plan`) — dans l'élément n° 1
24. Rectangle arrondi — x 616, y 86, 519×71 px ; fond `#E6F4EC` (chart-normal) ; rayon 7 px
25. Texte « Évaluation du 12/11 enregistrée. Gain : 5,2 g/kg/j. Poids-pour-taille normal ; PB encore < 125 mm : poursuivre. » — x 629, y 86, 491×71 px ; 14 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 24
26. Rectangle arrondi — x 1152, y 86, 268×570 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
27. Texte « Prises confirmées » — x 1169, y 91, 234×40 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 26
28. Rectangle arrondi — x 1165, y 137, 241×64 px ; fond `#FFF1E2` (accent-50) ; bordure 1 px `#F08A24` (accent (orange)) ; rayon 6 px — dans l'élément n° 26
29. Rectangle — x 1165, y 137, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 28
30. Texte « 12/11 12:30  · nouveau » — x 1180, y 140, 222×29 px ; 14 px gras (700), couleur `#B4610C` (accent-700), aligné à gauche — dans l'élément n° 28
31. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 169, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 28
32. Rectangle arrondi — x 1165, y 208, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
33. Rectangle — x 1165, y 208, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 32
34. Texte « 11/11 18:00 » — x 1180, y 211, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 32
35. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 239, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 32
36. Rectangle arrondi — x 1165, y 278, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
37. Rectangle — x 1165, y 278, 7×64 px ; fond `#B7791F` (warning) — dans l'élément n° 36
38. Texte « 11/11 12:00 » — x 1180, y 282, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 36
39. Texte « Plumpy'Nut · 1 · moitié » — x 1180, y 310, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 36
40. Rectangle arrondi — x 1165, y 349, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
41. Rectangle — x 1165, y 349, 7×64 px ; fond `#C93C3C` (danger) — dans l'élément n° 40
42. Texte « 10/11 18:00 » — x 1180, y 352, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 40
43. Texte « Non confirmée » — x 1180, y 381, 222×27 px ; 14 px normal (400), couleur `#C93C3C` (danger), aligné à gauche — dans l'élément n° 40
44. Rectangle arrondi — x 1165, y 420, 241×64 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 26
45. Rectangle — x 1165, y 420, 7×64 px ; fond `#0F7B5F` (primary (vert)) — dans l'élément n° 44
46. Texte « 10/11 12:00 » — x 1180, y 423, 222×29 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 44
47. Texte « Plumpy'Nut · 1 · tout » — x 1180, y 451, 222×27 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 44
48. Bouton « Retour au tableau de bord » — x 1165, y 490, 241×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 16 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Tableau de bord** (`s_dashboard`) — dans l'élément n° 26
49. Bouton « Terminer la démo › » — x 1165, y 553, 241×48 px ; fond `#FFFFFF` (white) ; texte 16 px gras `#1F5FA8` (care (bleu soignant)) centré ; rayon 11 px ; bordure 1 px `#1F5FA8` (care (bleu soignant)) → ouvre **Conclusion** (`end`) — dans l'élément n° 26
50. Texte « La prise « nouveau » est celle confirmée par le parent dans la démo mobile. » — x 1165, y 604, 241×48 px ; 13 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 26
51. Rectangle arrondi — x 616, y 168, 165×34 px ; fond `#1F5FA8` (care (bleu soignant)) ; bordure 1 px `#1F5FA8` (care (bleu soignant)) ; rayon 6 px
52. Texte « Poids-pour-taille » — x 616, y 168, 165×34 px ; 14 px gras (700), couleur `#FFFFFF` (white), aligné au centre
53. Rectangle arrondi — x 787, y 168, 165×34 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
54. Texte « Périm. brachial » — x 787, y 168, 165×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné au centre
55. Rectangle arrondi — x 958, y 168, 165×34 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
56. Texte « Taille-pour-âge » — x 958, y 168, 165×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné au centre
57. Graphique de z-score (composant `ZScoreChart`) — x 621, y 222, 507×245 px : axe vertical de +1 à −4 (graduations +1, 0, −1, −2, −3, −4, étiquettes 13 px `#5B6B66` (text-muted) à gauche) ; bandes de fond : z ≥ −2 `#E6F4EC` (chart-normal) (libellé « Normal » `#0F7B5F` (primary (vert))), −3 à −2 `#FFF4D6` (warning-50) (« Modérée » `#B7791F` (warning)), < −3 `#FDECEC` (danger-50) (« Sévère » `#C93C3C` (danger)) ; lignes de grille 1 px `#D9DFDC` (chart-grid), ligne 0 en pointillés `#8A9893` (text-subtle) ; courbe 2 px `#534AB7` (chart (violet)) ; points ronds 16 px bordure blanche, valeur au-dessus (13 px gras) ; 4 emplacements horizontaux répartis ; points : 01/10 : -3,35, 15/10 : -2,38, 29/10 : -2,03, 12/11 : -1,17 ; dernier point en orange `#F08A24` (accent (orange)) (nouvelle évaluation)
58. Tableau — x 616, y 477, 519×164 px ; colonnes : « Date » 97 px, « Poids » 97 px, « Taille » 108 px, « PB » 103 px, « z P/T » 114 px ; en-tête hauteur 41 px fond `#1F5FA8` (care (bleu soignant)) texte blanc 14 px gras ; lignes hauteur 31 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 14 px, marge gauche 7 px :
      - ligne 1 : 01/10 | 7,0 kg | 76,0 cm | 112 mm | −3,35
      - ligne 2 : 15/10 | 7,6 kg | 76,0 cm | 116 mm | −2,38
      - ligne 3 : 29/10 | 7,9 kg | 76,5 cm | 119 mm | −2,03
      - ligne 4 : 12/11 | 8,5 kg | 76,5 cm | 122 mm | −1,17 — fond `#FFF1E2` (accent-50)

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Plan de prises et rappels › » → ouvre **Plan de prises** (`s_plan`)
- « Retour au tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- « Terminer la démo › » → ouvre **Conclusion** (`end`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W07 · Plan de prises (`s_plan`)

Référence : `web/s_plan.png`

```text
Recrée À L'IDENTIQUE l'écran « Plan de prises » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_plan.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/personnes/A-014/plan`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Plan de prises et rappels · Amina (#A-014) » — x 285, y 80, 798×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Tableau — x 285, y 148, 690×212 px ; colonnes : « Heure » 103 px, « Produit » 182 px, « Quantité » 125 px, « Jours » 148 px, « Rappel parent » 131 px ; en-tête hauteur 41 px fond `#1F5FA8` (care (bleu soignant)) texte blanc 14 px gras ; lignes hauteur 57 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 17 px, marge gauche 7 px :
      - ligne 1 : **08:00** | Plumpy'Nut | 1 sachet | Tous les jours | 
      - ligne 2 : **12:30** | Plumpy'Nut | 1 sachet | Tous les jours | 
      - ligne 3 : **18:00** | Plumpy'Nut | 1 sachet | Tous les jours | 
3. Rectangle arrondi — x 1003, y 148, 416×496 px ; fond `#E8F0FA` (care-50) ; rayon 9 px
4. Texte « Notifications de ce plan » — x 1026, y 156, 371×40 px ; 21 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 3
5. Texte « AU PARENT » — x 1026, y 205, 371×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 3
6. Texte « Rappel à chaque heure » — x 1026, y 236, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
7. Interrupteur ACTIVÉ — x 1334, y 238, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
8. Texte « Relance après 30 min » — x 1026, y 279, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
9. Interrupteur ACTIVÉ — x 1334, y 282, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
10. Texte « SMS si hors ligne » — x 1026, y 323, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
11. Interrupteur DÉSACTIVÉ — x 1334, y 325, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 3
12. Texte « À MOI (SOIGNANT) » — x 1026, y 376, 371×29 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 3
13. Texte « À chaque heure prévue » — x 1026, y 407, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
14. Interrupteur ACTIVÉ — x 1334, y 409, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
15. Texte « À chaque prise confirmée » — x 1026, y 450, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
16. Interrupteur ACTIVÉ — x 1334, y 453, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
17. Texte « Prise non confirmée » — x 1026, y 494, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
18. Interrupteur ACTIVÉ — x 1334, y 496, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
19. Texte « Résumé quotidien à 20:00 » — x 1026, y 537, 302×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
20. Interrupteur ACTIVÉ — x 1334, y 539, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 3
21. Texte « Réglages généraux › » — x 1026, y 593, 371×34 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche → ouvre **Réglages notifications** (`s_notif_settings`) (zone tactile = l'élément entier) — dans l'élément n° 3
22. Interrupteur ACTIVÉ — x 901, y 202, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
23. Interrupteur ACTIVÉ — x 901, y 259, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
24. Interrupteur ACTIVÉ — x 901, y 316, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
25. Texte « + Ajouter une heure » — x 285, y 376, 342×40 px ; 17 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche
26. Texte « Durée : du 01/10/2026 au 26/11/2026 » — x 285, y 422, 684×40 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche
27. Rectangle arrondi — x 285, y 479, 690×86 px ; fond `#FFF4D6` (warning-50) ; rayon 7 px
28. Texte « Les quantités sont fixées par le soignant selon le protocole. L'application ne calcule pas de dose. » — x 302, y 479, 661×86 px ; 16 px normal (400), couleur `#7A5300` (warning-900), aligné à gauche — dans l'élément n° 27
29. Bouton « Enregistrer le plan » — x 285, y 587, 296×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Dossier + courbes** (`s_file`)

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Enregistrer le plan » → ouvre **Dossier + courbes** (`s_file`)
- « Réglages généraux » → ouvre **Réglages notifications** (`s_notif_settings`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W08 · Notifications (`s_notif`)

Référence : `web/s_notif.png`

```text
Recrée À L'IDENTIQUE l'écran « Notifications » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_notif.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/notifications`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Notifications » — x 285, y 80, 570×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Bouton « Réglages » — x 1152, y 83, 268×48 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#1F5FA8` (care (bleu soignant)) centré ; rayon 11 px ; bordure 1 px `#1F5FA8` (care (bleu soignant)) → ouvre **Réglages notifications** (`s_notif_settings`)
3. Pastille « Toutes » — x 285, y 143, 120×34 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 16 px gras `#FFFFFF` (white) centré ; rayon 17 px (forme de pilule)
4. Pastille « Prises » — x 416, y 143, 120×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
5. Pastille « Rappels » — x 547, y 143, 120×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
6. Pastille « Alertes » — x 678, y 143, 120×34 px ; fond `#F1F3F2` (neutral-100) ; texte 16 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
7. Texte « Tout marquer comme lu » — x 855, y 143, 285×34 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite
8. Rectangle arrondi — x 285, y 200, 1134×80 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px → ouvre **Dossier + courbes** (`s_file`) (zone tactile = l'élément entier)
9. Texte « Ouvrir › » — x 1266, y 200, 108×80 px ; 16 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
10. Texte « 12:31 · #A-014 Amina a reçu Plumpy'Nut · 1 sachet · tout » — x 365, y 206, 912×36 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
11. Icône FontAwesome 5 solid `check-circle` (react-icons : `FaCheckCircle`) — x 308, y 222, 34 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 8
12. Cercle / ellipse — x 1385, y 233, 14×14 px ; fond `#F08A24` (accent (orange)) — dans l'élément n° 8
13. Texte « Confirmé par le parent · prise prévue à 12:30 » — x 365, y 243, 912×30 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 8
14. Rectangle arrondi — x 285, y 288, 1134×80 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
15. Texte « 12:30 · Rappel envoyé : 3 personnes ont une prise prévue » — x 365, y 295, 912×36 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 14
16. Icône FontAwesome 5 solid `bell` (react-icons : `FaBell`) — x 308, y 311, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 14
17. Cercle / ellipse — x 1385, y 322, 14×14 px ; fond `#F08A24` (accent (orange)) — dans l'élément n° 14
18. Texte « #A-014 Amina · #B-007 · #A-022 » — x 365, y 332, 912×30 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 14
19. Rectangle arrondi — x 285, y 377, 1134×80 px ; fond `#E8F0FA` (care-50) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
20. Texte « 08:30 · #B-007 · prise de 08:00 non confirmée » — x 365, y 384, 912×36 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 19
21. Icône FontAwesome 5 solid `exclamation-circle` (react-icons : `FaExclamationCircle`) — x 308, y 400, 34 px, couleur `#B7791F` (warning) — dans l'élément n° 19
22. Cercle / ellipse — x 1385, y 410, 14×14 px ; fond `#F08A24` (accent (orange)) — dans l'élément n° 19
23. Texte « Relance envoyée au parent à 08:30 » — x 365, y 421, 912×30 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 19
24. Rectangle arrondi — x 285, y 466, 1134×80 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
25. Texte « Hier 11:02 · #A-022 · œdèmes bilatéraux signalés » — x 365, y 473, 912×36 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 24
26. Icône FontAwesome 5 solid `exclamation-triangle` (react-icons : `FaExclamationTriangle`) — x 308, y 489, 34 px, couleur `#C93C3C` (danger) — dans l'élément n° 24
27. Texte « Alerte clinique · à revoir en urgence » — x 365, y 510, 912×30 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 24
28. Rectangle arrondi — x 285, y 555, 1134×80 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
29. Texte « Hier 09:00 · Résumé quotidien » — x 365, y 562, 912×36 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 28
30. Icône FontAwesome 5 solid `calendar-alt` (react-icons : `FaCalendarAlt`) — x 308, y 578, 34 px, couleur `#1F5FA8` (care (bleu soignant)) — dans l'élément n° 28
31. Texte « Prises confirmées hier : 9 sur 12 (démo) » — x 365, y 599, 912×30 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 28

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Réglages » → ouvre **Réglages notifications** (`s_notif_settings`)
- « 12:31 · #A-014 Amina a reçu Plumpy'Nut · 1 sachet · tout » → ouvre **Dossier + courbes** (`s_file`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W09 · Réglages notifications (`s_notif_settings`)

Référence : `web/s_notif_settings.png`

```text
Recrée À L'IDENTIQUE l'écran « Réglages notifications » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/s_notif_settings.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `app.tsotsakids.org/soignant/parametres/notifications`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#1F5FA8` (care (bleu soignant)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Espace soignant » 22 px gras blanc ; à droite « Dr [Nom] · CMA de démo » 17 px blanc aligné à droite (marge droite 21 px) ; cloche FontAwesome 5 solid `bell` (react-icons : `FaBell`) 32 px blanche à x 884 avec pastille ronde rouge `#E5484D` 23 px affichant « 4 » (13 px gras blanc).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Tableau de bord » (tachometer-alt) ; « Personnes suivies » (users) ; « Alertes » (exclamation-triangle) ; « Notifications » (bell) ; « Évaluations » (clipboard-list) ; « Paramètres » (cog) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#E8F0FA` (care-50) rayon 7 px, icône et libellé `#1F5FA8` (care (bleu soignant)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Mes réglages de notifications » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle — x 285, y 148, 752×41 px ; fond `#1F5FA8` (care (bleu soignant))
3. Texte « Type » — x 296, y 148, 285×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné à gauche — dans l'élément n° 2
4. Texte « Web » — x 627, y 148, 103×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 2
5. Texte « Téléphone » — x 730, y 148, 103×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 2
6. Texte « E-mail » — x 832, y 148, 103×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 2
7. Texte « SMS » — x 935, y 148, 103×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 2
8. Rectangle arrondi — x 1066, y 148, 353×496 px ; fond `#E8F0FA` (care-50) ; rayon 9 px
9. Texte « Par personne suivie » — x 1089, y 156, 308×40 px ; 21 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche — dans l'élément n° 8
10. Texte « #A-014 Amina » — x 1089, y 211, 148×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
11. Texte « Tout ▾ » — x 1226, y 211, 171×46 px ; 14 px normal (400), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
12. Texte « #A-022 » — x 1089, y 268, 148×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
13. Texte « Tout ▾ » — x 1226, y 268, 171×46 px ; 14 px normal (400), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
14. Texte « #B-007 » — x 1089, y 325, 148×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
15. Texte « Oublis et alertes ▾ » — x 1226, y 325, 171×46 px ; 14 px normal (400), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
16. Texte « #B-011 » — x 1089, y 382, 148×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
17. Texte « Alertes seulement ▾ » — x 1226, y 382, 171×46 px ; 14 px normal (400), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
18. Texte « Heures calmes » — x 1089, y 456, 182×40 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
19. Texte « 21:00 – 06:00 » — x 1260, y 456, 137×40 px ; 17 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à droite — dans l'élément n° 8
20. Texte « Sauf alertes cliniques urgentes (à valider). » — x 1089, y 496, 308×46 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 8
21. Rectangle — x 285, y 189, 752×57 px ; fond `#F7F9F8` (surface-2)
22. Texte « Rappel à chaque heure prévue » — x 296, y 189, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 21
23. Interrupteur ACTIVÉ — x 649, y 202, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 21
24. Interrupteur DÉSACTIVÉ — x 751, y 202, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 21
25. Interrupteur DÉSACTIVÉ — x 854, y 202, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 21
26. Interrupteur DÉSACTIVÉ — x 957, y 202, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 21
27. Rectangle — x 285, y 246, 752×57 px ; fond `#FFFFFF` (white)
28. Texte « Prise confirmée par le parent » — x 296, y 246, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 27
29. Interrupteur ACTIVÉ — x 649, y 259, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 27
30. Interrupteur ACTIVÉ — x 751, y 259, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 27
31. Interrupteur DÉSACTIVÉ — x 854, y 259, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 27
32. Interrupteur DÉSACTIVÉ — x 957, y 259, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 27
33. Rectangle — x 285, y 303, 752×57 px ; fond `#F7F9F8` (surface-2)
34. Texte « Prise non confirmée » — x 296, y 303, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 33
35. Interrupteur ACTIVÉ — x 649, y 316, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 33
36. Interrupteur ACTIVÉ — x 751, y 316, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 33
37. Interrupteur DÉSACTIVÉ — x 854, y 316, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 33
38. Interrupteur DÉSACTIVÉ — x 957, y 316, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 33
39. Rectangle — x 285, y 360, 752×57 px ; fond `#FFFFFF` (white)
40. Texte « Alerte clinique » — x 296, y 360, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 39
41. Interrupteur ACTIVÉ — x 649, y 373, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 39
42. Interrupteur ACTIVÉ — x 751, y 373, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 39
43. Interrupteur ACTIVÉ — x 854, y 373, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 39
44. Interrupteur ACTIVÉ — x 957, y 373, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 39
45. Rectangle — x 285, y 417, 752×57 px ; fond `#F7F9F8` (surface-2)
46. Texte « Résumé quotidien » — x 296, y 417, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 45
47. Interrupteur DÉSACTIVÉ — x 649, y 430, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 45
48. Interrupteur DÉSACTIVÉ — x 751, y 430, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 45
49. Interrupteur ACTIVÉ — x 854, y 430, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 45
50. Interrupteur DÉSACTIVÉ — x 957, y 430, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 45
51. Rectangle — x 285, y 474, 752×57 px ; fond `#FFFFFF` (white)
52. Texte « Nouvelle personne rattachée » — x 296, y 474, 331×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 51
53. Interrupteur ACTIVÉ — x 649, y 487, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 51
54. Interrupteur DÉSACTIVÉ — x 751, y 487, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 51
55. Interrupteur ACTIVÉ — x 854, y 487, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 51
56. Interrupteur DÉSACTIVÉ — x 957, y 487, 59×32 px ; piste `#C9D1CE` (toggle-off) rayon 16 px ; bouton rond blanc 25 px, à gauche — dans l'élément n° 51
57. Bouton « Enregistrer » — x 285, y 564, 274×57 px ; fond `#1F5FA8` (care (bleu soignant)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Notifications** (`s_notif`)

Interactions :
- Menu « Tableau de bord » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Personnes suivies » → ouvre **Personnes suivies** (`s_list`)
- Menu « Alertes » → ouvre **Tableau de bord** (`s_dashboard`)
- Menu « Notifications » → ouvre **Notifications** (`s_notif`)
- Menu « Évaluations » → ouvre **Nouvelle évaluation** (`s_eval`)
- Menu « Paramètres » → ouvre **Réglages notifications** (`s_notif_settings`)
- Cloche (en-tête) → ouvre **Notifications** (`s_notif`)
- « Enregistrer » → ouvre **Notifications** (`s_notif`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W10 · Vue d'ensemble (`a_dashboard`)

Référence : `web/a_dashboard.png`

```text
Recrée À L'IDENTIQUE l'écran « Vue d'ensemble » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_dashboard.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Vue d'ensemble » — x 285, y 80, 570×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Carte indicateur — x 285, y 148, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#1F5FA8` (care (bleu soignant)) ; valeur « 1 » 38 px gras `#1F5FA8` (care (bleu soignant)) ; libellé « soignant à vérifier » 16 px `#5B6B66` (text-muted) → ouvre **Vérifications** (`a_verify`)
3. Carte indicateur — x 570, y 148, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#B7791F` (warning) ; valeur « 1 » 38 px gras `#B7791F` (warning) ; libellé « produit utilisateur à vérifier » 16 px `#5B6B66` (text-muted) → ouvre **Vérifications** (`a_verify`)
4. Carte indicateur — x 855, y 148, 262×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#334155` (admin (ardoise)) ; valeur « — » 38 px gras `#334155` (admin (ardoise)) ; libellé « lots d'aliments à valider » 16 px `#5B6B66` (text-muted) → ouvre **Base aliments ORKG** (`a_import`)
5. Carte indicateur — x 1140, y 148, 279×114 px ; fond blanc, bordure 1 px `#D5DEDA` (border), rayon 9 px, barre verticale gauche 9 px `#C93C3C` (danger) ; valeur « 0 / 6 » 38 px gras `#C93C3C` (danger) ; libellé « prix renseignés » 16 px `#5B6B66` (text-muted) → ouvre **Prix par région** (`a_prices`)
6. Rectangle arrondi — x 285, y 291, 1134×359 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
7. Texte « Santé de la plateforme » — x 308, y 300, 570×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 6
8. Rectangle arrondi — x 308, y 359, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
9. Texte « Comptes utilisateurs » — x 325, y 359, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
10. Texte « — » — x 695, y 359, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 8
11. Rectangle arrondi — x 867, y 359, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
12. Texte « Soignants vérifiés » — x 884, y 359, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Texte « — » — x 1254, y 359, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 11
14. Rectangle arrondi — x 308, y 428, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
15. Texte « Personnes suivies » — x 325, y 428, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 14
16. Texte « — » — x 695, y 428, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 14
17. Rectangle arrondi — x 867, y 428, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
18. Texte « Prises confirmées (7 jours) » — x 884, y 428, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
19. Texte « — » — x 1254, y 428, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 17
20. Rectangle arrondi — x 308, y 496, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
21. Texte « Synchronisations en échec » — x 325, y 496, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 20
22. Texte « — » — x 695, y 496, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 20
23. Rectangle arrondi — x 867, y 496, 536×57 px ; fond `#F7F9F8` (surface-2) ; rayon 6 px — dans l'élément n° 6
24. Texte « Dernière sauvegarde restaurée » — x 884, y 496, 376×57 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 23
25. Texte « — » — x 1254, y 496, 137×57 px ; 19 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 23
26. Texte « Les chiffres s'afficheront avec les données réelles. Aucune valeur inventée dans l'administration. » — x 308, y 576, 1083×46 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 6

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « soignant à vérifier » → ouvre **Vérifications** (`a_verify`)
- « produit utilisateur à vérifier » → ouvre **Vérifications** (`a_verify`)
- « lots d'aliments à valider » → ouvre **Base aliments ORKG** (`a_import`)
- « prix renseignés » → ouvre **Prix par région** (`a_prices`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W11 · Vérifications (`a_verify`)

Référence : `web/a_verify.png`

```text
Recrée À L'IDENTIQUE l'écran « Vérifications » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_verify.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/verifications`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Vérifications » — x 285, y 80, 570×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Texte « Soignants en attente » — x 285, y 143, 570×40 px ; 21 px gras (700), couleur `#1F5FA8` (care (bleu soignant)), aligné à gauche
3. Rectangle arrondi — x 285, y 188, 1134×148 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
4. Texte « Dr [Nom] · pédiatre · CMA de démo » — x 308, y 197, 570×40 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 3
5. Bouton « Valider » — x 1072, y 211, 154×48 px ; fond `#0F7B5F` (primary (vert)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Vue d'ensemble** (`a_dashboard`) — dans l'élément n° 3
6. Bouton « Refuser » — x 1243, y 211, 154×48 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#C93C3C` (danger) centré ; rayon 11 px ; bordure 1 px `#C93C3C` (danger) → ouvre **Vue d'ensemble** (`a_dashboard`) — dans l'élément n° 3
7. Texte « Carte professionnelle (PDF) ✓   ·   Numéro d'ordre [à contrôler]   ·   Inscrit le 12/11 » — x 308, y 239, 741×34 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 3
8. Texte « Accès donné uniquement aux personnes de son établissement. » — x 308, y 279, 741×34 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 3
9. Texte « Produits ajoutés par les utilisateurs » — x 285, y 365, 684×40 px ; 21 px gras (700), couleur `#B7791F` (warning), aligné à gauche
10. Rectangle arrondi — x 285, y 410, 1134×239 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
11. Texte « Farine infantile enrichie · ajouté par un compte utilisateur » — x 308, y 420, 741×40 px ; 19 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
12. Bouton « Valider et rendre public » — x 1072, y 433, 325×48 px ; fond `#0F7B5F` (primary (vert)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Vue d'ensemble** (`a_dashboard`) — dans l'élément n° 10
13. Texte « Énergie : 400 kcal » — x 308, y 464, 148×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
14. Texte « Protéines : 15 g » — x 456, y 464, 148×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
15. Texte « Lipides : 9 g » — x 604, y 464, 148×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
16. Texte « Fer : 8 mg » — x 752, y 464, 148×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
17. Texte « Calcium : 300 mg » — x 901, y 464, 148×34 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
18. Bouton « Garder privé / corriger » — x 1072, y 496, 325×48 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#334155` (admin (ardoise)) centré ; rayon 11 px ; bordure 1 px `#334155` (admin (ardoise)) → ouvre **Vue d'ensemble** (`a_dashboard`) — dans l'élément n° 10
19. Texte « Contrôles automatiques : unités ✓   valeurs plausibles ✓   photo de l'étiquette ✓ » — x 308, y 507, 741×34 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 10

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Valider » → ouvre **Vue d'ensemble** (`a_dashboard`)
- « Refuser » → ouvre **Vue d'ensemble** (`a_dashboard`)
- « Valider et rendre public » → ouvre **Vue d'ensemble** (`a_dashboard`)
- « Garder privé / corriger » → ouvre **Vue d'ensemble** (`a_dashboard`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W12 · Comptes (`a_accounts`)

Référence : `web/a_accounts.png`

```text
Recrée À L'IDENTIQUE l'écran « Comptes » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_accounts.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/comptes`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Comptes » — x 285, y 80, 456×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 986, y 80, 433×570 px ; fond `#EEF1F5` (admin-50) ; rayon 9 px
3. Texte « Créer un compte » — x 1009, y 88, 388×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 2
4. Rectangle arrondi — x 1009, y 143, 125×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px — dans l'élément n° 2
5. Texte « Utilisateur » — x 1009, y 143, 125×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 4
6. Rectangle arrondi — x 1140, y 143, 125×41 px ; fond `#334155` (admin (ardoise)) ; bordure 1 px `#334155` (admin (ardoise)) ; rayon 6 px — dans l'élément n° 2
7. Texte « Soignant » — x 1140, y 143, 125×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 6
8. Rectangle arrondi — x 1271, y 143, 125×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px — dans l'élément n° 2
9. Texte « Admin » — x 1271, y 143, 125×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 8
10. Texte « Téléphone ou adresse e-mail (Google ou autre) » — x 1009, y 197, 388×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 2
11. Rectangle arrondi — x 1009, y 227, 388×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px — dans l'élément n° 2
12. Texte « +237 6XX XX XX XX » — x 1020, y 227, 365×43 px ; 16 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 11
13. Texte « Établissement » — x 1009, y 279, 388×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 2
14. Rectangle arrondi — x 1009, y 309, 388×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px — dans l'élément n° 2
15. Texte « CMA de démo ▾ » — x 1020, y 309, 365×43 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 14
16. Texte « Soignant vérifié d'office » — x 1009, y 368, 296×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 2
17. Interrupteur ACTIVÉ — x 1334, y 371, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 2
18. Texte « Envoyer une invitation (SMS ou e-mail) » — x 1009, y 416, 319×36 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 2
19. Interrupteur ACTIVÉ — x 1334, y 418, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite — dans l'élément n° 2
20. Bouton « Créer et inviter » — x 1009, y 490, 388×57 px ; fond `#334155` (admin (ardoise)) ; texte 19 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Comptes** (`a_accounts`) — dans l'élément n° 2
21. Texte « La personne choisit elle-même sa connexion (Google, téléphone ou e-mail) en ouvrant l'invitation. Action tracée dans le journal d'audit. » — x 1009, y 559, 388×80 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 2
22. Pastille « Tous » — x 285, y 143, 137×34 px ; fond `#334155` (admin (ardoise)) ; texte 14 px gras `#FFFFFF` (white) centré ; rayon 17 px (forme de pilule)
23. Pastille « Utilisateurs » — x 433, y 143, 137×34 px ; fond `#F1F3F2` (neutral-100) ; texte 14 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
24. Pastille « Soignants » — x 581, y 143, 137×34 px ; fond `#F1F3F2` (neutral-100) ; texte 14 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
25. Pastille « Administrateurs » — x 730, y 143, 137×34 px ; fond `#F1F3F2` (neutral-100) ; texte 14 px gras `#17302A` (text) centré ; rayon 17 px (forme de pilule)
26. Tableau — x 285, y 194, 678×260 px ; colonnes : « Compte » 200 px, « Connexion » 114 px, « Rôle » 114 px, « Établissement » 137 px, « Statut » 114 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 55 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 16 px, marge gauche 7 px :
      - ligne 1 : **Compte parent (démo)** | Téléphone | Utilisateur | — | **Actif** (`#0F7B5F` (primary (vert)))
      - ligne 2 : **Dr [Nom]** | Google | Soignant | CMA de démo | **À vérifier** (`#B7791F` (warning))
      - ligne 3 : **parent2@exemple.com** | E-mail | Utilisateur | — | **Invité** (`#1F5FA8` (care (bleu soignant)))
      - ligne 4 : **Équipe TSOTSA** | Google | Admin | — | **Actif** (`#0F7B5F` (primary (vert)))
27. Texte « Personnes suivies rattachées à un compte : visibles dans le détail du compte. » — x 285, y 467, 673×34 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Créer et inviter » → ouvre **Comptes** (`a_accounts`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W13 · Base aliments ORKG (`a_import`)

Référence : `web/a_import.png`

```text
Recrée À L'IDENTIQUE l'écran « Base aliments ORKG » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_import.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/base-aliments`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Base aliments (extraite d'ORKG) » — x 285, y 80, 570×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Bouton « Importer un fichier » — x 872, y 83, 291×51 px ; fond `#334155` (admin (ardoise)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Import d'un fichier** (`a_import_preview`)
3. Bouton « Saisie manuelle » — x 1180, y 83, 239×51 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#334155` (admin (ardoise)) centré ; rayon 11 px ; bordure 1 px `#334155` (admin (ardoise)) → ouvre **Saisie d'un aliment** (`a_food_new`)
4. Tableau — x 285, y 154, 1134×144 px ; colonnes : « Lot » 91 px, « Source » 445 px, « Saisi par » 160 px, « Lignes » 114 px, « Statut » 325 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 51 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 16 px, marge gauche 7 px :
      - ligne 1 : **Lot 1** | Comparaison ORKG R[identifiant] · export CSV · gabarit TSOTSA | Fidel | — | **À valider (2ᵉ relecture)** (`#B7791F` (warning))
      - ligne 2 : **Lot 2** | Saisie manuelle · articles [références] | — | — | Brouillon (`#5B6B66` (text-muted))
5. Rectangle arrondi — x 285, y 319, 553×331 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
6. Texte « Contrôles avant validation » — x 308, y 327, 502×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
7. Texte « Nutriments reconnus » — x 308, y 376, 376×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
8. Texte « — » — x 695, y 376, 114×41 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 5
9. Texte « Unités harmonisées (pour 100 g) » — x 308, y 422, 376×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
10. Texte « — » — x 695, y 422, 114×41 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 5
11. Texte « Valeurs hors limites » — x 308, y 467, 376×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
12. Texte « — » — x 695, y 467, 114×41 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 5
13. Texte « Doublons » — x 308, y 513, 376×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
14. Texte « — » — x 695, y 513, 114×41 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 5
15. Texte « Source renseignée (ORKG + article) » — x 308, y 559, 376×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
16. Texte « — » — x 695, y 559, 114×41 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 5
17. Rectangle arrondi — x 867, y 319, 553×331 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
18. Texte « Dictionnaire des nutriments » — x 889, y 327, 502×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
19. Texte « Protein, proteins, protéines » — x 889, y 376, 308×41 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 17
20. Texte « → protéines (g) » — x 1186, y 376, 222×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
21. Texte « Fat, lipids, matières grasses » — x 889, y 422, 308×41 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 17
22. Texte « → lipides (g) » — x 1186, y 422, 222×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
23. Texte « Iron, Fe » — x 889, y 467, 308×41 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 17
24. Texte « → fer (mg) » — x 1186, y 467, 222×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
25. Texte « Calcium, Ca » — x 889, y 513, 308×41 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 17
26. Texte « → calcium (mg) » — x 1186, y 513, 222×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
27. Texte « Energy, énergie (kJ ou kcal) » — x 889, y 559, 308×41 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 17
28. Texte « → énergie (kcal) » — x 1186, y 559, 222×41 px ; 14 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Importer un fichier » → ouvre **Import d'un fichier** (`a_import_preview`)
- « Saisie manuelle » → ouvre **Saisie d'un aliment** (`a_food_new`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W14 · Saisie d'un aliment (`a_food_new`)

Référence : `web/a_food_new.png`

```text
Recrée À L'IDENTIQUE l'écran « Saisie d'un aliment » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_food_new.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/base-aliments/nouveau`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Nouvel aliment · saisie manuelle » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Texte « Nom » — x 285, y 143, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
3. Texte « Nom local » — x 564, y 143, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
4. Rectangle arrondi — x 855, y 143, 564×445 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
5. Texte « Composition pour 100 g » — x 878, y 150, 342×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
6. Tableau — x 878, y 200, 519×269 px ; colonnes : « Nutriment » 200 px, « Valeur » 125 px, « Unité » 103 px, «  » 91 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 46 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 16 px, marge gauche 7 px :
      - ligne 1 : Énergie | 567 | kcal | ✕
      - ligne 2 : Protéines | 25,8 | g | ✕
      - ligne 3 : Lipides | 49,2 | g | ✕
      - ligne 4 : Fer | 4,6 | mg | ✕
      - ligne 5 : Calcium | 92 | mg | ✕ — dans l'élément n° 4
7. Texte « + Ajouter un nutriment » — x 878, y 475, 342×34 px ; 16 px gras (700), couleur `#334155` (admin (ardoise)), aligné à gauche — dans l'élément n° 4
8. Texte « Contrôles :  unités ✓   valeurs plausibles ✓   source ✓ » — x 878, y 519, 519×34 px ; 16 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche — dans l'élément n° 4
9. Rectangle arrondi — x 285, y 172, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
10. Texte « Arachide » — x 296, y 172, 239×43 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 9
11. Rectangle arrondi — x 564, y 172, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
12. Texte « [nom local] » — x 576, y 172, 239×43 px ; 16 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 11
13. Texte « Catégorie » — x 285, y 222, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
14. Texte « État » — x 564, y 222, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
15. Rectangle arrondi — x 285, y 252, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
16. Texte « Oléagineux ▾ » — x 296, y 252, 239×43 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
17. Rectangle arrondi — x 564, y 252, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
18. Texte « Graine crue ▾ » — x 576, y 252, 239×43 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 17
19. Texte « Régions où il est disponible » — x 285, y 302, 342×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
20. Pastille « Ouest ✕ » — x 285, y 334, 112×34 px ; fond `#EEF1F5` (admin-50) ; texte 14 px gras `#334155` (admin (ardoise)) centré ; rayon 17 px (forme de pilule)
21. Pastille « Centre ✕ » — x 405, y 334, 112×34 px ; fond `#EEF1F5` (admin-50) ; texte 14 px gras `#334155` (admin (ardoise)) centré ; rayon 17 px (forme de pilule)
22. Pastille « + Région » — x 524, y 334, 112×34 px ; fond `#FFFFFF` (white) ; texte 14 px gras `#5B6B66` (text-muted) centré ; rayon 17 px (forme de pilule)
23. Texte « Comparaison ORKG » — x 285, y 382, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
24. Texte « Article (référence ou DOI) » — x 564, y 382, 262×27 px ; 14 px gras (700), couleur `#5B6B66` (text-muted), aligné à gauche
25. Rectangle arrondi — x 285, y 412, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
26. Texte « R[identifiant] » — x 296, y 412, 239×43 px ; 16 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 25
27. Rectangle arrondi — x 564, y 412, 262×43 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
28. Texte « [référence] » — x 576, y 412, 239×43 px ; 16 px normal (400), couleur `#8A9893` (text-subtle), aligné à gauche — dans l'élément n° 27
29. Rectangle arrondi — x 285, y 473, 542×114 px ; fond `#F7F9F8` (surface-2) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
30. Texte « Limites pour l'optimisation (facultatif) » — x 302, y 479, 502×34 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 29
31. Texte « Portion minimale et maximale par repas (g) : à définir avec l'équipe médicale » — x 302, y 513, 513×63 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 29
32. Bouton « Enregistrer en brouillon » — x 285, y 604, 285×51 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#334155` (admin (ardoise)) centré ; rayon 11 px ; bordure 1 px `#334155` (admin (ardoise)) → ouvre **Base aliments ORKG** (`a_import`)
33. Bouton « Soumettre à validation » — x 587, y 604, 285×51 px ; fond `#334155` (admin (ardoise)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Base aliments ORKG** (`a_import`)

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Enregistrer en brouillon » → ouvre **Base aliments ORKG** (`a_import`)
- « Soumettre à validation » → ouvre **Base aliments ORKG** (`a_import`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W15 · Import d'un fichier (`a_import_preview`)

Référence : `web/a_import_preview.png`

```text
Recrée À L'IDENTIQUE l'écran « Import d'un fichier » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_import_preview.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/base-aliments/import`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Importer un fichier (Excel ou CSV) » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Texte « Télécharger le gabarit vide › » — x 1077, y 86, 342×40 px ; 16 px gras (700), couleur `#334155` (admin (ardoise)), aligné à droite
3. Rectangle arrondi — x 285, y 143, 274×46 px ; fond `#EEF1F5` (admin-50) ; rayon 7 px
4. Texte « 1  Fichier  ✓ » — x 285, y 143, 274×46 px ; 16 px gras (700), couleur `#334155` (admin (ardoise)), aligné au centre — dans l'élément n° 3
5. Rectangle arrondi — x 570, y 143, 274×46 px ; fond `#EEF1F5` (admin-50) ; rayon 7 px
6. Texte « 2  Colonnes  ✓ » — x 570, y 143, 274×46 px ; 16 px gras (700), couleur `#334155` (admin (ardoise)), aligné au centre — dans l'élément n° 5
7. Rectangle arrondi — x 855, y 143, 274×46 px ; fond `#334155` (admin (ardoise)) ; rayon 7 px
8. Texte « 3  Contrôles » — x 855, y 143, 274×46 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 7
9. Rectangle arrondi — x 1140, y 143, 274×46 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 7 px
10. Texte « 4  Validation » — x 1140, y 143, 274×46 px ; 16 px gras (700), couleur `#5B6B66` (text-muted), aligné au centre — dans l'élément n° 9
11. Rectangle arrondi — x 285, y 205, 365×217 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
12. Texte « Fichier » — x 302, y 211, 331×34 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
13. Texte « lot_ouest_novembre.xlsx / Gabarit TSOTSA · démo » — x 302, y 245, 331×63 px ; 14 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
14. Texte « Correspondance des colonnes » — x 302, y 308, 331×34 px ; 16 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 11
15. Texte « Food → aliment · Protein (g) → protéines / Fe (mg) → fer · Ca (mg) → calcium » — x 302, y 342, 336×68 px ; 13 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 11
16. Tableau — x 667, y 205, 752×258 px ; colonnes : « Aliment » 171 px, « Nutriment » 137 px, « Valeur » 86 px, « Unité » 74 px, « Contrôle » 285 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 43 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 14 px, marge gauche 7 px :
      - ligne 1 : Arachide | Protéines | 25,8 | g | **✓ valide** (`#0F7B5F` (primary (vert)))
      - ligne 2 : Arachide | Fer | 4,6 | mg | **✓ valide** (`#0F7B5F` (primary (vert)))
      - ligne 3 : Soja | Lipides | 199 | g | **✕ hors limites (max 100 g)** (`#C93C3C` (danger)) — fond `#FDECEC` (danger-50)
      - ligne 4 : Niébé | Calcium | 110 | mg | **✓ valide** (`#0F7B5F` (primary (vert)))
      - ligne 5 : Moringa | Vitamine A | — | — | **⚠ unité manquante** (`#B7791F` (warning)) — fond `#FFF4D6` (warning-50)
17. Pastille « Lignes valides : 3 » — x 285, y 450, 182×36 px ; fond `#E7F4EE` (primary-50) ; texte 16 px gras `#0F7B5F` (primary (vert)) centré ; rayon 18 px (forme de pilule)
18. Pastille « Erreurs : 1 » — x 479, y 450, 148×36 px ; fond `#FDECEC` (danger-50) ; texte 16 px gras `#C93C3C` (danger) centré ; rayon 18 px (forme de pilule)
19. Pastille « Avertissements : 1 » — x 638, y 450, 194×36 px ; fond `#FFF4D6` (warning-50) ; texte 16 px gras `#B7791F` (warning) centré ; rayon 18 px (forme de pilule)
20. Texte « Les lignes en erreur ne sont jamais enregistrées. Le lot importé passe « à valider » : une autre personne le relit avant publication. » — x 285, y 502, 1129×46 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche
21. Bouton « Corriger le fichier » — x 285, y 576, 296×55 px ; fond `#FFFFFF` (white) ; texte 17 px gras `#334155` (admin (ardoise)) centré ; rayon 11 px ; bordure 1 px `#334155` (admin (ardoise)) → ouvre **Base aliments ORKG** (`a_import`)
22. Bouton « Importer les lignes valides » — x 599, y 576, 353×55 px ; fond `#334155` (admin (ardoise)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Base aliments ORKG** (`a_import`)

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Corriger le fichier » → ouvre **Base aliments ORKG** (`a_import`)
- « Importer les lignes valides » → ouvre **Base aliments ORKG** (`a_import`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W16 · Produits de référence (`a_products`)

Référence : `web/a_products.png`

```text
Recrée À L'IDENTIQUE l'écran « Produits de référence » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_products.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/produits-reference`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Produits de référence » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Bouton « + Ajouter un produit » — x 1095, y 83, 325×51 px ; fond `#334155` (admin (ardoise)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px
3. Tableau — x 285, y 154, 1134×292 px ; colonnes : « Produit » 182 px, « Base » 103 px, « Nutriments essentiels » 296 px, « Source » 314 px, « Statut » 239 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 63 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 17 px, marge gauche 7 px :
      - ligne 1 : **F-75** | 100 ml | à définir | OMS, malnutrition sévère (1999) | **À valider · hôpital** (`#B7791F` (warning))
      - ligne 2 : **F-100** | 100 ml | à définir | OMS, malnutrition sévère (1999) | **À valider · hôpital** (`#B7791F` (warning))
      - ligne 3 : **Plumpy'Nut** | 100 g | protéines, lipides, fer | Spécification RUTF OMS/UNICEF | **À valider** (`#B7791F` (warning))
      - ligne 4 : **Plumpy'Sup** | 100 g | à définir | Fiche du fabricant | **À saisir** (`#5B6B66` (text-muted))
4. Rectangle arrondi — x 285, y 467, 1134×108 px ; fond `#EEF1F5` (admin-50) ; rayon 7 px
5. Texte « Chaque valeur garde sa source et sa date. Une modification est tracée dans le journal d'audit. Les nutriments essentiels par défaut sont fixés par l'équipe scientifique (décision D2). » — x 308, y 467, 1083×108 px ; 17 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 4
6. Texte « Voir côté utilisateur › » — x 285, y 593, 342×40 px ; 17 px gras (700), couleur `#0F7B5F` (primary (vert)), aligné à gauche → ouvre **Produit + équivalents** (`u_product`) (zone tactile = l'élément entier)

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Voir côté utilisateur » → ouvre **Produit + équivalents** (`u_product`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W17 · Prix par région (`a_prices`)

Référence : `web/a_prices.png`

```text
Recrée À L'IDENTIQUE l'écran « Prix par région » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_prices.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/prix`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Prix par région » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Bouton « + Ajouter un relevé » — x 1095, y 83, 325×51 px ; fond `#334155` (admin (ardoise)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px
3. Tableau — x 285, y 154, 1134×369 px ; colonnes : « Région » 194 px, « Produit ou aliment » 274 px, « Prix (FCFA) » 160 px, « Unité » 137 px, « Date du relevé » 182 px, « Source » 188 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 55 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 17 px, marge gauche 7 px :
      - ligne 1 : Ouest | **Plumpy'Nut** | — | — | — | **à saisir** (`#C93C3C` (danger))
      - ligne 2 : Ouest | **Arachide** | — | — | — | **à saisir** (`#C93C3C` (danger))
      - ligne 3 : Ouest | **Soja** | — | — | — | **à saisir** (`#C93C3C` (danger))
      - ligne 4 : Centre | **Plumpy'Nut** | — | — | — | **à saisir** (`#C93C3C` (danger))
      - ligne 5 : Centre | **Arachide** | — | — | — | **à saisir** (`#C93C3C` (danger))
      - ligne 6 : Extrême-Nord | **Niébé** | — | — | — | **à saisir** (`#C93C3C` (danger))
4. Texte « Sans relevé, l'application affiche « prix non renseigné ». Chaque prix a une date et une source (relevé de marché, partenaire). » — x 285, y 542, 1129×57 px ; 16 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W18 · Optimisation (`a_optim`)

Référence : `web/a_optim.png`

```text
Recrée À L'IDENTIQUE l'écran « Optimisation » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_optim.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/optimisation`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Optimisation des rations · préparation » — x 285, y 80, 741×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Pastille « Moteur : phase 2 (non activé) » — x 1123, y 88, 296×36 px ; fond `#FFF4D6` (warning-50) ; texte 14 px gras `#B7791F` (warning) centré ; rayon 18 px (forme de pilule)
3. Rectangle arrondi — x 285, y 143, 222×41 px ; fond `#334155` (admin (ardoise)) ; bordure 1 px `#334155` (admin (ardoise)) ; rayon 6 px
4. Texte « Cibles nutritionnelles » — x 285, y 143, 222×41 px ; 16 px gras (700), couleur `#FFFFFF` (white), aligné au centre — dans l'élément n° 3
5. Rectangle arrondi — x 519, y 143, 222×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
6. Texte « Limites par aliment » — x 519, y 143, 222×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 5
7. Rectangle arrondi — x 752, y 143, 222×41 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 6 px
8. Texte « Paramètres » — x 752, y 143, 222×41 px ; 16 px normal (400), couleur `#17302A` (text), aligné au centre — dans l'élément n° 7
9. Tableau — x 285, y 205, 821×246 px ; colonnes : « Population » 171 px, « Phase » 131 px, « Nutriment » 114 px, « Min » 86 px, « Max » 86 px, « Unité » 108 px, « Source » 125 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 51 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 14 px, marge gauche 7 px :
      - ligne 1 : 6–59 mois, MAS | Réhabilitation | Énergie | à saisir | à saisir | kcal/kg/j | Protocole
      - ligne 2 : 6–59 mois, MAS | Réhabilitation | Protéines | à saisir | à saisir | g/kg/j | Protocole
      - ligne 3 : 6–59 mois, MAS | Réhabilitation | Fer | à saisir | à saisir | mg/j | Protocole
      - ligne 4 : 6–59 mois, MAM | Supplément | Énergie | à saisir | à saisir | kcal/j | Protocole
10. Rectangle arrondi — x 1129, y 205, 291×445 px ; fond `#EEF1F5` (admin-50) ; rayon 9 px
11. Texte « Ce que le moteur calculera » — x 1146, y 213, 257×57 px ; 17 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 10
12. Texte « La combinaison d'aliments locaux la moins chère qui atteint les cibles Les quantités en grammes par repas Avec les seuls aliments disponibles dans la région Toujours validée par un soignant » — x 1146, y 274, 257×296 px ; 14 px normal (400), couleur `#17302A` (text), aligné à gauche ; liste à puces — dans l'élément n° 10
13. Texte « Les cibles viennent du protocole national, validé par la référente médicale. Aucune valeur par défaut. » — x 285, y 462, 821×46 px ; 14 px normal (400) italique, couleur `#5B6B66` (text-muted), aligné à gauche
14. Bouton « Tester une formulation » — x 285, y 530, 342×51 px ; fond `#C9D1CE` (toggle-off) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W19 · Modules (`a_modules`)

Référence : `web/a_modules.png`

```text
Recrée À L'IDENTIQUE l'écran « Modules » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_modules.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/modules`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Modules » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Rectangle arrondi — x 285, y 154, 1134×103 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
3. Texte « Nutrition infantile » — x 388, y 163, 570×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 2
4. Icône FontAwesome 5 solid `apple-alt` (react-icons : `FaAppleAlt`) — x 314, y 182, 46 px, couleur `#0F7B5F` (primary (vert)) — dans l'élément n° 2
5. Rectangle arrondi — x 1277, y 185, 103×43 px ; fond `#0F7B5F` (primary (vert)) ; rayon 22 px — dans l'élément n° 2
6. Cercle / ellipse — x 1339, y 188, 36×36 px ; fond `#FFFFFF` (white) — dans l'élément n° 5
7. Texte « Actif · visible par tous » — x 388, y 206, 570×36 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 2
8. Rectangle arrondi — x 285, y 274, 1134×103 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
9. Texte « HTA » — x 388, y 283, 570×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 8
10. Icône FontAwesome 5 solid `heartbeat` (react-icons : `FaHeartbeat`) — x 314, y 302, 46 px, couleur `#8A9893` (text-subtle) — dans l'élément n° 8
11. Rectangle arrondi — x 1277, y 304, 103×43 px ; fond `#C9D1CE` (toggle-off) ; rayon 22 px — dans l'élément n° 8
12. Cercle / ellipse — x 1282, y 308, 36×36 px ; fond `#FFFFFF` (white) — dans l'élément n° 11
13. Texte « Inactif · affiché « bientôt » » — x 388, y 326, 570×36 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 8
14. Rectangle arrondi — x 285, y 393, 1134×103 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
15. Texte « Diabète » — x 388, y 402, 570×46 px ; 22 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 14
16. Icône FontAwesome 5 solid `tint` (react-icons : `FaTint`) — x 314, y 422, 46 px, couleur `#8A9893` (text-subtle) — dans l'élément n° 14
17. Rectangle arrondi — x 1277, y 424, 103×43 px ; fond `#C9D1CE` (toggle-off) ; rayon 22 px — dans l'élément n° 14
18. Cercle / ellipse — x 1282, y 428, 36×36 px ; fond `#FFFFFF` (white) — dans l'élément n° 17
19. Texte « Inactif · affiché « bientôt » » — x 388, y 446, 570×36 px ; 16 px normal (400), couleur `#5B6B66` (text-muted), aligné à gauche — dans l'élément n° 14
20. Bouton « Voir l'effet côté utilisateur » — x 285, y 530, 388×57 px ; fond `#0F7B5F` (primary (vert)) ; texte 17 px gras `#FFFFFF` (white) centré ; rayon 11 px → ouvre **Modules** (`u_modules`)

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)
- « Voir l'effet côté utilisateur » → ouvre **Modules** (`u_modules`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```

### W20 · Notifications (`a_notif`)

Référence : `web/a_notif.png`

```text
Recrée À L'IDENTIQUE l'écran « Notifications » de l'application web React (Vite + TypeScript + Tailwind) TSOTSA Kids, sans aucune réinterprétation ni ajout créatif.
Image de référence jointe : `web/a_notif.png`. Le résultat doit s'y superposer exactement.
Utilise uniquement les jetons, polices et composants du prompt de fondation (couleurs, Carlito, icônes Font Awesome 5, composants partagés).

Cadre : fenêtre de 1440 px de large, hauteur de référence 673 px (sous la barre du navigateur). Adresse de la page : `admin.tsotsakids.org/notifications`.
En-tête (composant `AppHeader`) : y 0, 1440 × 63 px, fond `#334155` (admin (ardoise)) ; à gauche (x 29) le logo TSOTSA Kids variante sur fond foncé, hauteur 34 px, suivi de « ·  Administration » 22 px gras blanc ; à droite « Équipe TSOTSA Kids » 17 px blanc aligné à droite (marge droite 21 px).
Menu latéral (composant `Sidebar`) : x 0, y 63, 262 × 610 px, fond `#F6F8F7` (sidebar) ; éléments espacés de 57 px à partir de y 82 : « Vue d'ensemble » (tachometer-alt) ; « Vérifications » (user-check) ; « Comptes » (users) ; « Base aliments » (database) ; « Produits de référence » (flask) ; « Prix par région » (money-bill-wave) ; « Optimisation » (calculator) ; « Modules » (toggle-on) ; « Notifications » (bell) ; chaque élément 239 × 50 px (x 11), icône 23 px à x 29, libellé 17 px à x 65 ; élément actif : fond `#EEF1F5` (admin-50) rayon 7 px, icône et libellé `#334155` (admin (ardoise)) gras. Zone de contenu : à partir de x 285.

Éléments, de haut en bas (coordonnées en px depuis le coin haut-gauche de l'écran ; l'en-tête occupe y 0 à 63) :
1. Texte « Notifications · réglages de la plateforme » — x 285, y 80, 684×51 px ; 29 px gras (700), couleur `#17302A` (text), aligné à gauche
2. Texte « Notifications activées » — x 1003, y 86, 319×46 px ; 17 px gras (700), couleur `#17302A` (text), aligné à droite
3. Interrupteur ACTIVÉ — x 1345, y 92, 59×32 px ; piste `#0F7B5F` (primary (vert)) rayon 16 px ; bouton rond blanc 25 px, à droite
4. Tableau — x 285, y 148, 1049×195 px ; colonnes : « Canal » 251 px, « Service » 342 px, « État » 182 px, « Envoyées (7 j) » 160 px, « Échecs » 114 px ; en-tête hauteur 41 px fond `#334155` (admin (ardoise)) texte blanc 14 px gras ; lignes hauteur 51 px, fond alterné `#F7F9F8` (surface-2) / `#FFFFFF` (white), texte 16 px, marge gauche 7 px :
      - ligne 1 : **Téléphone (push)** | Firebase Cloud Messaging | **À configurer** (`#B7791F` (warning)) | — | —
      - ligne 2 : **SMS** | Agrégateur SMS local (à choisir) | **À configurer** (`#B7791F` (warning)) | — | —
      - ligne 3 : **E-mail** | Service d'envoi d'e-mails | **À configurer** (`#B7791F` (warning)) | — | —
5. Rectangle arrondi — x 285, y 359, 638×291 px ; fond `#FFFFFF` (white) ; bordure 1 px `#D5DEDA` (border) ; rayon 9 px
6. Texte « Modèles de messages (FR / EN) » — x 308, y 366, 570×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
7. Texte « « C'est l'heure du repas de {prénom} » » — x 308, y 416, 524×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
8. Texte « Modifier » — x 810, y 416, 97×46 px ; 14 px gras (700), couleur `#334155` (admin (ardoise)), aligné à droite — dans l'élément n° 5
9. Texte « « Prise de {heure} non confirmée » » — x 308, y 470, 524×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
10. Texte « Modifier » — x 810, y 470, 97×46 px ; 14 px gras (700), couleur `#334155` (admin (ardoise)), aligné à droite — dans l'élément n° 5
11. Texte « « {prénom} a reçu {produit} » » — x 308, y 523, 524×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
12. Texte « Modifier » — x 810, y 523, 97×46 px ; 14 px gras (700), couleur `#334155` (admin (ardoise)), aligné à droite — dans l'élément n° 5
13. Texte « « Nouvelle évaluation de {prénom} » » — x 308, y 577, 524×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 5
14. Texte « Modifier » — x 810, y 577, 97×46 px ; 14 px gras (700), couleur `#334155` (admin (ardoise)), aligné à droite — dans l'élément n° 5
15. Rectangle arrondi — x 946, y 359, 473×291 px ; fond `#EEF1F5` (admin-50) ; rayon 9 px
16. Texte « Règles par défaut » — x 969, y 366, 433×40 px ; 21 px gras (700), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
17. Texte « Relance après » — x 969, y 416, 262×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
18. Texte « 30 min » — x 1220, y 416, 182×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 15
19. Texte « Heures calmes » — x 969, y 470, 262×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
20. Texte « 21:00 – 06:00 » — x 1220, y 470, 182×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 15
21. Texte « Résumé soignant » — x 969, y 523, 262×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
22. Texte « 20:00 » — x 1220, y 523, 182×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 15
23. Texte « Rappel local (hors ligne) » — x 969, y 577, 262×46 px ; 16 px normal (400), couleur `#17302A` (text), aligné à gauche — dans l'élément n° 15
24. Texte « activé » — x 1220, y 577, 182×46 px ; 16 px gras (700), couleur `#17302A` (text), aligné à droite — dans l'élément n° 15

Interactions :
- Menu « Vue d'ensemble » → ouvre **Vue d'ensemble** (`a_dashboard`)
- Menu « Vérifications » → ouvre **Vérifications** (`a_verify`)
- Menu « Comptes » → ouvre **Comptes** (`a_accounts`)
- Menu « Base aliments » → ouvre **Base aliments ORKG** (`a_import`)
- Menu « Produits de référence » → ouvre **Produits de référence** (`a_products`)
- Menu « Prix par région » → ouvre **Prix par région** (`a_prices`)
- Menu « Optimisation » → ouvre **Optimisation** (`a_optim`)
- Menu « Modules » → ouvre **Modules** (`a_modules`)
- Menu « Notifications » → ouvre **Notifications** (`a_notif`)

Animations : celles du prompt de fondation uniquement (retour visuel au toucher 100 ms, transition d'écran native 250 ms, interrupteurs 150 ms). Rien d'autre.
Responsive : règles du prompt de fondation (menu latéral fixe 262 px, zone de contenu fluide, tableaux avec défilement horizontal sous 1280 px).
Données affichées : celles de l'image de référence servent uniquement à vérifier la mise en page. Dans l'application, elles viennent de l'API ; aucune donnée codée en dur hors des tests.
Interdit : changer une couleur, une taille, un espacement, un ordre, un texte, une icône, ou ajouter un élément.
```


---

## 7. Variante Figma (facultative)

Pour retoucher le design avant de coder, ou pour le partager avec un designer.

```text
Crée un fichier Figma « TSOTSA Kids – Interfaces » à partir des images de référence jointes.
1. Une page « Mobile » avec un cadre 390 × 746 px par image du dossier references/mobile, nommé comme
   l'image ; une page « Web » avec un cadre 1440 × 673 px par image du dossier references/web.
2. Place chaque image en calque verrouillé à 50 % d'opacité, puis recrée l'écran par-dessus en
   calques vectoriels, exactement aligné.
3. Crée les styles : couleurs (section 2.1), textes Carlito (section 2.2), et les composants
   Button, Chip, Card, ListItem, Field, Toggle, Notice, AppBar, BottomNav, AppHeader, Sidebar,
   KpiCard, DataTable, BrandLogo (section 2.6), avec auto-layout.
4. Relie les écrans en mode prototype selon les interactions de chaque prompt d'écran.
Aucune modification créative : mêmes couleurs, tailles, espacements et textes que les images.
```

---

## 8. Vérifier le pixel près

- **Web :** affiche la page à 1440 px de large. Pose l'image de référence en calque semi-transparent par-dessus, avec une extension de superposition (par exemple PerfectPixel) ou un `<img>` en `position: absolute; opacity: .5`. Corrige jusqu'à ce que les bords coïncident.
- **Mobile :** lance l'application sur un émulateur de 390 px de large (ou dans Expo Web à 390 px), puis fais une capture. Compare-la avec l'image de référence : `magick compare -metric AE capture.png reference.png diff.png` (ImageMagick). Les zones rouges de `diff.png` montrent les écarts.
- **Tolérance acceptable :** ±2 px sur les positions. Les couleurs doivent être identiques.

**Liste de contrôle, pour chaque écran :**
- [ ] couleurs exactes (pipette sur l'image de référence) ;
- [ ] police Carlito, bonnes tailles et bonnes graisses ;
- [ ] positions et tailles à ±2 px ;
- [ ] mêmes icônes Font Awesome 5 ;
- [ ] toutes les interactions de la liste fonctionnent ;
- [ ] aucune donnée codée en dur hors des tests ;
- [ ] défilement correct sur 360 px et 430 px (mobile), ou sur 1280 px (web).

---

## 9. États non dessinés dans la maquette (règles à appliquer sans inventer)

| État | Règle |
|---|---|
| **Chargement** | Indicateur rond de 24 px dans la couleur de l'espace, centré dans la zone qui charge. Pas d'écran squelette. |
| **Erreur réseau** | Encart `Notice` en couleurs danger (`#FDECEC` / `#C93C3C`) en haut de la zone, avec un bouton contour « Réessayer ». |
| **Liste vide** | Modèle de l'écran « Aucun résultat » : icône 57 px `#BFE3D3`, texte centré 17 px `#5B6B66`, bouton d'action. |
| **Hors ligne** | Barre d'état « Hors ligne » et modèle de l'écran « Mode hors ligne ». |

---

## 10. Rappel sur les données (base aliments)

Les API d'ORKG ne sont pas assez fiables. **La base aliments est constituée par l'équipe**, à la main, à partir des comparaisons ORKG (écran d'administration « Base aliments »). Le principe :
1. Exporter chaque comparaison ORKG en CSV, ou recopier ses valeurs.
2. Remplir le gabarit TSOTSA : une ligne par aliment et par nutriment, avec la valeur, l'unité, la base de 100 g, l'identifiant ORKG, la référence de l'article et la région.
3. Importer le fichier. L'application lance alors des contrôles automatiques.
4. Faire faire une seconde relecture par Fidel ou l'équipe scientifique avant publication.

Les écrans utilisateur lisent uniquement cette base validée.
