import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  listPendingPatients,
  listPendingStaff,
  listActiveDoctors,
  promoteSuperCaregiver,
  type PendingPatient,
  type PendingStaffUser,
  type DoctorUser,
} from "../../api/persons";
import { PendingPatientsTable } from "./PendingPatientsTable";
import { PendingStaffTable } from "./PendingStaffTable";

export const SupervisionValidationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"patients" | "staff" | "promotion">("patients");
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [pendingStaff, setPendingStaff] = useState<PendingStaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Promote staff state
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
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

  const fetchDoctors = async () => {
    try {
      const data = await listActiveDoctors();
      setDoctors(data);
      if (data.length > 0 && !promoteUserId) {
        setPromoteUserId(data[0].id);
      }
    } catch {
      // offline / fallback
    }
  };

  useEffect(() => {
    void fetchPatients();
    void fetchStaff();
    void fetchDoctors();
  }, []);

  const handlePromoteSuperCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteUserId) return;
    try {
      await promoteSuperCaregiver(promoteUserId);
      const selected = doctors.find((d) => d.id === promoteUserId);
      setPromoteStatusMsg(
        `Le Dr ${selected?.name || promoteUserId} a été promu avec succès au rang de Super-Soignant.`
      );
      await fetchDoctors();
    } catch {
      setPromoteStatusMsg("Erreur lors de la promotion du praticien.");
    }
  };

  return (
    <div className="space-y-6" data-testid="supervision-validation-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Supervision & Validations</h1>
        <p className="text-xs text-text-secondary mt-1">
          Gouvernance globale : validation des enfants, familles, agents de terrain et praticiens.
        </p>
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
        <Card className="p-5 max-w-2xl">
          <h2 className="text-base font-bold text-text-primary mb-2">
            Nommer un nouveau Super-Soignant (Coordinateur Clinique)
          </h2>
          <p className="text-xs text-text-secondary mb-4">
            Sélectionnez un praticien soignant actif pour lui déléguer le rôle de supervision,
            d'attribution des patients et d'approbation du personnel.
          </p>

          <form onSubmit={handlePromoteSuperCaregiver} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Sélectionner le praticien :
              </label>
              <select
                required
                value={promoteUserId}
                onChange={(e) => setPromoteUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded focus:border-primary bg-white"
                data-testid="promote-caregiver-select"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} ({d.facility}) {d.is_super_caregiver ? "⭐ (Déjà Super-Soignant)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" size="sm" testID="promote-caregiver-btn">
                Nommer Super-Soignant
              </Button>
            </div>
          </form>

          {promoteStatusMsg && (
            <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-800">
              {promoteStatusMsg}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
