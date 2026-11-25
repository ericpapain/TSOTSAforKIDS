import React from "react";

export interface ChildDraft {
  first_name: string;
  birth_date: string;
  sex: "M" | "F";
  weight_kg?: number;
  height_cm?: number;
  muac_mm?: number;
}

interface ChildEnrollmentCardProps {
  child: ChildDraft;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (field: string, val: string | number) => void;
}

export const ChildEnrollmentCard: React.FC<ChildEnrollmentCardProps> = ({
  child,
  index,
  canRemove,
  onRemove,
  onChange,
}) => {
  return (
    <div className="p-2.5 bg-slate-50 border rounded text-xs space-y-2 relative">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700">Enfant #{index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-[11px]"
          >
            Retirer
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            type="text"
            required
            placeholder="Prénom"
            data-testid={`child-${index}-firstname`}
            value={child.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
            className="w-full px-2 py-1 border rounded bg-white text-xs"
          />
        </div>
        <div>
          <select
            value={child.sex}
            onChange={(e) => onChange("sex", e.target.value)}
            className="w-full px-2 py-1 border rounded bg-white text-xs"
          >
            <option value="M">Garçon</option>
            <option value="F">Fille</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="date"
            required
            data-testid={`child-${index}-birthdate`}
            value={child.birth_date}
            onChange={(e) => onChange("birth_date", e.target.value)}
            className="w-full px-2 py-1 border rounded bg-white text-xs"
          />
        </div>
        <div>
          <input
            type="text"
            data-testid={`child-${index}-weight`}
            placeholder="Poids (kg)"
            value={
              child.weight_kg !== undefined && child.weight_kg !== null
                ? String(child.weight_kg)
                : ""
            }
            onChange={(e) => onChange("weight_kg", e.target.value)}
            className="w-full px-2 py-1 border rounded bg-white text-xs"
          />
        </div>
      </div>
    </div>
  );
};
