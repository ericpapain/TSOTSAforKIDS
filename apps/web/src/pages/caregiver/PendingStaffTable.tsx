import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DataTable } from "../../components/DataTable";
import {
  validateStaff,
  suspendStaff,
  type PendingStaffUser,
} from "../../api/persons";

interface PendingStaffTableProps {
  staff: PendingStaffUser[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const PendingStaffTable: React.FC<PendingStaffTableProps> = ({
  staff,
  isLoading,
  onRefresh,
}) => {
  const [filterRole, setFilterRole] = useState<"all" | "caregiver" | "field_agent">("all");
  const [selectedStaffForReject, setSelectedStaffForReject] = useState<PendingStaffUser | null>(null);
  const [staffRejectReason, setStaffRejectReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredStaff = staff.filter((s) => {
    if (filterRole === "all") return true;
    const isCaregiver = s.roles.includes("caregiver");
    const isAgent = s.roles.includes("field_agent");
    if (filterRole === "caregiver") return isCaregiver;
    if (filterRole === "field_agent") return isAgent;
    return true;
  });

  const handleApprove = async (userId: string) => {
    try {
      await validateStaff(userId, "approved");
      setActionMessage("Compte professionnel approuvé avec succès.");
      onRefresh();
    } catch {
      setActionMessage("Erreur lors de l'approbation du compte.");
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForReject) return;
    try {
      await validateStaff(selectedStaffForReject.id, "rejected", staffRejectReason);
      setActionMessage("Compte professionnel refusé.");
      onRefresh();
    } catch {
      setActionMessage("Erreur lors du refus du compte.");
    } finally {
      setSelectedStaffForReject(null);
      setStaffRejectReason("");
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir suspendre ce professionnel ?")) return;
    try {
      await suspendStaff(userId);
      setActionMessage("Compte professionnel suspendu.");
      onRefresh();
    } catch {
      setActionMessage("Erreur lors de la suspension du compte.");
    }
  };

  const columns = [
    {
      header: "Nom complet",
      render: (r: PendingStaffUser) => (
        <span className="font-semibold text-text-primary">
          {r.display_name || `${r.first_name} ${r.last_name}`.trim()}
        </span>
      ),
    },
    {
      header: "Rôle sollicité",
      render: (r: PendingStaffUser) => {
        const isAgent = r.roles.includes("field_agent");
        return (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              isAgent ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isAgent ? "Agent de terrain" : "Médecin / Soignant"}
          </span>
        );
      },
    },
    {
      header: "Localité",
      render: (r: PendingStaffUser) => (
        <span className="text-xs text-text-secondary">{r.locality || "—"}</span>
      ),
    },
    {
      header: "Statut",
      render: () => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
          En attente de validation
        </span>
      ),
    },
    {
      header: "Actions Super-Soignant",
      render: (r: PendingStaffUser) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleApprove(r.id)}
            testID={`approve-staff-${r.id}`}
          >
            Approuver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStaffForReject(r)}
            testID={`reject-staff-${r.id}`}
          >
            Refuser
          </Button>
          <button
            type="button"
            onClick={() => handleSuspend(r.id)}
            data-testid={`suspend-staff-${r.id}`}
            className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
          >
            Suspendre
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
            Personnel en attente d'approbation clinique ({filteredStaff.length})
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-text-secondary">Filtrer par corps :</span>
            <button
              type="button"
              onClick={() => setFilterRole("all")}
              data-testid="filter-staff-all"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                filterRole === "all"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Tous ({staff.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("caregiver")}
              data-testid="filter-staff-caregiver"
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                filterRole === "caregiver"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              }`}
            >
              Médecins & Soignants
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("field_agent")}
              data-testid="filter-staff-agent"
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

      {actionMessage && (
        <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-800">
          {actionMessage}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-text-muted text-sm">Chargement...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-staff-notice">
          Aucun professionnel en attente pour cette sélection.
        </div>
      ) : (
        <DataTable data={filteredStaff} columns={columns} keyExtractor={(r) => r.id} />
      )}

      {selectedStaffForReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[420px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-2">
              Refuser le professionnel {selectedStaffForReject.display_name}
            </h2>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Motif de refus :</label>
                <textarea
                  required
                  rows={3}
                  value={staffRejectReason}
                  onChange={(e) => setStaffRejectReason(e.target.value)}
                  placeholder="Ex. Absence de justificatif professionnel, doublon..."
                  className="w-full px-3 py-2 text-sm border rounded focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedStaffForReject(null)}>
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
    </Card>
  );
};
