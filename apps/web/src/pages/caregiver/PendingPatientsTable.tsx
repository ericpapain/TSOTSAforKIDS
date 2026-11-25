import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DataTable } from "../../components/DataTable";
import {
  validatePatient,
  validateAndAssignPatient,
  deletePatientByStaff,
  type PendingPatient,
} from "../../api/persons";

interface PendingPatientsTableProps {
  patients: PendingPatient[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const PendingPatientsTable: React.FC<PendingPatientsTableProps> = ({
  patients,
  isLoading,
  onRefresh,
}) => {
  const [filterRole, setFilterRole] = useState<"all" | "family" | "field_agent">("all");
  const [selectedPatientForReject, setSelectedPatientForReject] = useState<PendingPatient | null>(null);
  const [patientRejectReason, setPatientRejectReason] = useState("");
  const [selectedPatientForDelete, setSelectedPatientForDelete] = useState<PendingPatient | null>(null);
  const [patientDeleteReason, setPatientDeleteReason] = useState("");

  const filteredPatients = patients.filter((p) => {
    if (filterRole === "all") return true;
    const isFieldAgent =
      p.registered_by_role === "Agent de terrain" || p.registered_by_role === "field_agent";
    if (filterRole === "field_agent") return isFieldAgent;
    if (filterRole === "family") return !isFieldAgent;
    return true;
  });

  const handleValidate = async (patientId: string) => {
    try {
      await validateAndAssignPatient(patientId, {
        decision: "validated",
        doctor_id: "01a1f09e-d065-7f17-996a-7432eabf4854",
        field_agent_id: "01a1f09e-d067-7918-8d2c-42283f155bc6",
        notes: "Validation clinique et attribution médicale coordonnées",
      });
      onRefresh();
    } catch {
      onRefresh();
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForReject) return;
    try {
      await validatePatient(selectedPatientForReject.id, "refused", patientRejectReason);
      onRefresh();
    } catch {
      onRefresh();
    } finally {
      setSelectedPatientForReject(null);
      setPatientRejectReason("");
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForDelete) return;
    try {
      await deletePatientByStaff(selectedPatientForDelete.id, patientDeleteReason);
      onRefresh();
    } catch {
      onRefresh();
    } finally {
      setSelectedPatientForDelete(null);
      setPatientDeleteReason("");
    }
  };

  const columns = [
    { header: "Code / Pseudonyme", accessor: "pseudonym" as const },
    { header: "Prénom", accessor: "first_name" as const },
    { header: "Date de naissance", accessor: "birth_date" as const },
    { header: "Sexe", accessor: "sex" as const },
    {
      header: "Origine / Enrôlé par",
      render: (r: PendingPatient) => {
        const isAgent =
          r.registered_by_role === "Agent de terrain" || r.registered_by_role === "field_agent";
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text-primary">
              {r.registered_by_name || "Auto-inscription"}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                isAgent
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isAgent ? "Agent de terrain" : "Famille"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Statut",
      render: () => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
          En attente
        </span>
      ),
    },
    {
      header: "Actions Super-Soignant",
      render: (r: PendingPatient) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleValidate(r.id)}
            testID={`validate-patient-${r.id}`}
          >
            Valider & Attribuer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPatientForReject(r)}
            testID={`reject-patient-${r.id}`}
          >
            Refuser
          </Button>
          <button
            type="button"
            onClick={() => setSelectedPatientForDelete(r)}
            data-testid={`delete-patient-${r.id}`}
            className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">
            Dossiers d'enfants en attente de validation clinique ({filteredPatients.length})
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-text-secondary">Filtrer par origine :</span>
            <button
              type="button"
              onClick={() => setFilterRole("all")}
              data-testid="filter-patients-all"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                filterRole === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Tous ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("family")}
              data-testid="filter-patients-family"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                filterRole === "family"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Familles
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("field_agent")}
              data-testid="filter-patients-agent"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                filterRole === "field_agent"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Agents de terrain
            </button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Actualiser
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-text-muted text-sm">Chargement...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-patients-notice">
          Aucun dossier d'enfant en attente pour cette sélection.
        </div>
      ) : (
        <DataTable data={filteredPatients} columns={columns} keyExtractor={(r) => r.id} />
      )}

      {selectedPatientForReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[420px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-2">
              Refuser le dossier {selectedPatientForReject.pseudonym}
            </h2>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Motif médical du refus :</label>
                <textarea
                  required
                  rows={3}
                  value={patientRejectReason}
                  onChange={(e) => setPatientRejectReason(e.target.value)}
                  placeholder="Ex. Erreur d'état civil, réorientation..."
                  className="w-full px-3 py-2 text-sm border rounded focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPatientForReject(null)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Confirmer le refus
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {selectedPatientForDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[420px] p-6 text-left">
            <h2 className="text-base font-bold text-red-700 mb-2">
              Supprimer / Archiver le dossier {selectedPatientForDelete.pseudonym}
            </h2>
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Motif de suppression :</label>
                <textarea
                  required
                  rows={3}
                  value={patientDeleteReason}
                  onChange={(e) => setPatientDeleteReason(e.target.value)}
                  placeholder="Ex. Demande expresse des parents, doublon..."
                  className="w-full px-3 py-2 text-sm border rounded focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPatientForDelete(null)}>
                  Annuler
                </Button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold"
                >
                  Confirmer la suppression
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
};
