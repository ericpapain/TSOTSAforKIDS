import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import {
  listAllNetworkPatients,
  listActiveDoctors,
  assignPatientCaregiver,
  type NetworkPatient,
  type DoctorUser,
} from "../../api/persons";

type SortField = "code" | "first_name" | "facility" | "assignedDoctorName";
type SortOrder = "asc" | "desc";
type AssignmentFilter = "all" | "assigned" | "unassigned";

export const SupervisionAssociationPage: React.FC = () => {
  const { t } = useTranslation("caregiver");

  const [patients, setPatients] = useState<NetworkPatient[]>([]);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<NetworkPatient | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [filterDoctorId, setFilterDoctorId] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ptsRes, docsRes] = await Promise.allSettled([
        listAllNetworkPatients(),
        listActiveDoctors(),
      ]);
      if (ptsRes.status === "fulfilled") setPatients(ptsRes.value);
      if (docsRes.status === "fulfilled") {
        setDoctors(docsRes.value);
        if (docsRes.value.length > 0 && !targetDoctorId) {
          setTargetDoctorId(docsRes.value[0].id);
        }
      }
    } catch {
      // offline / fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !targetDoctorId) return;

    try {
      await assignPatientCaregiver(
        selectedPatient.id,
        targetDoctorId,
        "",
        reassignReason || "Réassignation par la supervision clinique"
      );
      setFeedbackMsg(`Patient ${selectedPatient.code} réassigné avec succès.`);
      await loadData();
    } catch {
      setFeedbackMsg("Erreur lors de la réassignation du patient.");
    } finally {
      setSelectedPatient(null);
      setReassignReason("");
    }
  };

  const assignedCount = useMemo(
    () => patients.filter((p) => Boolean(p.assignedDoctorName && p.assignedDoctorName !== "Non assigné")).length,
    [patients]
  );
  const unassignedCount = patients.length - assignedCount;

  const filteredAndSortedPatients = useMemo(() => {
    let list = [...patients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.facility && p.facility.toLowerCase().includes(q)) ||
          (p.assignedDoctorName && p.assignedDoctorName.toLowerCase().includes(q))
      );
    }

    if (assignmentFilter === "assigned") {
      list = list.filter((p) => Boolean(p.assignedDoctorName && p.assignedDoctorName !== "Non assigné"));
    } else if (assignmentFilter === "unassigned") {
      list = list.filter((p) => !p.assignedDoctorName || p.assignedDoctorName === "Non assigné");
    }

    if (filterDoctorId) {
      const targetDoc = doctors.find((d) => d.id === filterDoctorId);
      if (targetDoc) {
        list = list.filter((p) => p.assignedDoctorName === targetDoc.name);
      }
    }

    list.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortField === "code") {
        valA = a.code || "";
        valB = b.code || "";
      } else if (sortField === "first_name") {
        valA = a.first_name || "";
        valB = b.first_name || "";
      } else if (sortField === "facility") {
        valA = a.facility || "";
        valB = b.facility || "";
      } else if (sortField === "assignedDoctorName") {
        valA = a.assignedDoctorName || "";
        valB = b.assignedDoctorName || "";
      }
      const cmp = valA.localeCompare(valB, "fr", { numeric: true, sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [patients, searchQuery, assignmentFilter, filterDoctorId, doctors, sortField, sortOrder]);

  const renderSortIndicator = (field: SortField) => {
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
          data-testid="th-sort-code"
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
          data-testid="th-sort-firstname"
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
          onClick={() => handleSort("facility")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-facility"
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
          onClick={() => handleSort("assignedDoctorName")}
          className="flex items-center hover:opacity-80 transition-opacity font-bold text-white text-left"
          data-testid="th-sort-doctor"
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
    {
      header: t("supervision.colAction"),
      render: (row: NetworkPatient) => (
        <Button
          variant="outline"
          size="sm"
          testID={`btn-reassign-${row.code}`}
          onClick={() => {
            setSelectedPatient(row);
            if (doctors.length > 0) {
              setTargetDoctorId(doctors[0].id);
            }
          }}
        >
          {t("supervision.btnReassign")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-association-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("supervision.associationTitle")}</h1>
          <p className="text-xs text-text-secondary mt-1">
            {t("supervision.associationSubtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          Actualiser
        </Button>
      </div>

      {feedbackMsg && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-800">
          {feedbackMsg}
        </div>
      )}

      <Card className="p-4 space-y-4">
        {/* Filtres & Tri */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          {/* Recherche */}
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher code, prénom, médecin, structure..."
              className="w-full px-3 py-1.5 text-xs border border-border rounded focus:border-primary outline-none"
              data-testid="association-search-input"
            />
          </div>

          {/* Filtres d'attribution */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">Statut :</span>
            <button
              type="button"
              onClick={() => setAssignmentFilter("all")}
              data-testid="filter-assignment-all"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                assignmentFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Tous ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter("assigned")}
              data-testid="filter-assignment-assigned"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                assignmentFilter === "assigned"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Assignés ({assignedCount})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter("unassigned")}
              data-testid="filter-assignment-unassigned"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                assignmentFilter === "unassigned"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Non assignés ({unassignedCount})
            </button>
          </div>

          {/* Filtre par médecin */}
          {doctors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-text-secondary">Médecin :</span>
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="text-xs px-2 py-1 border border-border rounded bg-white text-text-primary outline-none"
                data-testid="filter-doctor-select"
              >
                <option value="">Tous les praticiens</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sélecteur de tri */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-text-secondary">Trier par :</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-xs px-2 py-1 border border-border rounded bg-white text-text-primary outline-none"
              data-testid="association-sort-select"
            >
              <option value="code">Code patient</option>
              <option value="first_name">Prénom</option>
              <option value="assignedDoctorName">Médecin traitant</option>
              <option value="facility">Structure</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              data-testid="toggle-sort-order-btn"
              className="text-xs px-2 py-1 border border-border rounded bg-white text-text-primary hover:bg-gray-50 flex items-center gap-1 font-semibold"
              title="Inverser l'ordre de tri"
            >
              <span>{sortOrder === "asc" ? "▲ A-Z" : "▼ Z-A"}</span>
            </button>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between text-xs text-text-secondary px-1">
          <span>
            Affichage de <strong>{filteredAndSortedPatients.length}</strong> patient
            {filteredAndSortedPatients.length > 1 ? "s" : ""} sur <strong>{patients.length}</strong>
          </span>
          {(searchQuery || assignmentFilter !== "all" || filterDoctorId) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setAssignmentFilter("all");
                setFilterDoctorId("");
              }}
              className="text-xs text-primary hover:underline font-medium"
              data-testid="reset-filters-btn"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Tableau */}
        {isLoading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des associations...</div>
        ) : filteredAndSortedPatients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-association-notice">
            {patients.length === 0 ? t("supervision.emptyAssociation") : "Aucun dossier ne correspond aux critères de recherche."}
          </div>
        ) : (
          <DataTable data={filteredAndSortedPatients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[480px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-3">
              {t("supervision.modalReassignTitle", { code: selectedPatient.code })}
            </h2>
            <form onSubmit={handleConfirmReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Sélectionner le nouveau médecin traitant :
                </label>
                <select
                  required
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded focus:border-primary bg-white"
                  data-testid="select-target-doctor"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} ({doc.facility})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Motif de la réassignation :
                </label>
                <textarea
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Ex. Répartition de charge, mutation..."
                  className="w-full px-3 py-2 text-sm border rounded focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm" testID="confirm-reassign-btn">
                  Confirmer l'attribution
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
