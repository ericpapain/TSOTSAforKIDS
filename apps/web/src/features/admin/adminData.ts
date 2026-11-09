import type {
  CaregiverPending,
  UserProductPending,
  AccountItem,
  FoodBatch,
  NutrientCheckItem,
  ReferenceProduct,
  RegionalPrice,
  OptimizationTarget,
  PlatformModule,
  PlatformNotificationChannel,
  MessageTemplate,
  DefaultRules,
} from "./types";

export const initialCaregiversPending: CaregiverPending[] = [
  {
    id: "cg-01",
    name: "Dr [Nom]",
    specialty: "pédiatre",
    facility: "CMA de démo",
    registeredAt: "12/11",
    hasLicensePdf: true,
    orderNumberStatus: "à contrôler",
    facilityScopeNotice: "Accès donné uniquement aux personnes de son établissement.",
  },
];

export const initialUserProductsPending: UserProductPending[] = [
  {
    id: "prod-user-01",
    name: "Farine infantile enrichie",
    category: "ajouté par un compte utilisateur",
    energyKcal: 400,
    proteinG: 15,
    lipidG: 9,
    ironMg: 8,
    calciumMg: 300,
    controls: {
      units: true,
      plausible: true,
      labelPhoto: true,
    },
  },
];

export const initialAccounts: AccountItem[] = [
  {
    id: "acc-01",
    name: "Compte parent (démo)",
    authProvider: "Téléphone",
    role: "user",
    status: "active",
    statusLabel: "Actif",
  },
  {
    id: "acc-02",
    name: "Dr [Nom]",
    authProvider: "Google",
    role: "caregiver",
    facility: "CMA de démo",
    status: "pending_verification",
    statusLabel: "À vérifier",
  },
  {
    id: "acc-03",
    name: "parent2@exemple.com",
    authProvider: "E-mail",
    role: "user",
    status: "invited",
    statusLabel: "Invité",
  },
  {
    id: "acc-04",
    name: "Équipe TSOTSA",
    authProvider: "Google",
    role: "admin",
    status: "active",
    statusLabel: "Actif",
  },
];

export const initialFoodBatches: FoodBatch[] = [
  {
    id: "lot-1",
    lotNumber: "Lot 1",
    source: "Comparaison ORKG R[identifiant] · export CSV · gabarit TSOTSA",
    submittedBy: "Fidel",
    lineCount: "—",
    status: "pending_review",
    statusLabel: "À valider (2ᵉ relecture)",
  },
  {
    id: "lot-2",
    lotNumber: "Lot 2",
    source: "Saisie manuelle · articles [références]",
    submittedBy: "—",
    lineCount: "—",
    status: "draft",
    statusLabel: "Brouillon",
  },
];

export const initialImportCheckItems: NutrientCheckItem[] = [
  {
    aliment: "Arachide",
    nutriment: "Protéines",
    valeur: "25,8",
    unite: "g",
    status: "valid",
    message: "✓ valide",
  },
  {
    aliment: "Arachide",
    nutriment: "Fer",
    valeur: "4,6",
    unite: "mg",
    status: "valid",
    message: "✓ valide",
  },
  {
    aliment: "Soja",
    nutriment: "Lipides",
    valeur: "199",
    unite: "g",
    status: "error",
    message: "✕ hors limites (max 100 g)",
  },
  {
    aliment: "Niébé",
    nutriment: "Calcium",
    valeur: "110",
    unite: "mg",
    status: "valid",
    message: "✓ valide",
  },
  {
    aliment: "Moringa",
    nutriment: "Vitamine A",
    valeur: "—",
    unite: "—",
    status: "warning",
    message: "⚠ unité manquante",
  },
];

export const initialReferenceProducts: ReferenceProduct[] = [
  {
    id: "ref-1",
    name: "F-75",
    base: "100 ml",
    essentialNutrients: "à définir",
    source: "OMS, malnutrition sévère (1999)",
    status: "À valider · hôpital",
  },
  {
    id: "ref-2",
    name: "F-100",
    base: "100 ml",
    essentialNutrients: "à définir",
    source: "OMS, malnutrition sévère (1999)",
    status: "À valider · hôpital",
  },
  {
    id: "ref-3",
    name: "Plumpy'Nut",
    base: "100 g",
    essentialNutrients: "protéines, lipides, fer",
    source: "Spécification RUTF OMS/UNICEF",
    status: "À valider",
  },
  {
    id: "ref-4",
    name: "Plumpy'Sup",
    base: "100 g",
    essentialNutrients: "à définir",
    source: "Fiche du fabricant",
    status: "À saisir",
  },
];

export const initialRegionalPrices: RegionalPrice[] = [
  { id: "pr-1", region: "Ouest", item: "Plumpy'Nut", price: "—", unit: "—", date: "—", source: "à saisir" },
  { id: "pr-2", region: "Ouest", item: "Arachide", price: "—", unit: "—", date: "—", source: "à saisir" },
  { id: "pr-3", region: "Ouest", item: "Soja", price: "—", unit: "—", date: "—", source: "à saisir" },
  { id: "pr-4", region: "Centre", item: "Plumpy'Nut", price: "—", unit: "—", date: "—", source: "à saisir" },
  { id: "pr-5", region: "Centre", item: "Arachide", price: "—", unit: "—", date: "—", source: "à saisir" },
  { id: "pr-6", region: "Extrême-Nord", item: "Niébé", price: "—", unit: "—", date: "—", source: "à saisir" },
];

export const initialOptimizationTargets: OptimizationTarget[] = [
  { id: "opt-1", population: "6–59 mois, MAS", phase: "Réhabilitation", nutrient: "Énergie", min: "à saisir", max: "à saisir", unit: "kcal/kg/j", source: "Protocole" },
  { id: "opt-2", population: "6–59 mois, MAS", phase: "Réhabilitation", nutrient: "Protéines", min: "à saisir", max: "à saisir", unit: "g/kg/j", source: "Protocole" },
  { id: "opt-3", population: "6–59 mois, MAS", phase: "Réhabilitation", nutrient: "Fer", min: "à saisir", max: "à saisir", unit: "mg/j", source: "Protocole" },
  { id: "opt-4", population: "6–59 mois, MAM", phase: "Supplément", nutrient: "Énergie", min: "à saisir", max: "à saisir", unit: "kcal/j", source: "Protocole" },
];

export const initialModules: PlatformModule[] = [
  { id: "nutrition", name: "Nutrition infantile", active: true, activeSubtitle: "Actif · visible par tous", inactiveSubtitle: "Inactif · masqué" },
  { id: "hta", name: "HTA", active: false, activeSubtitle: "Actif · visible par tous", inactiveSubtitle: "Inactif · affiché « bientôt »" },
  { id: "diabetes", name: "Diabète", active: false, activeSubtitle: "Actif · visible par tous", inactiveSubtitle: "Inactif · affiché « bientôt »" },
];

export const initialChannels: PlatformNotificationChannel[] = [
  { canal: "Téléphone (push)", service: "Firebase Cloud Messaging", etat: "À configurer", envoyees7j: "—", echecs: "—" },
  { canal: "SMS", service: "Agrégateur SMS local (à choisir)", etat: "À configurer", envoyees7j: "—", echecs: "—" },
  { canal: "E-mail", service: "Service d'envoi d'e-mails", etat: "À configurer", envoyees7j: "—", echecs: "—" },
];

export const initialMessageTemplates: MessageTemplate[] = [
  { id: "tpl-1", text: "« C'est l'heure du repas de {prénom} »" },
  { id: "tpl-2", text: "« Prise de {heure} non confirmée »" },
  { id: "tpl-3", text: "« {prénom} a reçu {produit} »" },
  { id: "tpl-4", text: "« Nouvelle évaluation de {prénom} »" },
];

export const initialDefaultRules: DefaultRules = {
  relanceApres: "30 min",
  heuresCalmes: "21:00 – 06:00",
  resumeSoignant: "20:00",
  rappelLocal: "activé",
};

