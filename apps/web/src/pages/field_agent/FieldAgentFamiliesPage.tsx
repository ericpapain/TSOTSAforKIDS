import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import {
  listEnrolledFamilies,
  updateEnrolledChild,
  deleteEnrolledChild,
  type EnrolledChild,
} from "../../api/fieldAgent";
import { EnrollFamilyModal } from "./EnrollFamilyModal";

export const FieldAgentFamiliesPage: React.FC = () => {
  const { t } = useTranslation("common");

  const [childrenList, setChildrenList] = useState<EnrolledChild[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit child modal
  const [editingChild, setEditingChild] = useState<EnrolledChild | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editSex, setEditSex] = useState<"M" | "F">("M");

  const fetchFamilies = async () => {
    setIsLoading(true);
    try {
      const data = await listEnrolledFamilies();
      setChildrenList(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchFamilies();
  }, []);

  const handleOpenEdit = (child: EnrolledChild) => {
    setEditingChild(child);
    setEditFirstName(child.first_name);
    setEditBirthDate(child.birth_date);
    setEditSex(child.sex);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    try {
      await updateEnrolledChild(editingChild.id, {
        first_name: editFirstName,
        birth_date: editBirthDate,
        sex: editSex,
      });
      setEditingChild(null);
      await fetchFamilies();
    } catch (err) {
      alert("Erreur lors de la modification : " + String(err));
    }
  };

  const handleDeleteChild = async (id: string, name: string) => {
    if (!confirm(`Supprimer le dossier de ${name} ?`)) return;
    try {
      await deleteEnrolledChild(id);
      setChildrenList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression : " + String(err));
    }
  };

  const columns = [
    {
      header: "Dossier",
      accessor: "pseudonym" as const,
      render: (row: EnrolledChild) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
          {row.pseudonym}
        </span>
      ),
    },
    {
      header: "Enfant",
      render: (row: EnrolledChild) => (
        <div>
          <div className="font-semibold text-text-primary text-sm">{row.first_name}</div>
          <div className="text-[11px] text-text-secondary">
            {row.sex === "M" ? "Garçon" : "Fille"} • {row.birth_date}
          </div>
        </div>
      ),
    },
    {
      header: "Parent & Contact",
      render: (row: EnrolledChild) => (
        <div>
          <div className="font-medium text-xs text-text-primary">{row.parent_name || "Parent"}</div>
          <div className="text-[11px] text-text-muted">{row.parent_phone || "—"}</div>
        </div>
      ),
    },
    {
      header: "Médecin assigné",
      render: (row: EnrolledChild) => (
        <span className="text-xs text-text-secondary">
          {row.assigned_doctor_name ? `🩺 ${row.assigned_doctor_name}` : "En attente d'attribution"}
        </span>
      ),
    },
    {
      header: "Statut",
      render: (row: EnrolledChild) => {
        if (row.status === "validated") {
          return (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
              🟢 Validé
            </span>
          );
        }
        if (row.status === "refused") {
          return (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
              🔴 Refusé
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            🟡 En attente Super-Médecin
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row: EnrolledChild) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="!px-2 !py-0.5 text-xs"
            onClick={() => handleOpenEdit(row)}
          >
            ✏️
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="!px-2 !py-0.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteChild(row.id, row.first_name)}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="field-agent-families-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Familles inscrites</div>
          <h1 className="text-2xl font-bold text-text-primary">Enrôlement & Suivi des Familles</h1>
          <p className="text-xs text-text-secondary mt-1">
            Enregistrez les familles sur le terrain et suivez l'état de validation de leurs dossiers cliniques.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          testID="btn-open-register-family-modal"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Enrôler une famille
        </Button>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-text-secondary">Chargement des dossiers...</div>
        ) : childrenList.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-families-notice">
            Aucun dossier de famille enregistré pour le moment.
          </div>
        ) : (
          <DataTable data={childrenList} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {/* Edit Child Modal */}
      {editingChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[450px] p-6 relative">
            <h2 className="text-base font-bold text-text-primary mb-3">
              Modifier le dossier : {editingChild.pseudonym}
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Prénom de l'enfant *</label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Sexe *</label>
                  <select
                    value={editSex}
                    onChange={(e) => setEditSex(e.target.value as "M" | "F")}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-white"
                  >
                    <option value="M">Garçon</option>
                    <option value="F">Fille</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => setEditingChild(null)}>
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Enregistrer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Enroll Family Modal */}
      <EnrollFamilyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchFamilies}
      />
    </div>
  );
};
