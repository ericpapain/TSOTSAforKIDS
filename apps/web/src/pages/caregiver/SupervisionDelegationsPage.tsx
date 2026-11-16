import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { DataTable } from "../../components/DataTable";

interface CaregiverDelegationItem {
  id: string;
  name: string;
  facility: string;
  canReadAll: boolean;
  canAssign: boolean;
  canValidateStaff: boolean;
}

export const SupervisionDelegationsPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const [caregivers, setCaregivers] = useState<CaregiverDelegationItem[]>([]);

  const handleToggle = (
    caregiverId: string,
    key: "canReadAll" | "canAssign" | "canValidateStaff"
  ) => {
    setCaregivers((prev) =>
      prev.map((c) => (c.id === caregiverId ? { ...c, [key]: !c[key] } : c))
    );
  };

  const columns = [
    { header: t("supervision.colCaregiver"), accessor: "name" as const },
    { header: t("supervision.colFacility"), accessor: "facility" as const },
    {
      header: t("supervision.colPermReadAll"),
      render: (r: CaregiverDelegationItem) => (
        <input
          type="checkbox"
          checked={r.canReadAll}
          onChange={() => handleToggle(r.id, "canReadAll")}
          className="w-4 h-4 text-primary rounded"
        />
      ),
    },
    {
      header: t("supervision.colPermAssign"),
      render: (r: CaregiverDelegationItem) => (
        <input
          type="checkbox"
          checked={r.canAssign}
          onChange={() => handleToggle(r.id, "canAssign")}
          className="w-4 h-4 text-primary rounded"
        />
      ),
    },
    {
      header: t("supervision.colPermValidateStaff"),
      render: (r: CaregiverDelegationItem) => (
        <input
          type="checkbox"
          checked={r.canValidateStaff}
          onChange={() => handleToggle(r.id, "canValidateStaff")}
          className="w-4 h-4 text-primary rounded"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-delegations-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("supervision.delegationsTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("supervision.delegationsSubtitle")}
        </p>
      </div>

      <Card className="p-4">
        {caregivers.length === 0 ? (
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
