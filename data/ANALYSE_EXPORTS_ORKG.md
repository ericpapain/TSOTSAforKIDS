# Analyse des Exports ORKG – Projet TSOTSA Kids

Version 1.0 · 5 novembre 2026 · Équipe Data TSOTSA Kids  
Référence projet : [docs/TSOTSA_Kids_Extraction_ORKG.md](file:///docs/TSOTSA_Kids_Extraction_ORKG.md)

---

## 1. Périmètre et fichiers analysés

L'analyse porte sur les exports réels de l'Open Research Knowledge Graph (ORKG) issus des travaux de recherche menés par l'équipe scientifique (Dr Azanzi Jiomekong, Pr Nguefack, équipe du Dr Roger Ponka) et déposés dans `data/orkg_exports/` :

| Fichier export | Comparaison ORKG | Type | Domaine / Sujet | Nb contributions | Nb lignes |
|---|---|---|---|---|---|
| `R1903384_zinc_centre.csv` | R1903384 | Type A (Composition) | Zinc (Zn) – Région Centre | 32 | 4 |
| `R1903376_phytate_centre.csv` | R1903376 | Type A (Composition) | Phytate (Anti-nutriment) – Région Centre | 31 | 5 |
| `R1901262_magnesium_centre.csv` | R1901262 | Type A (Composition) | Magnésium (Mg) – Région Centre | 32 | 4 |
| `R1900300_copper_centre.csv` | R1900300 | Type A (Composition) | Cuivre (Cu) – Région Centre | 32 | 4 |
| `R693268_recette_gari_digari.csv` | R693268 | Type B (Recette) | Ingrédients du Gari digari – Extrême-Nord | 7 | 8 |
| `R693264_recette_boko.csv` | R693264 | Type B (Recette) | Ingrédients du Boko – Extrême-Nord | 11 | 6 |
| `R677659_paps_maroua.csv` | R677659 | Typologie | Bouillies traditionnelles – Maroua | 5 | 6 |

---

## 2. Structure et typologie des comparaisons

### Type A : Composition nutritionnelle (une comparaison par nutriment)
Dans ce modèle, chaque **colonne** représente une contribution (un plat analysé) et chaque **ligne** représente une propriété :
- **Ligne 0 (En-tête)** : Nom de la contribution ORKG (ex : `Condrès01_Zinc`, `Coucouma01_Zinc`, `Ebobolo01_Zinc`).
- **Lignes de métadonnées** : Titre de l'article (`Titre de l'article`), identifiant numérique ou DOI (`DOI`).
- **Ligne `food component name`** : Nom du nutriment analysé (`Zinc`, `Phytate`, `Magnesium`, `Copper`).
- **Ligne `value`** : Texte combinant la valeur numérique et l'unité (ex : `2.29 mg`, `14.06 mg`).
- **Ligne `numericValue`** : Valeur numérique décimale isolée (ex : `2.29`, `14.06`).
- **Ligne `unit`** : Symbole de l'unité (ex : `mg`).

### Type B : Recettes de plats (ingrédients et proportions)
Dans ce modèle, chaque **colonne** représente un ingrédient de la recette :
- **Ligne 0 (En-tête)** : Identifiant de l'ingrédient (ex : `Gari digari01_ingredient1`, `Gari digari01_ingredient2`).
- **Ligne `food name`** : Nom du plat composé (`Gari digari`, `Boko`).
- **Ligne `common name`** : Nom courant de l'ingrédient (`Red millet flour`, `Roasted peanuts paste`, `Water`, `Sugar`).
- **Ligne `scientific name`** : Nom botanique ou taxinomique latin (`Digitaria iburua`, `Arachis hypogea`).
- **Ligne `importance`** : Rôle dans la recette (`Basic` pour les ingrédients de base, non renseigné pour les ajouts).
- **Ligne `quantity`** : Mention générique (`Quantity Value`).
- **Lignes `numericValue` & `unit`** : Proportion chiffrée et unité de mesure (`6.20` et `%`).

---

## 3. Nutriments, anti-nutriments et unités rencontrés

### Nutriments et anti-nutriments
1. **Zinc (`zinc`)** : minéral essentiel. Valeurs observées entre 2.00 mg (`Sanga01`) et 7.86 mg (`Midjem01`).
2. **Magnésium (`magnesium`)** : macro-élément minéral. Valeurs entre 3.19 mg (`Coucouma01`) et 100.0 mg (`Condrès01`).
3. **Cuivre (`copper`)** : oligo-élément. Valeurs entre 0.12 mg et 1.48 mg.
4. **Phytate (`phytate`)** : **Anti-nutriment majeur**. Chélatant naturel qui inhibe fortement l'absorption intestinale du zinc et du fer. Teneurs très variables observées de 11.4 mg (`Ebobolo01`) à 1988.2 mg (`Fian Ngon01`).
5. **Calcium (`calcium`)** : comparaison R1900294 créée dans ORKG mais **incomplète** (0 colonne).

### Orthographes et anomalies de saisie observées
- `Zinc` vs `zinc`
- `Magnesium` vs `Magnésium`
- `Phytate` vs `Phyttate` (faute de frappe constatée dans l'article R684425 : `Lombo01_Phyttate` avec deux "t")
- `Digitaria iburua ` avec une espace finale superflue.

---

## 4. Base de calcul et régions

- **Régions géographiques** :
  - **Centre** : pour toutes les comparaisons de composition R1903384, R1903376, R1901262, R1900300 (plats traditionnels consommés à Yaoundé et environs).
  - **Extrême-Nord (Maroua)** : pour les recettes de bouillies R693268, R693264, R677659.
- **Base de calcul** :
  - **ABSENTE DES EXPORTS** : aucune ligne ni métadonnée dans les comparaisons ORKG n'indique formellement si les valeurs sont rapportées à :
    - 100 g de portion comestible en **poids frais** (tel que consommé) ;
    - ou 100 g de **matière sèche** (après lyophilisation ou dessiccation).
  - Cette information est capitale car un rapport en matière sèche multiplie artificiellement les concentrations par un facteur 3 à 8 par rapport au plat humide.

---

## 5. Références bibliographiques des articles

1. **Plats de la région Centre (Yaoundé)** :
   - *Titre* : « Composition of dishes consumed in Cameroon »
   - *Auteurs* : Roger Ponka, Elie Fokou, Martin Fotso, Félicité Mbiapo Tchouanguep, Rose Leke, Jacob Souopgui, Mercy Achu Bih
   - *Revue* : *International Journal of Food Science & Technology* (2005), 40(4), 369–374.
   - *DOI* : `10.1111/j.1365-2621.2005.01072.x`
   - *ORKG Paper ID* : `R684425`

2. **Bouillies de l'Extrême-Nord (Maroua)** :
   - *Titre* : « Nutritional Composition of Five Varieties of Pap Commonly Consumed in Maroua (Far-North, Cameroon) »
   - *Auteurs* : Roger Ponka, Armand Bouba, Elie Fokou, Eric Beaucher, Michel Piot, Joëlle Leonil, Frédéric Gaucheron
   - *Revue* : *Polish Journal of Food and Nutrition Sciences* (2015), 65(2), 105–112.
   - *DOI* : `10.1515/pjfns-2015-0016`
   - *ORKG Paper ID* : `R677409`

---

## 6. Liste des problèmes et anomalies constatés

| # | Catégorie | Description du problème | Impact sur l'automatisation | Solution préconisée |
|---|---|---|---|---|
| **P1** | Nom du plat caché | Le nom du plat n'a pas de colonne/ligne dédiée dans le Type A (`common name` est vide). Il est extrait par découpage textuel du libellé de contribution (`Condrès01_Zinc` → « Condrès »). | Risque d'erreur si le format du libellé varie. | Parser regex strict : `^(.+?)(?:0[1-9]|[0-9]{2})?_([A-Za-z]+)$`. |
| **P2** | Base de calcul non déclarée | Aucune mention de la base (100 g poids frais vs 100 g matière sèche). | **Bloquant médicalement** : impossibilité de calculer l'équivalence avec Plumpy'Nut ou F-75 sans ambiguïté. | Statut « À CONFIRMER » dans `comparaisons.csv` en attendant la réponse de Fidel (Q1). |
| **P3** | Coquilles typographiques ORKG | `Lombo01_Phyttate` avec deux "t" ; `sPe01_Zinc` avec un 's' minuscule. | Échec de correspondance si recherche exacte. | Dictionnaire des synonymes avec variantes tolérées (`Phyttate` → `phytate`). |
| **P4** | Comparaisons incomplètes ou orphelines | `R1900294` (Calcium) contient 0 colonne de contribution ; `R1903376` (Phytate) ne compte que 31 plats (`sPe01` absent). | Données manquantes sur des micronutriments clés. | Signalement dans le rapport d'import sans bloquer les autres nutriments. |
| **P5** | Texte dans les valeurs numériques | La ligne `quantity` des recettes contient la chaîne brute `"Quantity Value"`. | Erreur de cast en flottant si mauvaise ligne lue. | Lire impérativement `numericValue` et non `quantity`. |
| **P6** | Ingrédients composites groupés | Dans `R693268`, l'ingrédient 7 vaut `"Rice grains / boiled maize grains"` (deux aliments alternatifs fusionnés). | Impossible d'isoler le code aliment unique. | Conserver l'intitulé brut en remarque et lever un avertissement. |
| **P7** | Écart atypique (Outlier) | Dans `R1901262`, le Condrès affiche `100.0 mg` de magnésium, contre `3.19 mg` pour le Coucouma (facteur > 30). | Risque d'erreur de saisie dans l'article ou sur ORKG. | Avertissement non bloquant pour vérification humaine avec l'article papier. |
| **P8** | Versions multiples non synchronisées | `R1903384` (Zinc) est remplacé par `R1903392` ; `R1901266` (Phytate) par `R1903376`. | Risque d'extraire une version obsolète. | Traçabilité stricte dans `data/orkg/comparaisons.csv` (`statut = remplacé`). |

---

## 7. Questions pour Fidel (Questions Q1 à Q5)

Ces questions reprennent exactement les points bloquants Q1 à Q5 définis dans [`docs/TSOTSA_Kids_Extraction_ORKG.md`](file:///docs/TSOTSA_Kids_Extraction_ORKG.md) :

1. **Q1. Sur quelle base exacte sont exprimées les valeurs ?**  
   *S'agit-il de 100 g de partie comestible en poids frais (tel que consommé), ou en matière sèche (après séchage/lyophilisation) ?*  
   *Pourquoi c'est bloquant :* Sans cette confirmation formelle, comparer un plat local à 100 g de Plumpy'Nut ou de lait F-75 fausserait l'équivalence nutritionnelle du moteur de calcul.

2. **Q2. Que signifie exactement le suffixe « 01 » dans les libellés (`Condrès01`, `Coucouma01`) ?**  
   *S'agit-il d'un numéro d'échantillon de laboratoire, d'un mode de préparation spécifique, ou d'une référence de ménage ?*  
   *Pourquoi c'est important :* Si d'autres échantillons existent (`02`, `03`), nous devons savoir s'il faut calculer une moyenne arithmétique ou conserver chaque mesure indépendamment.

3. **Q3. Quelle est la liste définitive des comparaisons ORKG validées à synchroniser ?**  
   *Pouvez-vous confirmer que la version de référence pour le Zinc est bien `R1903392` (qui remplace `R1903384`) et pour le Phytate `R1903376` (qui remplace `R1901266`) ? Pouvez-vous également renseigner le tableau pour le Calcium (`R1900294`) actuellement vide ?*

4. **Q4. Les plats ont-ils tous une recette formalisée (Type B), ou seulement certains d'entre eux ?**  
   *Pourquoi c'est important :* Pour savoir si l'estimation de composition par la somme pondérée des ingrédients peut être généralisée à l'ensemble du répertoire culinaire ou réservée aux bouillies de l'Extrême-Nord.

5. **Q5. Est-il envisageable d'ajouter directement dans ORKG les propriétés « food name », « region », « basis » et « sample » pour chaque contribution ?**  
   *Pourquoi c'est recommandé :* Cela éviterait de devoir « deviner » le nom du plat enfoui dans le libellé technique `Condrès01_Zinc`, rendant le pipeline d'ingestion 100 % robuste et pérenne.
