import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../api/authContext";
import { getWebApiClient } from "../../api/client";
import { Button } from "../../components/Button";
import { Notice } from "../../components/Notice";
import { CAMEROON_REGIONS } from "../../features/reference/cameroonRegions";
import { CaregiverRegisterFields } from "./CaregiverRegisterFields";
import type { UserRole, UserSession } from "../../types";

export interface AuthRegisterFormProps {
  role: UserRole;
  onRegisteredPending: () => void;
}

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  role,
  onRegisteredPending,
}) => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regionCode, setRegionCode] = useState("CE");
  const [locality, setLocality] = useState("");
  const [phone, setPhone] = useState("");

  // Caregiver fields
  const [facilityId, setFacilityId] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Field agent fields
  const [organization, setOrganization] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirstName || !cleanLastName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage(t("login.notices.requiredFields"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage(t("login.notices.invalidEmailFormat"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("login.notices.passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      setErrorMessage(t("login.notices.passwordTooShort"));
      return;
    }
    if (role === "field_agent" && !cleanPhone) {
      setErrorMessage("Le téléphone est obligatoire pour un agent de terrain.");
      return;
    }
    if (role === "caregiver" && (!cleanPhone || !specialty.trim() || !facilityId)) {
      setErrorMessage("Téléphone, établissement et spécialité sont obligatoires pour un soignant.");
      return;
    }

    setIsLoading(true);

    try {
      const apiClient = getWebApiClient();
      const body: Record<string, unknown> = {
        email: cleanEmail,
        password,
        role: role === "user" ? "parent" : role,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        region_id: regionCode,
        locality: locality.trim() || undefined,
        phone: cleanPhone || undefined,
      };

      if (role === "caregiver") {
        body.facility_id = facilityId || undefined;
        body.speciality = specialty.trim();
        body.order_number = orderNumber.trim() || undefined;
      } else if (role === "field_agent") {
        body.structure_name = organization.trim() || undefined;
      }

      const res = await apiClient.client.POST("/v1/auth/email/register", {
        body: body as never,
        headers: { "Content-Type": "application/json" },
      });

      if (res.error) {
        const err = res.error as Record<string, unknown>;
        const innerErr = err?.error as Record<string, unknown> | undefined;
        const errorMsg =
          (typeof err?.detail === "string" ? err.detail : null) ||
          (typeof innerErr?.message === "string" ? innerErr.message : null) ||
          (typeof err?.message === "string" ? err.message : null) ||
          t("login.notices.serverError");
        setErrorMessage(errorMsg);
        setIsLoading(false);
        return;
      }

      if (res.data) {
        if (role === "caregiver" || role === "field_agent") {
          onRegisteredPending();
        } else {
          // Active parent account: log in automatically
          const loginRes = await apiClient.client.POST("/v1/auth/email/login", {
            body: { email: cleanEmail, password },
            headers: { "Content-Type": "application/json" },
          });
          if (loginRes.data) {
            const data = loginRes.data;
            const primaryRole = (data.user.roles?.[0] as UserRole) || "parent";
            const newSession: UserSession = {
              id: data.user.id,
              userId: data.user.id,
              email: cleanEmail,
              phone: cleanPhone || undefined,
              role: primaryRole,
              status: "active",
              permissions: data.user.permissions || ["patients.register"],
              name: data.user.display_name || `${cleanFirstName} ${cleanLastName}`.trim(),
            };
            setSession(newSession, data.access_token, data.refresh_token);
            navigate("/nutrition/produits/plumpy-nut", { replace: true });
          } else {
            navigate("/connexion", { replace: true });
          }
        }
      }
    } catch {
      setErrorMessage(t("login.notices.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-left" data-testid="auth-register-form">
      {errorMessage && (
        <Notice variant="danger">
          <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
        </Notice>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.firstName")} *
          </label>
          <input
            type="text"
            required
            data-testid="register-first-name-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("login.form.firstNamePlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.lastName")} *
          </label>
          <input
            type="text"
            required
            data-testid="register-last-name-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("login.form.lastNamePlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          {t("login.form.email")} *
        </label>
        <input
          type="email"
          required
          data-testid="register-email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("login.form.emailPlaceholder")}
          className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.password")} *
          </label>
          <input
            type="password"
            required
            data-testid="register-password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.form.passwordPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.confirmPassword")} *
          </label>
          <input
            type="password"
            required
            data-testid="register-confirm-password-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("login.form.confirmPasswordPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.region")} *
          </label>
          <select
            data-testid="register-region-select"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary bg-white"
          >
            {CAMEROON_REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.locality")}
          </label>
          <input
            type="text"
            data-testid="register-locality-input"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder={t("login.form.localityPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          {t("login.form.phone")} {role !== "parent" ? "*" : ""}
        </label>
        <input
          type="tel"
          required={role !== "parent"}
          data-testid="register-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("login.form.phonePlaceholder")}
          className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
        />
      </div>

      {role === "caregiver" && (
        <CaregiverRegisterFields
          facilityId={facilityId}
          onChangeFacilityId={setFacilityId}
          specialty={specialty}
          onChangeSpecialty={setSpecialty}
          orderNumber={orderNumber}
          onChangeOrderNumber={setOrderNumber}
        />
      )}

      {role === "field_agent" && (
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            {t("login.form.organization")}
          </label>
          <input
            type="text"
            data-testid="register-organization-input"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={t("login.form.organizationPlaceholder")}
            className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full"
        testID="register-submit-btn"
        disabled={isLoading}
      >
        {isLoading ? "..." : t("login.form.submitRegister")}
      </Button>
    </form>
  );
};
