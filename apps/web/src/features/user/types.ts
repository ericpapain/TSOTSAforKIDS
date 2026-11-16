export type ChildSex = "F" | "M";

export type ChildStatus = "MAS" | "MAM" | "normal" | "post_mas";

export type EdemaGrade = "none" | "plus" | "plus_plus" | "plus_plus_plus";

export type FamilyRelation = "mother" | "father" | "guardian" | "other";

export interface SecondParentInvite {
  phoneOrEmail: string;
  status: "pending" | "accepted";
  invitedAt: string;
}

export interface DoctorReport {
  id: string;
  date: string;
  doctorName: string;
  facility: string;
  title: string;
  targetWeightKg: number;
  prescription: string;
  observations: string;
}

export interface ChildMember {
  id: string;
  code: string;
  firstName: string;
  birthDate: string;
  sex: ChildSex;
  relation: FamilyRelation;
  weightKg: number;
  heightCm: number;
  muacMm: number;
  edema: EdemaGrade;
  status: ChildStatus;
  facilityName: string;
  doctorId?: string;
  doctorName?: string;
  doctorFacility?: string;
  doctorReports?: DoctorReport[];
  lastIntakeTime?: string;
  hasConsent: boolean;
  secondParentInvite?: SecondParentInvite;
}

export interface IntakeRecord {
  id: string;
  childId: string;
  childName: string;
  foodName: string;
  quantity: number;
  unit: string;
  time: string;
  date: string;
  consumption: "all" | "half" | "refused";
  status: "given" | "later" | "missed";
}

export interface CustomNutrientComposition {
  energyKcal: number;
  proteinG: number;
  lipidsG: number;
  ironMg: number;
  zincMg: number;
  calciumMg: number;
}

export interface CustomUserProduct {
  id: string;
  name: string;
  category: "custom";
  specification: string;
  portionGrams: number;
  nutrients: CustomNutrientComposition;
  equivalenceScore: number;
  createdAt: string;
}

export interface UserSettings {
  remindersActive: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredChannel: "web" | "sms" | "email";
}

