import React, { useState, useEffect } from "react";
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

export const SupervisionAssociationPage: React.FC = () => {
  const { t } = useTranslation("caregiver");

  const [patients, setPatients] = useState<NetworkPatient[]>([]);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<NetworkPatient | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

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

  const columns = [
    { header: t("supervision.colPatientCode"), accessor: "code" as const },
    { header: "Prénom", accessor: "first_name" as const },
    { header: t("supervision.colFacility"), accessor: "facility" as const },
    {
      header: t("supervision.colCurrentDoctor"),
      render: (r: NetworkPatient) => (
        <span className="font-semibold text-text-primary">
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

      <Card className="p-4">
        {isLoading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des associations...</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-association-notice">
            {t("supervision.emptyAssociation")}
          </div>
        ) : (
          <DataTable data={patients} columns={columns} keyExtractor={(r) => r.id} />
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
