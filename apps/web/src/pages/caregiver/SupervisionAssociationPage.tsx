import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";

interface PatientAssignmentItem {
  id: string;
  code: string;
  facility: string;
  currentDoctorId?: string;
  currentDoctorName: string;
}

interface DoctorOption {
  id: string;
  name: string;
  facility: string;
}

export const SupervisionAssociationPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const { t: tCommon } = useTranslation("common");

  const [patients, setPatients] = useState<PatientAssignmentItem[]>([]);
  const [doctors] = useState<DoctorOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientAssignmentItem | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !targetDoctorId) return;
    const targetDoc = doctors.find((d) => d.id === targetDoctorId);
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedPatient.id
          ? {
              ...p,
              currentDoctorId: targetDoctorId,
              currentDoctorName: targetDoc?.name || targetDoctorId,
            }
          : p
      )
    );
    setSelectedPatient(null);
    setTargetDoctorId("");
    setReassignReason("");
  };

  const columns = [
    { header: t("supervision.colPatientCode"), accessor: "code" as const },
    { header: t("supervision.colFacility"), accessor: "facility" as const },
    { header: t("supervision.colCurrentDoctor"), accessor: "currentDoctorName" as const },
    {
      header: t("supervision.colAction"),
      render: (row: PatientAssignmentItem) => (
        <Button
          variant="outline"
          size="sm"
          testID={`btn-reassign-${row.code}`}
          onClick={() => {
            setSelectedPatient(row);
            setTargetDoctorId("");
          }}
        >
          {t("supervision.btnReassign")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-association-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("supervision.associationTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("supervision.associationSubtitle")}
        </p>
      </div>

      <Card className="p-4">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-association-notice">
            {t("supervision.emptyAssociation")}
          </div>
        ) : (
          <DataTable data={patients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[450px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-3">
              {t("supervision.modalReassignTitle", { code: selectedPatient.code })}
            </h2>
            <form onSubmit={handleConfirmReassign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t("supervision.colCurrentDoctor")}
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedPatient.currentDoctorName}
                  className="w-full px-3 py-1.5 text-sm bg-canvas border rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t("supervision.colCurrentDoctor")} *
                </label>
                <select
                  required
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded bg-white"
                >
                  <option value="">{t("supervision.selectDoctorPlaceholder")}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.facility})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t("supervision.reassignReasonLabel")}
                </label>
                <textarea
                  required
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder={t("supervision.reassignReasonPlaceholder")}
                  className="w-full px-3 py-1.5 text-sm border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                  {tCommon("actions.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="sm" testID="confirm-reassign-btn">
                  {t("supervision.btnConfirmTransfer")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
