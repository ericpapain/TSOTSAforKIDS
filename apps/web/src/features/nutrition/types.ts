export interface ReferenceProductNutrient {
  name: string;
  isKey?: boolean;
  value: string;
}

export interface ReferenceProduct {
  id: string;
  name: string;
  usage?: string;
  category?: "reference" | "custom";
  statusBadge?: string;
  keyNutrientsSummary?: string;
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
  regions?: CameroonRegionCode[];
  energyKcal: number;
  calciumMg?: number;
  zincMg?: number;
  description?: string;
  category?: string;
}

export type CameroonRegionCode =
  | "west"
  | "adamaoua"
  | "centre"
  | "east"
  | "far-north"
  | "littoral"
  | "north"
  | "north-west"
  | "south"
  | "south-west";

export type RegionFilter = "all" | CameroonRegionCode;

export interface CameroonRegionOption {
  code: RegionFilter;
  label: string;
  shortName: string;
}

