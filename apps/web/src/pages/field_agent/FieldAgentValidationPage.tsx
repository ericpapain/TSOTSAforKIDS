import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";

interface PendingPatientItem {
  id: string;
  code: string;
  firstName: string;
  age: string;
  region: string;
  locality?: string;
  registeredAt: string;
  status: "pending" | "validated" | "refused";
}

export const FieldAgentValidationPage: React.FC = () => {
  const { t } = useTranslation("common");

  const [patients, setPatients] = useState<PendingPatientItem[]>([]);
  const [selectedForReject, setSelectedForReject] = useState<PendingPatientItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: "validated" } : p))
    );
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReject) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === selectedForReject.id ? { ...p, status: "refused" } : p))
    );
    setSelectedForReject(null);
    setRejectReason("");
  };

  const columns = [
    {
      header: t("dev.catalog.colId"),
      accessor: "code" as const,
    },
    {
      header: t("fieldAgent.childFirstName"),
      accessor: "firstName" as const,
    },
    {
      header: t("fieldAgent.colRegion"),
      render: (row: PendingPatientItem) => `${row.region} ${row.locality ? `(${row.locality})` : ""}`,
    },
    {
      header: t("fieldAgent.colDate"),
      accessor: "registeredAt" as const,
    },
    {
      header: t("fieldAgent.colPatientStatus"),
      render: (row: PendingPatientItem) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            row.status === "validated"
              ? "bg-green-100 text-green-800"
              : row.status === "refused"
              ? "bg-red-100 text-red-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.status === "validated"
            ? t("fieldAgent.statusValidatedOnSite")
            : row.status === "refused"
            ? t("fieldAgent.statusRefused")
            : t("fieldAgent.statusPending")}
        </span>
      ),
    },
    {
      header: t("actions.save"),
      render: (row: PendingPatientItem) => {
        if (row.status !== "pending") return <span className="text-xs text-text-muted">—</span>;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(row.id)}
              testID={`approve-patient-${row.id}`}
            >
              {t("fieldAgent.statusValidatedOnSite")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForReject(row)}
              testID={`reject-patient-${row.id}`}
            >
              {t("fieldAgent.statusRefused")}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="field-agent-validation-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("fieldAgent.validationTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("fieldAgent.validationSubtitle")}
        </p>
      </div>

      <Card className="p-4">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-validation-notice">
            {t("fieldAgent.emptyValidation")}
          </div>
        ) : (
          <DataTable data={patients} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {selectedForReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[420px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-2">
              {t("fieldAgent.rejectPatientModalTitle", { code: selectedForReject.code })}
            </h2>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t("fieldAgent.rejectReasonLabel")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("fieldAgent.rejectReasonPlaceholder")}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedForReject(null);
                    setRejectReason("");
                  }}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="sm" testID="confirm-reject-btn">
                  {t("fieldAgent.statusRefused")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
