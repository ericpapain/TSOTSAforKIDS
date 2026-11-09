export type UserRole = "user" | "caregiver" | "admin";

export interface CaregiverPending {
  id: string;
  name: string;
  specialty: string;
  facility: string;
  registeredAt: string;
  hasLicensePdf: boolean;
  orderNumberStatus: string;
  facilityScopeNotice: string;
}

export interface UserProductPending {
  id: string;
  name: string;
  category: string;
  energyKcal: number;
  proteinG: number;
  lipidG: number;
  ironMg: number;
  calciumMg: number;
  controls: {
    units: boolean;
    plausible: boolean;
    labelPhoto: boolean;
  };
}

export interface AccountItem {
  id: string;
  name: string;
  authProvider: "Google" | "Téléphone" | "E-mail";
  role: UserRole;
  facility?: string;
  status: "active" | "pending_verification" | "invited";
  statusLabel: string;
}

export interface FoodBatch {
  id: string;
  lotNumber: string;
  source: string;
  submittedBy: string;
  lineCount: string;
  status: "pending_review" | "draft" | "published";
  statusLabel: string;
}

export type ImportRowCheckCode =
  | "VALID"
  | "ERR_OUT_OF_BOUNDS_100G"
  | "ERR_OUT_OF_BOUNDS_900KCAL"
  | "WARN_MISSING_UNIT";

export interface NutrientCheckItem {
  aliment: string;
  nutriment: string;
  valeur: string;
  unite: string;
  status: "valid" | "error" | "warning";
  code?: ImportRowCheckCode;
  message: string;
}

export interface ReferenceProduct {
  id: string;
  name: string;
  base: string;
  essentialNutrients: string;
  source: string;
  status: string;
}

export interface RegionalPrice {
  id: string;
  region: string;
  item: string;
  price: string;
  unit: string;
  date: string;
  source: string;
}

export interface OptimizationTarget {
  id: string;
  population: string;
  phase: string;
  nutrient: string;
  min: string;
  max: string;
  unit: string;
  source: string;
}

export interface PlatformModule {
  id: "nutrition" | "hta" | "diabetes";
  name: string;
  active: boolean;
  activeSubtitle: string;
  inactiveSubtitle: string;
}

export interface PlatformNotificationChannel {
  canal: string;
  service: string;
  etat: string;
  envoyees7j: string;
  echecs: string;
}

export interface MessageTemplate {
  id: string;
  text: string;
}

export interface DefaultRules {
  relanceApres: string;
  heuresCalmes: string;
  resumeSoignant: string;
  rappelLocal: string;
}

