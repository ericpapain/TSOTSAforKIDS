/**
 * Types for products, nutritional equivalence, foods, and custom products.
 */

export interface ProductNutrient {
  nutrient_code: string;
  nutrient_name: string;
  value: number;
  value_min: number;
  value_max?: number | null;
  unit: string;
  unit_code: string;
}

export interface ProductSummary {
  id: string;
  type: "reference" | "custom";
  name: string;
  base: string;
  usage?: string | null;
  owner_user_id?: string | null;
  status: string;
  unit_label?: string | null;
  label_photo_file?: string | null;
  source_reference?: string | null;
}

export interface ProductDetail extends ProductSummary {
  nutrients: ProductNutrient[];
  essential_nutrients: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EquivalentFoodItem {
  food_id: string;
  food_name: string;
  local_name?: string | null;
  category?: string | null;
  m: number;
  e: number;
  distance: number;
  is_in_target_region: boolean;
  common_nutrients: string[];
  extra_nutrients: string[];
  teneurs: Record<string, number>;
  regions: string[];
  source?: string | null;
}

export interface EquivalenceResponse {
  product_id: string;
  product_name: string;
  essential_nutrients: string[];
  target_region?: string | null;
  strict_region: boolean;
  threshold_pct: number;
  equivalents: EquivalentFoodItem[];
}

export interface FoodNutrientValue {
  id: string;
  nutrient_code: string;
  nutrient_name: string;
  value_per_100g: number;
  unit: string;
  basis: string;
  sample_label?: string | null;
  is_estimated: boolean;
  source?: {
    id: string;
    citation: string;
    orkg_id?: string | null;
    publication_year?: number | null;
    validation_status: string;
  } | null;
}

export interface FoodDetail {
  id: string;
  name: string;
  kind: string;
  scientific_name?: string | null;
  category?: string | null;
  food_group?: string | null;
  state: string;
  status: string;
  version: number;
  is_current: boolean;
  created_at: string;
  local_names: Array<{ language_or_dialect: string; name: string }>;
  regions: Array<{
    region_code: string;
    region_name: string;
    availability: string;
    season_months?: string | null;
  }>;
  nutrients: FoodNutrientValue[];
}

export interface CustomProductCreatePayload {
  name: string;
  base?: string;
  label_photo_file?: string | null;
  nutrients: Array<{
    nutrient: string;
    value?: number | null;
    value_min?: number | null;
    value_max?: number | null;
    unit: string;
  }>;
}

