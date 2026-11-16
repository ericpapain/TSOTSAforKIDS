import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { DataTable } from "../../components/DataTable";
import { CAMEROON_REGIONS } from "../../features/reference/cameroonRegions";

interface RegisteredFamily {
  id: string;
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: string;
  region: string;
  registeredAt: string;
  status: "validated" | "pending";
}

export const FieldAgentFamiliesPage: React.FC = () => {
  const { t } = useTranslation("common");

  const [families, setFamilies] = useState<RegisteredFamily[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childBirthDate, setChildBirthDate] = useState("");
  const [regionCode, setRegionCode] = useState("CE");

  const handleRegisterFamily = (e: React.FormEvent) => {
    e.preventDefault();
    const newFamily: RegisteredFamily = {
      id: `fam-${Date.now()}`,
      parentName: `${parentFirstName} ${parentLastName}`.trim(),
      parentPhone: parentPhone || "—",
      childName: childFirstName,
      childAge: childBirthDate,
      region: CAMEROON_REGIONS.find((r) => r.code === regionCode)?.name || regionCode,
      registeredAt: new Date().toLocaleDateString("fr-FR"),
      status: "validated", // In-person registration is immediately validated
    };
    setFamilies((prev) => [newFamily, ...prev]);
    setShowAddModal(false);
    // Reset form
    setParentFirstName("");
    setParentLastName("");
    setParentEmail("");
    setParentPhone("");
    setChildFirstName("");
    setChildBirthDate("");
  };

  const columns = [
    {
      header: t("fieldAgent.colParent"),
      accessor: "parentName" as const,
    },
    {
      header: t("fieldAgent.colPhone"),
      accessor: "parentPhone" as const,
    },
    {
      header: t("fieldAgent.colChild"),
      accessor: "childName" as const,
    },
    {
      header: t("fieldAgent.colRegion"),
      accessor: "region" as const,
    },
    {
      header: t("fieldAgent.colDate"),
      accessor: "registeredAt" as const,
    },
    {
      header: t("fieldAgent.colPatientStatus"),
      render: (row: RegisteredFamily) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            row.status === "validated" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.status === "validated" ? t("fieldAgent.statusValidatedOnSite") : t("fieldAgent.statusPending")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="field-agent-families-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("fieldAgent.familiesTitle")}</h1>
          <p className="text-xs text-text-secondary mt-1">
            {t("fieldAgent.familiesSubtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          testID="btn-open-register-family-modal"
          onClick={() => setShowAddModal(true)}
        >
          {t("fieldAgent.btnRegisterFamily")}
        </Button>
      </div>

      <Card className="p-4">
        {families.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm" data-testid="empty-families-notice">
            {t("fieldAgent.emptyFamilies")}
          </div>
        ) : (
          <DataTable data={families} columns={columns} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-[500px] p-6 relative">
            <h2 className="text-lg font-bold text-text-primary mb-4">{t("fieldAgent.modalRegisterFamilyTitle")}</h2>
            <form onSubmit={handleRegisterFamily} className="space-y-3.5 text-left">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t("fieldAgent.parentFirstName")}</label>
                  <input
                    type="text"
                    required
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t("fieldAgent.parentLastName")}</label>
                  <input
                    type="text"
                    required
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t("fieldAgent.parentEmail")}</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t("fieldAgent.parentPhone")}</label>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t("fieldAgent.region")}</label>
                  <select
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded bg-white"
                  >
                    {CAMEROON_REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">
                  {t("fieldAgent.childSection")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t("fieldAgent.childFirstName")}</label>
                    <input
                      type="text"
                      required
                      value={childFirstName}
                      onChange={(e) => setChildFirstName(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t("fieldAgent.childBirthDate")}</label>
                    <input
                      type="date"
                      required
                      value={childBirthDate}
                      onChange={(e) => setChildBirthDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="sm" testID="btn-confirm-register-family">
                  {t("fieldAgent.btnConfirmRegister")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
