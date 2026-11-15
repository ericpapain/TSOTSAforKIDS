# Matrice des Rôles et Droits (Permissions) – TSOTSA for KIDS

**Date de création** : 15 novembre 2026  
**Document de référence contractuel** : Gestion des accès, permissions et circuits de validation  

---

## 1. Définition des Rôles

1. **ADMIN (Administrateur de la plateforme)** :
   - Créé exclusivement par la commande CLI sécurisée (`python -m tsotsa_api.cli create-admin`).
   - Gère les comptes : agents de terrain, soignants, super soignants, établissements de santé.
   - Modifie, suspend ou supprime logiquement les comptes ; attribue et retire des droits.
   - Valide les nouveaux soignants et agents de terrain.
   - **Règle stricte de confidentialité** : N'a **JAMAIS** accès aux dossiers médicaux ni aux données de santé des patients.

2. **SUPER SOIGNANT (« Super Doc »)** :
   - Créé **UNIQUEMENT** par l'administrateur (aucun super soignant codé en dur).
   - Accès clinique global : voit tous les patients de l'organisation.
   - Associe les patients aux soignants référents.
   - Valide les patients inscrits seuls par les familles sur mobile.
   - Valide les nouveaux soignants et agents de terrain (`staff.validate`).
   - Peut consulter l'interface de n'importe quel soignant en lecture seule (`caregivers.view_as`).
   - Décide des droits délégués aux soignants (`permissions.manage` restreint aux soignants).

3. **CO-SUPER SOIGNANT** :
   - Ce n'est pas un rôle distinct en base : c'est un **Soignant** doté de droits délégués par un Super Soignant ou l'Admin (ex: `patients.assign`, `staff.validate`, `patients.read_all`).

4. **SOIGNANT (Médecin, Infirmier, Nutritionniste)** :
   - Voit uniquement les patients qui lui sont associés en cours ET ceux qu'il a lui-même créés.
   - Suit leurs dossiers : évaluations anthropométriques, courbes OMS, plans de prises, alertes cliniques.

5. **AGENT DE TERRAIN (« Compte Utilisateur Web »)** :
   - Inscrit les familles lors des campagnes de dépistage ou visites communautaires.
   - Crée les comptes parents et enregistre les enfants (membres de la famille).
   - Les enfants inscrits par un agent de terrain sont **validés immédiatement** (l'agent a vu l'enfant en face-à-face).
   - Voit les personnes qu'il a lui-même inscrites et leur statut.
   - **Interdictions** : Ne voit PAS la page d'association patient ↔ soignant, ni les dossiers médicaux, ni les évaluations cliniques.

6. **PARENT (Compte Famille)** :
   - Disponible sur **Mobile** et désormais sur le **Web**.
   - Gère les membres de sa famille, choisit les produits thérapeutiques, consulte les équivalents locaux camerounais, confirme les prises journalières, consulte l'historique et gère ses notifications.

---

## 2. Matrice des Droits par Défaut

- **✓** = Droit actif par défaut pour le rôle.  
- **D** = Droit inactif par défaut, attribuable uniquement par **délégation expresse**.  
- *(vide)* = Droit formellement interdit pour ce rôle.  

| Code du Droit | Libellé de l'action | Admin | Super soignant | Soignant | Agent terrain | Parent |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `accounts.create` | Créer un compte agent de terrain / soignant / super soignant | **✓** | | | | |
| `accounts.update` | Modifier un compte professionnel | **✓** | | | | |
| `accounts.delete` | Suspendre ou supprimer logiquement un compte | **✓** | | | | |
| `staff.validate` | Valider un nouveau soignant ou agent de terrain | **✓** | **✓** | **D** | | |
| `facilities.manage` | Créer, modifier, supprimer un établissement de santé | **✓** | | | | |
| `permissions.manage` | Donner ou retirer des droits | **✓** | **✓** *(soignants)* | **D** | | |
| `patients.register` | Inscrire une famille / un patient | | **✓** | **✓** | **✓** | **✓** *(sa famille)* |
| `patients.validate` | Valider un patient en attente | | **✓** | **D** | **✓** | |
| `patients.assign` | Associer un patient à un soignant | | **✓** | **D** | | |
| `patients.read_all` | Voir tous les patients de l'organisation | | **✓** | **D** | | |
| `caregivers.view_as` | Voir l'interface d'un autre soignant (lecture seule) | | **✓** | **D** | | |
| `records.follow` | Suivre le dossier médical des patients | | **✓** | **✓** *(ses patients)* | | |

---

## 3. Règles d'Attribution et Contrôle des Droits

1. **Vérification côté serveur obligatoire** : Chaque endpoint d'API vérifie la permission requise via la dépendance de sécurité FastAPI (`require_permission(...)`). Masquer un bouton côté Web ou Mobile ne constitue jamais une barrière suffisante.
2. **Principe de délégation** : Personne ne peut accorder un droit qu'il ne détient pas lui-même.
3. **Périmètre du Super Soignant** : Le super soignant ne peut déléguer des droits qu'à des soignants (`caregiver`), jamais à des agents de terrain ni à des administrateurs.
4. **Périmètre de l'Admin** : L'administrateur peut accorder ou révoquer tout droit, à l'exception de la suppression du dernier compte administrateur actif.
5. **Traçabilité immuable** : Chaque octroi ou retrait de droit est consigné de façon inaltérable dans `permission_grants` et `audit_log` (qui, à qui, quand, pourquoi, date de fin en cas de révocation). Aucune suppression physique de droit n'est autorisée.

