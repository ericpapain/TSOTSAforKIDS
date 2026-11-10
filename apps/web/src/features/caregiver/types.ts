export type AlertPriority = "high" | "medium" | "low";

export interface AlertItem {
  id: string;
  personId: string;
  personCode: string;
  personName: string;
  priority: AlertPriority;
  reason: string;
  timestamp: string;
}

export interface ScheduledEval {
  id: string;
  personId: string;
  personCode: string;
  personName: string;
  location: string;
  scheduledTime: string;
  title: string;
}

export interface CaregiverDoctor {
  id: string;
  name: string;
  specialty: string;
  facility: string;
  patientCount: number;
}

export interface PatientTransferRecord {
  date: string;
  fromDoctor: string;
  toDoctor: string;
  reassignedBy: string;
  reason: string;
}

export interface FollowedPerson {
  id: string;
  code: string;
  name: string;
  age: string;
  gender: "F" | "M";
  region: string;
  facility: string;
  status: "MAM" | "MAS" | "Suivi post-MAS" | "Normal";
  statusColor: string;
  lastEvaluation: string;
  pb: number; // in mm
  zScore: number;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  transferHistory?: PatientTransferRecord[];
}

export interface EvaluationRecord {
  id: string;
  date: string;
  weightKg: number;
  lengthCm: number;
  pbMm: number;
  zScore: number;
  position: "Couchée" | "Debout";
  edema: "Non" | "+" | "++" | "+++";
  observations?: string;
  gainDailyGKg?: number;
}

export interface IntakePlanRow {
  id: string;
  time: string;
  mealName: string;
  portion: string;
  confirmedToday?: boolean;
}

export interface CaregiverNotification {
  id: string;
  personId: string;
  personCode: string;
  personName: string;
  title: string;
  message: string;
  timestamp: string;
  category: "intake" | "reminder" | "alert";
  isRead: boolean;
}

export interface NotificationSettingChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface PersonNotificationSettings {
  personId: string;
  personName: string;
  personCode: string;
  frequency: "Immédiat" | "Résumé quotidien" | "Jamais";
  enabled: boolean;
}

