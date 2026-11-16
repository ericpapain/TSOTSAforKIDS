/**
 * Référentiel officiel des 10 régions du Cameroun.
 * Conforme au modèle de données TSOTSA Kids.
 */

export interface CameroonRegion {
  id: string;
  name: string;
}

export const CAMEROON_REGIONS: CameroonRegion[] = [
  { id: "adamaoua", name: "Adamaoua" },
  { id: "centre", name: "Centre" },
  { id: "est", name: "Est" },
  { id: "extreme_nord", name: "Extrême-Nord" },
  { id: "littoral", name: "Littoral" },
  { id: "nord", name: "Nord" },
  { id: "nord_ouest", name: "Nord-Ouest" },
  { id: "ouest", name: "Ouest" },
  { id: "sud", name: "Sud" },
  { id: "sud_ouest", name: "Sud-Ouest" },
];

