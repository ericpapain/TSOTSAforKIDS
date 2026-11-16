# Spécification Fonctionnelle — Module « Santé et Bien-être de l'Enfant »

## 1. Contexte et Objectifs

Le projet **TSOTSA for KIDS** intègre désormais un module transversal dédié au **suivi longitudinal de la santé et du bien-être de l'enfant**.
Ce module permet aux familles (parents / tuteurs légaux), aux agents de santé communautaires et aux professionnels soignants (médecins, infirmiers, nutritionnistes) de tracer, évaluer et prendre en charge les événements de santé de chaque enfant suivi.

### Objectifs Principaux
1. **Signalement proactif et décorrélé** : Permettre de signaler un problème ou un symptôme à tout moment, sans obligation d'être en cours d'administration d'un repas.
2. **Signalement contextuel pendant le repas** : Faciliter le signalement direct lorsqu'un incident survient pendant l'ingestion d'un repas ou d'un substitut nutritionnel (fausse route, vomissement immédiat, refus total).
3. **Interception instantanée des signes de danger vital** : Alerter immédiatement le parent dès qu'un signe d'alerte critique est sélectionné (convulsions, léthargie, détresse respiratoire, refus de s'alimenter/boire, vomissements incoercibles), sans attendre la fin du signalement, avec affichage bienveillant du numéro et des réflexes d'urgence.
4. **Continuité de soins et dossier médical longitudinal** : Regrouper tous les événements de santé, bilans cliniques et examens complémentaires au sein d'une frise chronologique unifiée dans le dossier patient.
5. **Centre d'alertes médicales proactif** : Avertir en temps réel les soignants et super-soignants des cas prioritaires (`urgent`, `high`, `attention`).
6. **Dualité d'affichage adaptée** : 
   - *Vue Parent* : rassurante, simple, dénuée de termes stigmatisants ou anxiogènes (VIH, tuberculose, malnutrition sévère compliquée traduits en termes bienveillants).
   - *Vue Professionnelle* : complète, structurée selon les référentiels pédiatriques de l'OMS et du Ministère de la Santé Publique du Cameroun.

---

## 2. Parcours Utilisateur Parent & Agent de Santé

### 2.1 Points d'Accès
- **Depuis le dossier enfant** : Bouton d'action proéminent « Santé et bien-être de mon enfant ».
- **Depuis le tableau de bord** : Raccourci vers le module santé et l'historique des bilans.
- **Pendant l'administration d'un aliment / produit** : Bouton « Signaler un problème de santé » dans l'écran de prise.

### 2.2 Assistant de Signalement en 5 Étapes
1. **Étape 1 : Moment d'apparition**
   - Choix intuitif : « Aujourd'hui », « Hier », « Il y a plusieurs jours » ou sélection d'une date/heure précise.
   - Contexte : standalone ou incident de repas.
2. **Étape 2 : Symptômes observés & Interception vitale**
   - Grille de cartes ergonomiques : Fièvre, Diarrhée, Vomissements, Toux / Respiration difficile, Grande fatigue, Refus de manger/boire, Éruptions cutanées, Convulsions / Malaises.
   - **Règle vitale** : Si un symptôme à criticité `urgent` est coché, une alerte visuelle clignotante apparaît instantanément.
3. **Étape 3 : Questions d'approfondissement contextuelles**
   - Pour la fièvre : température mesurée ou sensation tactile, sueurs, frissons.
   - Pour la diarrhée : nombre de selles / 24h, consistance (liquide, glaires, sang).
   - Pour la toux : durée (aiguë < 14j ou chronique), sifflement, essoufflement.
4. **Étape 4 : Traitements et remèdes administrés**
   - Saisie guidée : paracétamol, soluté de réhydratation orale (SRO), antibiotiques, décoctions ou tisanes traditionnelles.
5. **Étape 5 : Récapitulatif et Transmission**
   - Synthèse bienveillante, validation et confirmation d'envoi vers le soignant référent.

---

## 3. Parcours Professionnel de Santé (Soignant & Super Soignant)

### 3.1 Centre d'Alertes Centralisé
- Liste dynamique filtrable par niveau de priorité (`urgent`, `high`, `attention`).
- Notification immédiate des nouveaux incidents signalés.
- Accès direct au dossier complet de l'enfant d'un simple clic.

### 3.2 Prise en Charge Médicale & Évaluation Clinique
- Examen des symptômes signalés et de l'historique nutritionnel croisé.
- Saisie de la conclusion clinique (diagnostic suspecté ou confirmé).
- Prescription d'examens complémentaires (TDR Paludisme, NFS, coproculture, radio pulmonaire).
- Définition des conduites à tenir (orientation vers centre hospitalier, prescription médicamenteuse, adaptation du plan nutritionnel).
- Résolution ou archivage de l'alerte médicale.
