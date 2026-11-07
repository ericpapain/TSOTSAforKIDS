# Guide de test manuel Google Sign-In & Development Build EAS

Ce guide décrit la configuration et l'exécution du test manuel d'authentification Google Sign-In avec `@react-native-google-signin/google-signin` sur l'application mobile native TSOTSA Kids (`com.tsotsaforkids.app`).

---

## 1. Création des identifiants dans la console Google Cloud

Dans votre projet Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com)) :

1. **Écran de consentement OAuth** :
   - Type d'utilisateur : Externe (ou Interne si Google Workspace).
   - Nom de l'application : `TSOTSA Kids`.
   - Adresses de contact développeur et support.
   - Champs d'application (Scopes) requis : `email`, `profile`, `openid`.

2. **Identifiants OAuth 2.0 à créer (3 clients)** :
   - **Client Web (Web Client ID)** :
     - Type : *Application Web*.
     - Nom : `TSOTSA Kids Backend & Mobile Auth`.
     - Origines JavaScript autorisées : `https://api.tsotsa-for-kids.com`.
     - Ce `client_id` (se terminant par `.apps.googleusercontent.com`) est renseigné dans `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` côté mobile et dans la variable serveur `GOOGLE_CLIENT_ID` pour valider l'authenticité de l'`id_token`.
   - **Client Android** :
     - Type : *Android*.
     - Nom du package : `com.tsotsaforkids.app`.
     - Empreinte de certificat SHA-1 :
       - Récupérer avec EAS CLI : `eas credentials` (sélectionner Android -> Keystore SHA-1).
       - En local debug : extraire le SHA-1 de votre keystore de développement.
   - **Client iOS** :
     - Type : *iOS*.
     - Identifiant de bundle (Bundle ID) : `com.tsotsaforkids.app`.
     - Schéma d'URL inversé : à reporter dans la configuration iOS si nécessaire.

---

## 2. Génération et installation de la Development Build EAS

La bibliothèque `@react-native-google-signin/google-signin` contenant du code natif Java/Kotlin et Objective-C, elle ne peut pas fonctionner dans l'application générique Expo Go. Une build de développement (development build) est nécessaire.

### Étape A : Installation d'EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Étape B : Configuration du projet EAS
Vérifier ou initialiser le fichier `eas.json` à la racine de `apps/mobile/` :
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Étape C : Lancer la compilation de la build
- **Pour Android (fichier APK direct)** :
  ```bash
  cd apps/mobile
  eas build --profile development --platform android
  ```
- **Pour iOS (appareil enregistré en ad-hoc / TestFlight interne)** :
  ```bash
  cd apps/mobile
  eas build --profile development --platform ios
  ```

### Étape D : Installation sur votre téléphone
1. Une fois le build terminé, EAS affiche un QR Code dans le terminal et un lien de téléchargement.
2. Flasher le QR Code avec l'appareil photo du téléphone ou télécharger directement le fichier `.apk` (Android) / profil de provisionnement (iOS).
3. Installer l'application `TSOTSA Kids (Dev)` sur le téléphone.

### Étape E : Démarrage du serveur Expo en mode dev-client
```bash
cd apps/mobile
npx expo start --dev-client
```
Ouvrir l'application installée sur votre téléphone : elle se connecte directement au bundler Metro local.

---

## 3. Déroulement du test manuel Google Sign-In

1. Lancer l'application TSOTSA Kids.
2. Sur l'écran d'accueil (`M01`), appuyer sur **« Continuer avec Google »**.
3. La modale Google (`M02`) s'affiche :
   - Sélectionner le compte Google connecté sur l'appareil.
4. L'application native déclenche le dialogue Google Play Services / iOS WebAuth.
5. Une fois le compte choisi, le jeton d'identité (`id_token`) est transmis au endpoint `/v1/auth/google`.
6. L'API vérifie le jeton avec Google, enregistre l'utilisateur (ou retrouve son compte) et retourne la paire de tokens JWT.
7. L'application stocke les tokens de manière sécurisée dans `expo-secure-store` et redirige vers l'écran **Modules** (`M06`).

