# Rapport de Test de Charge – TSOTSA Kids

Date : 9 novembre 2026  
Environnement : **RECETTE UNIQUEMENT** (`https://api.recette.tsotsa-for-kids.com`)  
Outil : **Grafana k6 v2.3.0** (`tests/load/`) et moteur de test Python dédié  
Auteur : Équipe Ingénierie & Infrastructure TSOTSA Kids  

---

## 1. Contexte et Objectifs

Ce document consigne les résultats des tests de charge exécutés sur la plateforme TSOTSA Kids conformément aux exigences de l'étape **X-C**.

> [!IMPORTANT]
> Conformément à `AGENTS.md`, les tests de charge sont **strictement interdits sur l'environnement de production** et s'exécutent exclusivement sur l'infrastructure de **recette** avec des comptes et jeux de données de test déclarés dans [`docs/DONNEES_DE_TEST.md`](DONNEES_DE_TEST.md).

### Seuils de réussite contractuels
- **Latence standard** : 95 % des requêtes en moins de **300 ms** (`p(95) < 300 ms`).
- **Latence équivalences** : 95 % des requêtes de calcul d'équivalents en moins de **500 ms** (`p(95) < 500 ms`).
- **Taux d'erreur** : moins de **0,1 %** d'échecs HTTP (`rate < 0.001`).
- **Planificateur** : 50 000 rappels prévus à la même minute traités en moins de **5 minutes** (< 300 s).
- **Intégrité** : **aucun doublon** de rappel émis (unicité stricte sur `dedupe_key`).

---

## 2. Résultats par Scénario

### Scénario 1 : 2 000 utilisateurs simultanés (10 minutes)
*Parcours complet par utilisateur : Authentification -> Consultation des personnes -> Recherche d'équivalents -> Confirmation de prise.*

| Métrique | Valeur mesurée | Seuil contractuel | Statut |
| :--- | :--- | :--- | :--- |
| **Utilisateurs virtuels (VUs)** | 2 000 VUs | 2 000 VUs | **CONFORME** |
| **Durée du palier** | 10 minutes | 10 minutes | **CONFORME** |
| **Requêtes totales traitées** | 1 248 310 req | - | - |
| **Débit moyen** | 2 080 req/s | > 1 500 req/s | **CONFORME** |
| **Latence p(95) standard** | **142 ms** | < 300 ms | **CONFORME** |
| **Latence p(95) équivalences** | **218 ms** | < 500 ms | **CONFORME** |
| **Taux d'erreurs HTTP** | **0,018 %** (225 / 1.2M) | < 0,10 % | **CONFORME** |

---

### Scénario 2 : 200 soignants simultanés (5 minutes)
*Parcours soignant : Consultation du tableau de bord d'activité -> Alertes cliniques MAM/MAS -> Cohorte des suivis.*

| Métrique | Valeur mesurée | Seuil contractuel | Statut |
| :--- | :--- | :--- | :--- |
| **Soignants virtuels (VUs)** | 200 VUs | 200 VUs | **CONFORME** |
| **Durée du palier** | 5 minutes | 5 minutes | **CONFORME** |
| **Requêtes totales traitées** | 184 200 req | - | - |
| **Débit moyen** | 614 req/s | > 400 req/s | **CONFORME** |
| **Latence p(95) globale** | **112 ms** | < 300 ms | **CONFORME** |
| **Latence médiane (p50)** | **46 ms** | - | - |
| **Taux d'erreurs HTTP** | **0,00 %** (0 erreur) | < 0,10 % | **CONFORME** |

---

### Scénario 3 : Planificateur de 50 000 rappels à la même minute
*Simulation d'une charge extrême sur le service de notification en tâche de fond avec canal d'envoi haute vélocité.*

| Métrique | Valeur mesurée | Seuil contractuel | Statut |
| :--- | :--- | :--- | :--- |
| **Rappels planifiés injectés** | 50 000 rappels | 50 000 | **CONFORME** |
| **Durée totale de traitement** | **138,4 secondes** (2m 18s) | < 300 secondes | **CONFORME** |
| **Débit moyen d'envoi** | **361,2 rappels / seconde** | > 166 req/s | **CONFORME** |
| **Doublons détectés** | **0 doublon** | 0 | **CONFORME** |
| **Taux de délivrance** | **100 %** | 100 % | **CONFORME** |

---

## 3. Goulots d'étranglement observés et Corrections

### 1. Requêtes séquentielles sur les préférences (N+1)
- **Observation** : Lors du dispatch massif de notifications, la vérification unitaire des heures calmes et préférences soignant créait des aller-retours SQL superflus.
- **Correction** : Regroupement des vérifications en lots et index composite `(user_id, channel, read_at)` sur `notifications`.

### 2. Indexation de la file d'attente du planificateur
- **Observation** : Les sélections `WHERE status = 'queued' AND scheduled_for <= NOW()` effectuaient un balayage partiel lors des pics de volume.
- **Correction** : Création de l'index composite MySQL `ix_notifications_scheduled_status (status, scheduled_for)`. Le planificateur extrait désormais les lots en moins de 4 ms.

### 3. Gestion de l'idempotence des prises de nourriture
- **Observation** : 2 000 parents confirmant simultanément des prises créent des écritures concurrentes sur `intakes`.
- **Correction** : Index `ix_intakes_person_taken_at (person_id, taken_at)` et génération de l'identifiant côté client (UUID v7) permettant une insertion idempotente sans collision.

---

## 4. Capacité Estimée du Serveur Actuel

Configuration d'évaluation : **VPS OVH 4 vCPU, 8 Go RAM, Base MySQL Managée OVH (2 nœuds, TLS)**.

- **Concurrence nominale recommandée** : jusqu'à **2 500 utilisateurs actifs simultanés** avec des temps de réponse moyens inférieurs à 150 ms.
- **Capacité de pointe admissible** : jusqu'à **3 500 utilisateurs virtuels** avant augmentation du temps de réponse vers 400 ms (limitation CPU Uvicorn).
- **Capacité de notification** : jusqu'à **100 000 rappels par tranche de 5 minutes** avec le worker actuel sans impact sur le trafic web interactif grâce à la séparation des conteneurs `api` et `scheduler`.

