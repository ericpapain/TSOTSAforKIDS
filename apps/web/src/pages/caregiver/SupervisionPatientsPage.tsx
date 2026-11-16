import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { DataTable } from "../../components/DataTable";

interface PatientOverviewItem {
  id: string;
  code: string;
  age: string;
  gender: string;
  region: string;
  facility: string;
  status: string;
  assignedDoctorName: string;
}

export const SupervisionPatientsPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const [patients] = useState<PatientOverviewItem[]>([]);

  const columns = [
    { header: t("supervision.colPatientCode"), accessor: "code" as const },
    { header: t("persons.columns.ageGender"), render: (r: PatientOverviewItem) => `${r.age} (${r.gender})` },
    { header: t("persons.columns.facility"), accessor: "region" as const },
    { header: t("supervision.colFacility"), accessor: "facility" as const },
    { header: t("persons.columns.status"), accessor: "status" as const },
    { header: t("supervision.colCurrentDoctor"), accessor: "assignedDoctorName" as const },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-patients-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("supervision.allPatientsTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("supervision.allPatientsSubtitle")}
        </p>
      </div>

      <Card className="p-4">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-all-patients-notice">
            {t("supervision.emptyAllPatients")}
          </div>
        ) : (
          <DataTable data={patients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  );
};
