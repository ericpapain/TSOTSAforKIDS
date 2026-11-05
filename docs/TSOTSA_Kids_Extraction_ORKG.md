# TSOTSA Kids : extraire et organiser les données ORKG

Version 1.0 · 5 novembre 2026 · d'après les comparaisons ORKG de l'équipe (exemple : [R1903384](https://orkg.org/comparisons/R1903384))

---

## 1. Comment les données sont rangées dans ORKG aujourd'hui

Dans ORKG, une **comparaison** est un tableau. **Chaque colonne est une « contribution »**, c'est-à-dire un résultat tiré d'un article. **Chaque ligne est une propriété.**

Les captures montrent **deux types de comparaisons** :

### Type A : composition nutritionnelle des plats (une comparaison par nutriment)

Exemple : *« Comparison of Zinc Content in Several Foods from the Centre Region of Cameroon »* (R1903384, 32 contributions, région Centre).

| Ligne (propriété) | Contribution `Condrès01_Zinc` | Contribution `Coucouma01_Zinc` |
|---|---|---|
| Titre de l'article | Composition of dishes consumed in Cameroon | idem |
| food component name | Zinc | Zinc |
| value | 2.29 mg | 4.04 mg |
| ↳ numericValue | 2.29 | 4.04 |
| ↳ unit | mg | mg |

- Le **nom du plat** se trouve **uniquement dans le libellé** de la contribution (`Condrès01_Zinc` → plat « Condrès », échantillon « 01 », nutriment « Zinc »). La ligne « common name » est souvent vide.
- La **région** se trouve dans le titre de la comparaison (« Centre Region »).
- Il existe d'autres comparaisons du même type pour le phytate, le magnésium, etc. Le **phytate** est un anti-nutriment, pas un nutriment : il réduit l'absorption du fer et du zinc.

### Type B : recettes des plats (ingrédients et proportions)

Exemple : *« Nutritional Composition of Five Varieties of Pap Commonly Consumed in Maroua (Far-North, Cameroon) »*.

| Ligne (propriété) | `Gari digari01_ingredient1` | `Gari digari01_ingredient2` | `…_ingredient3` |
|---|---|---|---|
| common name | Red millet flour | Roasted peanuts paste | Water |
| food name | Gari digari | Gari digari | Gari digari |
| importance | Basic | Basic | — |
| quantity → numericValue / unit | 6.20 % | 5.16 % | 77.40 % |
| research problem | Food ingredient estimation | idem | idem |
| scientific name | Digitaria iburua | Arachis hypogea | — |

Les 7 ingrédients du Gari digari totalisent **100,0 %**. C'est un excellent contrôle automatique.

---

## 2. Comment nous allons l'organiser dans notre base

| Donnée ORKG | Table TSOTSA Kids | Règle |
|---|---|---|
| Plat (« Condrès », « Gari digari ») | `foods` avec `kind = dish` | Nom tiré du libellé de la contribution (type A) ou de « food name » (type B) |
| Ingrédient (« Red millet flour ») | `foods` avec `kind = ingredient` + `scientific_name` | Nom scientifique conservé (Digitaria iburua) |
| Nutriment (« Zinc ») | `nutrients` (via `nutrient_synonyms`) | Anti-nutriments (phytate…) classés dans la catégorie `antinutrient` |
| Valeur + unité (2.29 mg) | `food_nutrient_values` | Convertie dans l'unité de référence ; **base de calcul obligatoire** (voir section 5) |
| Échantillon (« 01 ») | `food_nutrient_values.sample_label` | Plusieurs échantillons du même plat sont conservés, puis résumés (moyenne, minimum, maximum) |
| Région (« Centre Region », « Maroua, Far-North ») | `food_regions` | Tirée du registre des comparaisons (section 3), pas devinée |
| Recette (ingrédient + %) | **nouvelles tables** `recipes` et `recipe_ingredients` | La somme des proportions doit être proche de 100 % |
| Comparaison, contribution, article | `sources` | Identifiant de la comparaison (R…), de la contribution, version, titre et DOI de l'article |

**Pourquoi les recettes sont importantes :**
- pour l'application, on peut afficher de quoi est fait un plat local ;
- pour l'optimisation future, on peut proposer des **plats** et pas seulement des aliments isolés ;
- quand la composition d'un plat manque, on peut l'estimer à partir de celle de ses ingrédients. Une telle valeur est toujours marquée « estimée ».

---

## 3. Le registre des comparaisons (le point de départ)

Un fichier versionné `data/orkg/comparaisons.csv`, tenu par l'équipe (Fidel). C'est lui qui dit quoi extraire et comment l'interpréter :

| Colonne | Exemple | Rôle |
|---|---|---|
| `comparison_id` | R1903384 | Identifiant ORKG |
| `type` | composition / recette | Choisit la règle de lecture |
| `nutriment` | Zinc | Pour le type A |
| `region` | Centre | Région des plats |
| `base` | 100 g de partie comestible, poids frais | **À confirmer pour chaque comparaison** |
| `statut` | actif / remplacé | Une comparaison remplacée par une nouvelle version passe à « remplacé » |
| `remplacee_par` | R1903392 | ORKG signale qu'une version plus récente de R1903384 existe |
| `remarque` | | |

---

## 4. L'extraction automatisée : 6 étapes

```text
Registre des comparaisons
   │
   ▼  1. RÉCUPÉRER  (API ORKG ; sinon export CSV manuel ; sinon dernier instantané)
Instantané brut daté  data/orkg/raw/<R…>/<date>.json
   │
   ▼  2. LIRE  (règle du type A ou du type B)
   ▼  3. NORMALISER  (noms de nutriments, unités, base 100 g)
   ▼  4. CONTRÔLER  (limites plausibles, somme des recettes ≈ 100 %, doublons, valeurs atypiques)
   ▼  5. COMPARER  avec la base actuelle (nouveau / modifié / inchangé / disparu)
   ▼  6. CHARGER  en lot « à valider »  ──►  relecture par une 2e personne  ──►  publication
```

1. **Récupérer.** Bibliothèque Python officielle `orkg`, fonction `contributions.compare_dataframe(comparison_id=…, like_ui=False, include_meta=True)`. Elle renvoie le tableau complet et, pour chaque contribution, les informations de l'article (titre, DOI, auteurs, année).
   - **Si l'API ne répond pas**, on utilise un export CSV fait à la main depuis ORKG et déposé dans `data/orkg_exports/`.
   - **Sinon, le dernier instantané enregistré** : aucune panne d'ORKG ne bloque l'application.
   - Chaque récupération est enregistrée telle quelle, avec la date et une empreinte. On peut toujours prouver d'où vient une valeur.
2. **Lire.**
   - **Type A :** le libellé `Condrès01_Zinc` est découpé en plat, échantillon et nutriment. Le nutriment est vérifié avec la ligne « food component name ». La valeur est lue dans « numericValue », l'unité dans « unit ».
   - **Type B :** une ligne par ingrédient (plat = « food name », ingrédient = « common name », nom scientifique, importance, proportion en %).
   - Les noms sont nettoyés (espaces, majuscules), mais **les accents sont conservés** (« Etondo salé »).
3. **Normaliser.**
   - Noms des nutriments ramenés au dictionnaire : Zinc → `zinc`, Phytate → `phytate`.
   - Unités converties dans l'unité de référence (mg, µg, g, kcal).
   - Valeur rapportée à 100 g, selon la base déclarée dans le registre.
4. **Contrôler.**
   - Valeur dans les limites plausibles du nutriment.
   - Unité présente.
   - Somme des proportions d'une recette entre 98 et 102 %.
   - Doublons (même plat, nutriment et échantillon).
   - **Valeurs atypiques**, signalées sans être bloquées : par exemple, le magnésium du Condrès (100,0 mg) est très différent de celui du Coucouma (3,19 mg). Une personne vérifie dans l'article.
5. **Comparer.** Le rapport liste ce qui est nouveau, modifié, inchangé ou disparu depuis la dernière extraction. Une valeur modifiée crée une nouvelle version : rien n'est écrasé.
6. **Charger.** Le résultat devient un **lot « à valider »**, dans le même circuit que l'import Excel. **Rien n'est publié automatiquement** : une seconde personne relit dans l'administration.

**Quand l'extraction tourne :**
- à la demande, avec un bouton « Synchroniser depuis ORKG » dans l'administration, onglet « Base aliments » ;
- automatiquement chaque semaine, par une tâche programmée.

Si rien n'a changé, aucun lot n'est créé. Si l'API échoue, une alerte apparaît dans l'administration et la base reste intacte.

---

## 5. Questions à régler avec Fidel avant l'automatisation

| # | Question | Pourquoi c'est bloquant |
|---|---|---|
| Q1 | **Sur quelle base sont exprimées les valeurs ?** Pour 100 g de partie comestible ? Poids frais, ou matière sèche ? | Sans cette information, comparer un plat à 100 g de Plumpy'Nut n'a pas de sens. Une valeur en matière sèche peut être plusieurs fois plus élevée qu'en poids frais. |
| Q2 | Que signifie « 01 » dans les libellés ? Un numéro d'échantillon, une préparation, une source ? | Pour savoir s'il faut faire une moyenne ou garder les valeurs séparément |
| Q3 | Quelle est la liste complète des comparaisons à extraire, et laquelle est la version à jour (R1903384 ou R1903392) ? | Pour remplir le registre |
| Q4 | Les plats ont-ils une recette (type B) dans tous les cas, ou seulement certains ? | Pour savoir quand une composition peut être estimée à partir des ingrédients |
| Q5 | Peut-on ajouter dans ORKG, pour chaque contribution, les propriétés « food name », « region », « basis » et « sample » ? | Le nom du plat ne serait plus caché dans le libellé, et l'extraction deviendrait beaucoup plus fiable |

**Recommandation : se mettre d'accord avec l'équipe de Fidel sur des conventions de saisie dans ORKG**, avec un modèle (« template ») ORKG commun aux comparaisons de composition. C'est ce qui rendra l'automatisation solide à long terme.
