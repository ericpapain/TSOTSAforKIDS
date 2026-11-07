# Guide EAS Build – Génération d'APK et Déploiement Mobile

Ce guide détaille la procédure complète pour générer les APK de test et les bundles de production de l'application **TSOTSA Kids Mobile** à l'aide d'**Expo Application Services (EAS)**.

---

## 1. Comptes nécessaires

### A. Compte Expo (EAS)
- **Objectif** : Héberger la configuration du projet mobile, orchestrer la compilation cloud (Android/iOS) et sécuriser les clés de signature (Keystore Android).
- **Création** : Créer un compte sur [expo.dev](https://expo.dev/signup).
- **Rôle dans le projet** : Permet de compiler sans nécessiter d'environnement lourd Android Studio ou Xcode en local.

### B. Projet Firebase / Google Cloud (FCM - Firebase Cloud Messaging)
- **Objectif** : Délivrer les notifications push sur les smartphones Android via l'API officielle Google FCM v1.
- **Configuration** :
  1. Se rendre sur la [Console Firebase](https://console.firebase.google.com/).
  2. Créer un projet nommé `tsotsa-kids`.
  3. Ajouter une application Android avec le nom de package officiel : `com.tsotsaforkids.app`.
  4. Télécharger le fichier `google-services.json` et le déposer dans `apps/mobile/` (non versionné, exclu par `.gitignore`).
  5. Dans *Paramètres du projet > Comptes de service*, générer une nouvelle clé privée JSON (clé de compte de service FCM).
  6. Associer cette clé de compte de service à Expo via la commande `eas credentials` pour autoriser l'envoi de push.

### C. Compte Google Play Developer (Pour la Production)
- **Objectif** : Publication de l'application sur le Google Play Store.
- **Prérequis** : Compte développeur Google Play (25 $ US à vie).

---

## 2. Profils de build (`apps/mobile/eas.json`)

Le fichier `eas.json` définit 3 profils ciblés :

| Profil | Format de sortie | Distribution | Usage |
|---|---|---|---|
| `development` | APK de développement (`dev-client`) | Interne | Tests avec rechargement à chaud et modules natifs. |
| `preview` | **APK autonome (.apk)** | Interne / Téléchargement direct | **Tests réels sur smartphone physique sans passer par les stores.** |
| `production` | **Android App Bundle (.aab)** | Google Play Store | Publication officielle optimisée pour les utilisateurs finaux. |

---

## 3. Guide pas à pas des commandes

### Étape 1 : Installation et Authentification
```bash
# 1. Installer la CLI EAS mondialement
npm install -g eas-cli

# 2. Se connecter avec son compte Expo
eas login
```

### Étape 2 : Initialisation du projet EAS
```bash
# Se placer dans le dossier mobile
cd apps/mobile

# Lier le projet local au projet cloud Expo
eas init
```

### Étape 3 : Configuration des certificats et clés (Keystore)
```bash
eas credentials
```
*Choisir `Android > preview / production > Set up Keystore`. EAS génère et stocke de manière chiffrée votre clé de signature (SHA-1 / SHA-256).*

### Étape 4 : Génération de l'APK de test autonome
```bash
# Générer l'APK autonome de test (profil preview)
eas build --platform android --profile preview
```
*Le serveur de build Expo compile l'application. À la fin (5-8 min), un lien direct et un **QR Code** s'affichent dans le terminal. Il suffit de scanner le QR Code avec l'appareil photo du smartphone Android pour télécharger et installer l'APK immédiatement.*

### Étape 5 : Génération de l'AAB de Production
```bash
# Générer le bundle pour le Play Store
eas build --platform android --profile production
```

### Étape 6 : Soumission sur le Google Play Store
```bash
eas submit --platform android --profile production
```

