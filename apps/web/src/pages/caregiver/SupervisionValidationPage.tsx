import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  listPendingPatients,
  listPendingStaff,
  promoteSuperCaregiver,
  type PendingPatient,
  type PendingStaffUser,
} from "../../api/persons";
import { PendingPatientsTable } from "./PendingPatientsTable";
import { PendingStaffTable } from "./PendingStaffTable";

export const SupervisionValidationPage: React.FC = () => {
  const { t } = useTranslation("caregiver");

  const [activeTab, setActiveTab] = useState<"patients" | "staff" | "promotion">("patients");
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [pendingStaff, setPendingStaff] = useState<PendingStaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Promote staff state
  const [promoteUserId, setPromoteUserId] = useState("");
  const [promoteStatusMsg, setPromoteStatusMsg] = useState<string | null>(null);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const data = await listPendingPatients();
      setPendingPatients(data);
    } catch {
      // offline / fallback
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const data = await listPendingStaff();
      setPendingStaff(data);
    } catch {
      // offline / fallback
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    void fetchPatients();
    void fetchStaff();
  }, []);

  const handlePromoteSuperCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteUserId.trim()) return;
    try {
      await promoteSuperCaregiver(promoteUserId.trim());
      setPromoteStatusMsg("Médecin promu avec succès au rang de Super-Soignant.");
      setPromoteUserId("");
    } catch {
      setPromoteStatusMsg("Erreur lors de la promotion du praticien.");
    }
  };

  return (
    <div className="space-y-6" data-testid="supervision-validation-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("supervision.validationTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">{t("supervision.validationSubtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("patients")}
          data-testid="tab-patients-validation"
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "patients"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Validation Enfants & Familles ({pendingPatients.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          data-testid="tab-staff-validation"
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "staff"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Personnel Soignant & Agents ({pendingStaff.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("promotion")}
          data-testid="tab-promotion"
          className={`pb-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "promotion"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Nomination Super-Soignant
        </button>
      </div>

      {activeTab === "patients" && (
        <PendingPatientsTable
          patients={pendingPatients}
          isLoading={isLoadingPatients}
          onRefresh={fetchPatients}
        />
      )}

      {activeTab === "staff" && (
        <PendingStaffTable
          staff={pendingStaff}
          isLoading={isLoadingStaff}
          onRefresh={fetchStaff}
        />
      )}

      {activeTab === "promotion" && (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-text-primary mb-3">
            Nommer un nouveau Super-Soignant (Coordinateur Clinique)
          </h2>
          <form onSubmit={handlePromoteSuperCaregiver} className="flex gap-3 items-end max-w-xl">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Identifiant ou Email du Soignant à promouvoir :
              </label>
              <input
                type="text"
                required
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                placeholder="ID ou email du soignant"
                className="w-full px-3 py-1.5 text-sm border rounded focus:border-primary"
                data-testid="promote-caregiver-input"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" testID="promote-caregiver-btn">
              Nommer Super-Soignant
            </Button>
          </form>
          {promoteStatusMsg && (
            <p className="mt-2 text-xs font-semibold text-primary">{promoteStatusMsg}</p>
          )}
        </Card>
      )}
    </div>
  );
};
