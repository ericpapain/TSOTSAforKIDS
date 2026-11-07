export type RelationType = "self" | "child" | "relative";
export type SexType = "M" | "F";

export interface PersonItem {
  id: string;
  pseudonym?: string;
  first_name: string;
  birth_date: string;
  sex: SexType;
  relation?: RelationType;
  region_id?: string | null;
  age_formatted?: string;
  last_visit?: string;
  last_weight?: string;
  status_badge?: string;
  facility_name?: string;
  next_appointment?: string;
}

export interface PersonCreatePayload {
  first_name: string;
  birth_date: string;
  sex: SexType;
  relation?: RelationType;
  weight?: string;
  height?: string;
  mid_upper_arm_circumference?: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  status: "active" | "soon";
  description?: string;
  icon?: string;
}

export interface ConsentInfo {
  id?: string;
  person_id: string;
  is_active: boolean;
  has_consent?: boolean;
  text_body?: string;
}
