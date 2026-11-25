import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import {
  listActiveDoctors,
  grantPermission,
  revokePermission,
  type DoctorUser,
} from "../../api/persons";

export const SupervisionDelegationsPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const [caregivers, setCaregivers] = useState<DoctorUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await listActiveDoctors();
      setCaregivers(data);
    } catch {
      // offline / fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
  }, []);

  const handleToggle = async (
    caregiverId: string,
    key: "canReadAll" | "canAssign" | "canValidateStaff"
  ) => {
    const permMap = {
      canReadAll: "patients.read_all",
      canAssign: "patients.assign",
      canValidateStaff: "staff.validate",
    };
    const permCode = permMap[key];
    const target = caregivers.find((c) => c.id === caregiverId);
    if (!target) return;

    const willEnable = !target[key];

    // Optimistic UI update
    setCaregivers((prev) =>
      prev.map((c) => (c.id === caregiverId ? { ...c, [key]: willEnable } : c))
    );

    try {
      if (willEnable) {
        await grantPermission(caregiverId, permCode);
        setStatusMsg(`Droit '${permCode}' accordé à ${target.name}.`);
      } else {
        await revokePermission(caregiverId, permCode);
        setStatusMsg(`Droit '${permCode}' retiré de ${target.name}.`);
      }
    } catch {
      setStatusMsg("Erreur lors de la mise à jour des droits.");
      await loadDoctors();
    }
  };

  const columns = [
    {
      header: t("supervision.colCaregiver"),
      render: (r: DoctorUser) => (
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary">{r.name}</span>
          <span className="text-xs text-text-muted">{r.email}</span>
        </div>
      ),
    },
    {
      header: "Spécialité & Structure",
      render: (r: DoctorUser) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-primary">{r.specialty}</span>
          <span className="text-[11px] text-text-secondary">{r.facility}</span>
        </div>
      ),
    },
    {
      header: "Statut hiérarchique",
      render: (r: DoctorUser) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            r.is_super_caregiver
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {r.is_super_caregiver ? "Super-Soignant" : "Soignant"}
        </span>
      ),
    },
    {
      header: t("supervision.colPermReadAll"),
      render: (r: DoctorUser) => (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={r.canReadAll}
            onChange={() => handleToggle(r.id, "canReadAll")}
            className="w-4 h-4 text-primary rounded cursor-pointer"
          />
          <span className="text-[11px] text-text-secondary">Tous patients</span>
        </label>
      ),
    },
    {
      header: t("supervision.colPermAssign"),
      render: (r: DoctorUser) => (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={r.canAssign}
            onChange={() => handleToggle(r.id, "canAssign")}
            className="w-4 h-4 text-primary rounded cursor-pointer"
          />
          <span className="text-[11px] text-text-secondary">Attribution</span>
        </label>
      ),
    },
    {
      header: t("supervision.colPermValidateStaff"),
      render: (r: DoctorUser) => (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={r.canValidateStaff}
            onChange={() => handleToggle(r.id, "canValidateStaff")}
            className="w-4 h-4 text-primary rounded cursor-pointer"
          />
          <span className="text-[11px] text-text-secondary">Validation</span>
        </label>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-delegations-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("supervision.delegationsTitle")}</h1>
          <p className="text-xs text-text-secondary mt-1">
            {t("supervision.delegationsSubtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDoctors}>
          Actualiser
        </Button>
      </div>

      {statusMsg && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-800">
          {statusMsg}
        </div>
      )}

      <Card className="p-4">
        {isLoading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des praticiens...</div>
        ) : caregivers.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-delegations-notice">
            {t("supervision.emptyDelegations")}
          </div>
        ) : (
          <DataTable data={caregivers} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  );
};
