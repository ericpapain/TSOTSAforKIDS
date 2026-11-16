export interface MobileSymptomItem {
  code: string;
  category: string;
  label_fr: string;
  label_en: string;
  is_danger_sign: boolean;
  display_order: number;
}

export interface MobileHealthEventInput {
  person_id: string;
  intake_id?: string | null;
  declaration_context?: "standalone" | "during_meal";
  meal_interrupted?: boolean;
  symptom_code: string;
  duration: string;
  duration_days?: number;
  temperature_celsius?: number;
  stools_frequency_per_day?: number;
  vomiting_frequency_per_day?: number;
  has_blood_stools?: boolean;
  comment?: string;
}

export interface MobileHealthEventOut {
  id: string;
  person_id: string;
  created_at: string;
  status: "open" | "under_review" | "resolved" | "submitted";
  priority: "normal" | "attention" | "high" | "urgent";
  has_danger_sign: boolean;
  parent_guidance_message: string;
  declaration_context: string;
  symptoms: Array<{
    symptom_code: string;
    duration: string;
  }>;
}

