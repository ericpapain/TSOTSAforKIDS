import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import { listAllNetworkPatients, type NetworkPatient } from "../../api/persons";

type PatientSortField = "code" | "first_name" | "age" | "region" | "facility" | "status" | "assignedDoctorName";
type SortOrder = "asc" | "desc";

export const SupervisionPatientsPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const [patients, setPatients] = useState<NetworkPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "validated" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<PatientSortField>("code");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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

  const handleSort = (field: PatientSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedPatients = useMemo(() => {
    let list = patients.filter((p) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "validated") return p.status === "Validé" || p.status === "validated";
      if (statusFilter === "pending") return p.status === "En attente" || p.status === "pending";
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.region && p.region.toLowerCase().includes(q)) ||
          (p.facility && p.facility.toLowerCase().includes(q)) ||
          (p.assignedDoctorName && p.assignedDoctorName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      if (sortField === "code") {
        valA = a.code || "";
        valB = b.code || "";
      } else if (sortField === "first_name") {
        valA = a.first_name || "";
        valB = b.first_name || "";
      } else if (sortField === "age") {
        valA = a.age || 0;
        valB = b.age || 0;
        return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      } else if (sortField === "region") {
        valA = a.region || "";
        valB = b.region || "";
      } else if (sortField === "facility") {
        valA = a.facility || "";
        valB = b.facility || "";
      } else if (sortField === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (sortField === "assignedDoctorName") {
        valA = a.assignedDoctorName || "";
        valB = b.assignedDoctorName || "";
      }

      const cmp = String(valA).localeCompare(String(valB), "fr", { numeric: true, sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [patients, statusFilter, searchQuery, sortField, sortOrder]);

  const renderSortIndicator = (field: PatientSortField) => {
    if (sortField !== field) return <span className="opacity-40 text-[10px] ml-1">↕</span>;
    return <span className="text-[11px] font-bold ml-1">{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  const columns = [
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("code")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-code"
        >
          <span>{t("supervision.colPatientCode")}</span>
          {renderSortIndicator("code")}
        </button>
      ),
      accessor: "code" as const,
    },
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("first_name")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-firstname"
        >
          <span>Prénom</span>
          {renderSortIndicator("first_name")}
        </button>
      ),
      accessor: "first_name" as const,
    },
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("age")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-age"
        >
          <span>{t("persons.columns.ageGender")}</span>
          {renderSortIndicator("age")}
        </button>
      ),
      render: (r: NetworkPatient) => `${r.age} (${r.gender})`,
    },
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("region")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-region"
        >
          <span>Région</span>
          {renderSortIndicator("region")}
        </button>
      ),
      accessor: "region" as const,
    },
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("facility")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-facility"
        >
          <span>{t("supervision.colFacility")}</span>
          {renderSortIndicator("facility")}
        </button>
      ),
      accessor: "facility" as const,
    },
    {
      header: (
        <button
          type="button"
          onClick={() => handleSort("status")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-status"
        >
          <span>{t("persons.columns.status")}</span>
          {renderSortIndicator("status")}
        </button>
      ),
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
      header: (
        <button
          type="button"
          onClick={() => handleSort("assignedDoctorName")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-patient-doctor"
        >
          <span>{t("supervision.colCurrentDoctor")}</span>
          {renderSortIndicator("assignedDoctorName")}
        </button>
      ),
      render: (r: NetworkPatient) => (
        <span
          className={`font-semibold ${
            r.assignedDoctorName && r.assignedDoctorName !== "Non assigné"
              ? "text-text-primary"
              : "text-amber-600 italic"
          }`}
        >
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

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          {/* Recherche */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher code, prénom, région, médecin..."
              className="w-full px-3 py-1.5 text-xs border border-border rounded focus:border-primary outline-none"
              data-testid="patients-search-input"
            />
          </div>

          {/* Filtres par statut */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">Statut :</span>
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

          {/* Sélecteur de tri */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">Trier par :</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as PatientSortField)}
              className="text-xs px-2 py-1 border border-border rounded bg-white text-text-primary outline-none"
              data-testid="patients-sort-select"
            >
              <option value="code">Code patient</option>
              <option value="first_name">Prénom</option>
              <option value="age">Âge</option>
              <option value="region">Région</option>
              <option value="facility">Structure</option>
              <option value="status">Statut</option>
              <option value="assignedDoctorName">Médecin</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              data-testid="toggle-patient-sort-order-btn"
              className="text-xs px-2 py-1 border border-border rounded bg-white text-text-primary hover:bg-gray-50 flex items-center gap-1 font-semibold"
              title="Inverser l'ordre de tri"
            >
              <span>{sortOrder === "asc" ? "▲ A-Z" : "▼ Z-A"}</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        {isLoading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des dossiers...</div>
        ) : filteredAndSortedPatients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-all-patients-notice">
            {patients.length === 0 ? t("supervision.emptyAllPatients") : "Aucun dossier ne correspond aux critères de recherche."}
          </div>
        ) : (
          <DataTable data={filteredAndSortedPatients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  );
};
