export type IntakeConsumption = "all" | "half" | "refused";
export type IntakeOrigin = "app" | "late";
export type IntakeStatus = "pending" | "synced" | "failed";

export interface OfflineIntake {
  id: string;
  person_id: string;
  person_name: string;
  item_type: "product" | "food";
  item_id: string;
  product_name: string;
  quantity: string | number;
  unit: string;
  taken_at: string;
  consumption: IntakeConsumption;
  origin: IntakeOrigin;
  schedule_time_id?: string | null;
  notes?: string | null;
  created_at: string;
  status: IntakeStatus;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  errors?: string[];
}

