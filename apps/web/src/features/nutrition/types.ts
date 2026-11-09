export interface ReferenceProductNutrient {
  name: string;
  isKey?: boolean;
  value: string;
}

export interface ReferenceProduct {
  id: string;
  name: string;
  specification: string;
  nutrients: ReferenceProductNutrient[];
  costInfo: string;
  notice: string;
}

export interface EquivalentLocalFood {
  rank: number;
  id: string;
  name: string;
  commonNutrientsCount: string; // e.g. "3/3" or "2/3"
  extraNutrient: string; // e.g. "—" or "+ calcium"
  proteins: string; // e.g. "30,2 g"
  lipids: string; // e.g. "49,1 g"
  iron: string; // e.g. "8,8 mg"
  availableInWestRegion: boolean;
  energyKcal: number;
  calciumMg?: number;
  zincMg?: number;
  description?: string;
  category?: string;
}

export type RegionFilter = "all" | "west";

