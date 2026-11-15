# Architecture Cible et Référentiel Technique – TSOTSA for KIDS

**Date** : 15 novembre 2026  
**Document de référence** : Architecture & flux de données de production  

---

## 1. Schéma d'Architecture Global

```
+---------------------------------------------------------------------------------------------------+
|                                       CANAUX UTILISATEURS                                        |
|                                                                                                   |
|     [ Application Mobile Android ]                                  [ Application Web SPA ]       |
|    Expo SDK 52 / React Native 0.76                                 React 18 / Vite / Tailwind     |
|   (Parents, Tuteurs, Agents de terrain)                          (Médecins, Superviseurs, Lead)   |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  | HTTPS / TLS 1.3 (port 443)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 INFRASTRUCTURE VPS OVHCLOUD (51.89.148.92)                        |
|                                                                                                   |
|   [ Serveur Nginx Reverse Proxy Hôte ]                                                            |
|     - Terminaison TLS avec certificat Let's Encrypt (tsotsa-for-kids.com & www)                   |
|     - Routage /api/       ------>  Conteneur Backend FastAPI (127.0.0.1:8000)                     |
|     - Routage /db-admin/  ------>  Conteneur Adminer DB Admin (127.0.0.1:8080)                    |
|     - Routage /           ------>  Conteneur Web SPA (127.0.0.1:3000)                             |
|                                                                                                   |
|   +---------------------------------------------------------------------------------------------+ |
|   |                       RÉSEAU DOCKER PRIVÉ (tsotsa-kids_default)                             | |
|   |                                                                                             | |
|   |  +-------------------------+       +-------------------------+    +-----------------------+ | |
|   |  |     tsotsa-api-prod     |       |    tsotsa-mysql-prod    |    |  tsotsa-db-admin-prod | | |
|   |  |    FastAPI / Python     | <---> |   MySQL 8.0 Community   | <--|     Adminer 6.3.0     | | |
|   |  |   Port 8000 (interne)   |       |   Port 3306 (interne)   |    |  Port 8080 (interne)  | | |
|   |  +-------------------------+       +-------------------------+    +-----------------------+ | |
|   |                                                 |                                           | |
|   +-------------------------------------------------|-------------------------------------------+ |
|                                                     v                                             |
|                                  [ Volume Disque Persistant ]                                     |
|                                  /opt/tsotsa-kids/data/mysql                                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Découpage Modulaire du Backend API (`apps/api`)

Le backend est un monolithe modulaire strict :

1. **`identity`** :
   - Gestion des comptes parents, soignants et administrateurs.
   - Hachage de mot de passe Bcrypt (12 rounds) avec sel cryptographique unique.
   - Délivrance de tokens d'accès JWT (durée de vie 15 min) et tokens de rafraîchissement (30 jours) révocables.
   - Traçabilité des consentements RGPD / santé horodatés.

2. **`persons`** :
   - Dossier des personnes suivies (enfants de 6 à 59 mois, femmes enceintes/allaitantes).
   - Pseudonymisation systématique dans les interfaces (ex: `#E-024`).
   - Mesures anthropométriques : Poids, Taille, Périmètre Brachial (PB / MUAC), œdèmes bilatéraux.

3. **`nutrition`** :
   - Référentiel des aliments locaux du Cameroun et d'Afrique centrale.
   - Produits thérapeutiques prêts à l'emploi (RUTF / ATPE : Plumpy'Nut) et laits thérapeutiques (F-75, F-100).
   - Moteur d'équivalence nutritionnelle basé sur l'apport calorique, protéique et lipidique.
   - Évaluation Z-score selon les normes de croissance OMS (Poids-pour-Âge, Taille-pour-Âge, Poids-pour-Taille).

4. **`notifications`** :
   - Rappels d'observance des prises alimentaires et alertes de suivi clinique.

---

## 3. Politiques de Sécurité et Protection des Données

- **Port MySQL 3306 fermé au monde extérieur** : Accessible uniquement par les conteneurs du réseau Docker hôte.
- **Principe du Moindre Privilège** : Séparation des comptes MySQL applicatif (`tsotsa_app`), de migration (`tsotsa_migrator`) et de reporting (`tsotsa_readonly`).
- **TLS 1.3 obligatoire** : Toutes les requêtes HTTP sont redirigées automatiquement vers HTTPS.
