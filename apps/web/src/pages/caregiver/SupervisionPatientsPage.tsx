import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import { listAllNetworkPatients, type NetworkPatient } from "../../api/persons";

export const SupervisionPatientsPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const [patients, setPatients] = useState<NetworkPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending">("all");

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await listAllNetworkPatients();
      setPatients(data);
    } catch {
      // offline / fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "validated") return p.status === "Validé" || p.status === "validated";
    if (statusFilter === "pending") return p.status === "En attente" || p.status === "pending";
    return true;
  });

  const columns = [
    { header: t("supervision.colPatientCode"), accessor: "code" as const },
    { header: "Prénom", accessor: "first_name" as const },
    {
      header: t("persons.columns.ageGender"),
      render: (r: NetworkPatient) => `${r.age} (${r.gender})`,
    },
    { header: "Région", accessor: "region" as const },
    { header: t("supervision.colFacility"), accessor: "facility" as const },
    {
      header: t("persons.columns.status"),
      render: (r: NetworkPatient) => {
        const isValidated = r.status === "Validé" || r.status === "validated";
        return (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isValidated ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {r.status}
          </span>
        );
      },
    },
    {
      header: t("supervision.colCurrentDoctor"),
      render: (r: NetworkPatient) => (
        <span className="font-semibold text-text-primary">
          {r.assignedDoctorName || "Non assigné"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-patients-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("supervision.allPatientsTitle")}</h1>
          <p className="text-xs text-text-secondary mt-1">
            {t("supervision.allPatientsSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPatients}>
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-text-secondary">Filtrer par statut :</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }`}
          >
            Tous ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("validated")}
            className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
              statusFilter === "validated"
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }`}
          >
            Validés
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
              statusFilter === "pending"
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }`}
          >
            En attente
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des dossiers...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-all-patients-notice">
            {t("supervision.emptyAllPatients")}
          </div>
        ) : (
          <DataTable data={filteredPatients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  );
};
