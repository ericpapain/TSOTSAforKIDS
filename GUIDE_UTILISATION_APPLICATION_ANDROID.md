# Guide d'Installation et d'Utilisation – Application Android TSOTSA for KIDS

**Date** : 15 novembre 2026  
**Version d'application** : 1.0.0 (Build `f3d99c7a`)  
**Profil** : Preview / Production Connectée  
**Lien de téléchargement direct** : [https://expo.dev/accounts/epmezatio/projects/tsotsa-kids/builds/f3d99c7a-393b-4179-a6bc-a6a68cc435c9](https://expo.dev/accounts/epmezatio/projects/tsotsa-kids/builds/f3d99c7a-393b-4179-a6bc-a6a68cc435c9)

---

## 1. Installation de la Nouvelle Version sur Votre Smartphone

1. **Ouvrir le lien sur votre téléphone Android** :
   - Ouvrez votre navigateur mobile (Chrome ou Samsung Internet).
   - Accédez au lien officiel EAS Build :  
     👉 [https://expo.dev/accounts/epmezatio/projects/tsotsa-kids/builds/f3d99c7a-393b-4179-a6bc-a6a68cc435c9](https://expo.dev/accounts/epmezatio/projects/tsotsa-kids/builds/f3d99c7a-393b-4179-a6bc-a6a68cc435c9)
2. **Télécharger le fichier APK** :
   - Appuyez sur le bouton bleu **« Install »** ou **« Download »**.
   - Le fichier `.apk` se télécharge (environ 55 Mo).
3. **Autoriser l'installation** :
   - Si Android affiche le message d'avertissement standard de sécurité *« Fichier potentiellement dangereux »* ou *« Installer des applications inconnues »*, choisissez **« Télécharger quand même »** puis activez l'autorisation pour votre navigateur.
4. **Installer l'application** :
   - Cliquez sur **Installer** (ou **Mettre à jour** si l'ancienne version était présente).

---

## 2. Création de Votre Vrai Compte Utilisateur (Bout en Bout)

1. Ouvrez **TSOTSA 4KIDS** sur votre smartphone.
2. Sur l'écran d'accueil, appuyez sur le bouton blanc avec l'icône lettre :  
   **« Continuer avec mon e-mail »**.
3. En haut de l'écran, basculez sur l'onglet de droite :  
   **« Créer un compte »**.
4. Remplissez les 3 champs obligatoires :
   - **Nom complet** : votre nom réel (ex: `Eric Papain Mezatio`).
   - **Adresse e-mail** : votre adresse (ex: `ericpapainmezatio@gmail.com`).
   - **Mot de passe** : votre mot de passe sécurisé (au moins 8 caractères).
5. Appuyez sur le bouton vert **« Continuer »**.
6. **Ce qui se passe immédiatement en coulisses** :
   - L'application contacte en direct votre API FastAPI sur `https://www.tsotsa-for-kids.com/api/v1/auth/email/register`.
   - Le backend hache votre mot de passe avec Bcrypt (12 tours de sécurité).
   - Une nouvelle ligne est insérée dans la table `users` et dans la table `user_identities` de votre base MySQL.
   - Vos jetons de session (Access Token + Refresh Token) sont chiffrés et stockés dans le coffre-fort matériel de votre smartphone (`Expo SecureStore`).
   - L'application vous connecte directement et ouvre votre tableau de bord.

---

## 3. Constat et Vérification en Direct dans MySQL (Adminer)

Pour vérifier par vous-même que la donnée est réellement stockée dans MySQL et ne dépend d'aucun mock :

1. Ouvrez dans un onglet votre console de base de données :  
   👉 [https://www.tsotsa-for-kids.com/db-admin/](https://www.tsotsa-for-kids.com/db-admin/)
2. Dans le menu de gauche, cliquez sur la table **`users`**.
3. Cliquez sur **« Données »** (ou « Sélectionner » / « select »).
4. **Résultat immédiat** :
   - Vous voyez une nouvelle ligne apparaître avec votre `id` (UUID v7 horodaté), votre `display_name` (« Eric Papain Mezatio »), et la date de création.
5. Cliquez sur la table **`user_identities`** :
   - Vous voyez la correspondance avec votre adresse e-mail `ericpapainmezatio@gmail.com` et le hash de mot de passe Bcrypt (débutant par `$2b$12$...`).
