-- TSOTSA Kids - Initialisation des bases et privilèges utilisateurs
-- Exécuter en tant qu'administrateur MySQL (ex: mysql -u root -p < creer_base.sql)
-- Les mots de passe sont passés via les variables de session MySQL ou à définir lors de l'exécution.
-- Exemple :
-- mysql -u root -p -e "SET @app_pwd='...'; SET @migrator_pwd='...'; SET @ro_pwd='...'; SOURCE infra/scripts/creer_base.sql;"

-- 1. Bases de données
CREATE DATABASE IF NOT EXISTS `tsotsa_prod`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE DATABASE IF NOT EXISTS `tsotsa_recette`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- 2. Utilisateurs avec TLS obligatoire (REQUIRE SSL)
-- Utilisateur applicatif standard (DML uniquement)
CREATE USER IF NOT EXISTS 'tsotsa_app'@'%'
  IDENTIFIED BY 'CHANGEME_APP_PASSWORD'
  REQUIRE SSL;

-- Utilisateur de migration de schéma (DDL + DML)
CREATE USER IF NOT EXISTS 'tsotsa_migrator'@'%'
  IDENTIFIED BY 'CHANGEME_MIGRATOR_PASSWORD'
  REQUIRE SSL;

-- Utilisateur lecture seule (Reporting, audits et sauvegardes analytiques)
CREATE USER IF NOT EXISTS 'tsotsa_readonly'@'%'
  IDENTIFIED BY 'CHANGEME_READONLY_PASSWORD'
  REQUIRE SSL;

-- 3. Privilèges sur tsotsa_prod
GRANT SELECT, INSERT, UPDATE, DELETE ON `tsotsa_prod`.* TO 'tsotsa_app'@'%';
GRANT ALL PRIVILEGES ON `tsotsa_prod`.* TO 'tsotsa_migrator'@'%';
GRANT SELECT ON `tsotsa_prod`.* TO 'tsotsa_readonly'@'%';

-- 4. Privilèges sur tsotsa_recette
GRANT SELECT, INSERT, UPDATE, DELETE ON `tsotsa_recette`.* TO 'tsotsa_app'@'%';
GRANT ALL PRIVILEGES ON `tsotsa_recette`.* TO 'tsotsa_migrator'@'%';
GRANT SELECT ON `tsotsa_recette`.* TO 'tsotsa_readonly'@'%';

FLUSH PRIVILEGES;

