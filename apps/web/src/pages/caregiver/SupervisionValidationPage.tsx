import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";

interface PendingStaffItem {
  id: string;
  name: string;
  email: string;
  role: "caregiver" | "field_agent";
  facilityOrOrg: string;
  specialty?: string;
  registeredAt: string;
  status: "pending" | "active" | "refused";
}

export const SupervisionValidationPage: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const { t: tCommon } = useTranslation("common");

  const [pendingList, setPendingList] = useState<PendingStaffItem[]>([]);
  const [selectedForReject, setSelectedForReject] = useState<PendingStaffItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (staffId: string) => {
    setPendingList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: "active" } : s))
    );
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReject) return;
    setPendingList((prev) =>
      prev.map((s) => (s.id === selectedForReject.id ? { ...s, status: "refused" } : s))
    );
    setSelectedForReject(null);
    setRejectReason("");
  };

  const columns = [
    { header: t("supervision.colFullName"), accessor: "name" as const },
    { header: t("supervision.colEmail"), accessor: "email" as const },
    {
      header: t("supervision.colRole"),
      render: (r: PendingStaffItem) => (r.role === "caregiver" ? t("persons.standardDoctorMode") : tCommon("fieldAgent.profileRoleValue")),
    },
    { header: t("supervision.colFacilityOrOrg"), accessor: "facilityOrOrg" as const },
    { header: t("supervision.colRegDate"), accessor: "registeredAt" as const },
    {
      header: t("supervision.colStatus"),
      render: (r: PendingStaffItem) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            r.status === "active"
              ? "bg-green-100 text-green-800"
              : r.status === "refused"
              ? "bg-red-100 text-red-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {r.status === "active" ? t("supervision.btnApprove") : r.status === "refused" ? t("supervision.btnReject") : tCommon("fieldAgent.statusPending")}
        </span>
      ),
    },
    {
      header: t("supervision.colActions"),
      render: (r: PendingStaffItem) => {
        if (r.status !== "pending") return <span className="text-xs text-text-muted">—</span>;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(r.id)}
              testID={`approve-staff-${r.id}`}
            >
              {t("supervision.btnApprove")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForReject(r)}
              testID={`reject-staff-${r.id}`}
            >
              {t("supervision.btnReject")}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="supervision-validation-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("supervision.validationTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("supervision.validationSubtitle")}
        </p>
      </div>

      <Card className="p-4">
        {pendingList.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-staff-validation-notice">
            {t("supervision.emptyValidation")}
          </div>
        ) : (
          <DataTable data={pendingList} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {selectedForReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[420px] p-6 text-left">
            <h2 className="text-base font-bold text-text-primary mb-2">
              {t("supervision.rejectModalTitle", { name: selectedForReject.name })}
            </h2>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t("supervision.rejectReasonLabel")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t("supervision.rejectReasonPlaceholder")}
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
                  {tCommon("actions.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="sm" testID="confirm-reject-staff-btn">
                  {t("supervision.btnConfirmReject")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
