import type {
  IntakeConsumption,
  IntakeOrigin,
  OfflineIntake,
} from "../../offline/types";

export interface IntakeCreatePayload {
  id?: string;
  person_id: string;
  person_name?: string;
  item_type: "product" | "food";
  item_id: string;
  product_name: string;
  quantity: number | string;
  unit: string;
  taken_at?: string;
  consumption: IntakeConsumption;
  origin?: IntakeOrigin;
  schedule_time_id?: string | null;
  notes?: string | null;
}

export interface IntakeItem {
  id: string;
  person_id: string;
  item_type: string;
  item_id: string;
  quantity: number | string;
  unit: string;
  taken_at: string;
  consumption: IntakeConsumption;
  origin: IntakeOrigin;
  schedule_time_id?: string | null;
  notes?: string | null;
  recorded_by?: string;
  created_at: string;
  product_name?: string;
  is_offline_pending?: boolean;
}

export interface HistoryDisplayItem {
  id: string;
  timeLabel: string;
  productLabel: string;
  statusType: "complete" | "partial" | "unconfirmed";
  consumption: IntakeConsumption;
  rawDate: string;
  isUnconfirmed: boolean;
  personId: string;
  productName: string;
}

export type { OfflineIntake };

