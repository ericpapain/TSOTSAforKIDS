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
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(t("login.notices.passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      setErrorMessage(t("login.notices.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const apiClient = getWebApiClient();
      const body: Record<string, unknown> = {
        email,
        password,
        role: role === "user" ? "parent" : role,
        first_name: firstName,
        last_name: lastName,
        region_id: regionCode,
        locality: locality.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      if (role === "caregiver") {
        body.facility_id = facilityId || undefined;
        body.speciality = specialty;
        body.order_number = orderNumber.trim() || undefined;
      } else if (role === "field_agent") {
        body.structure_name = organization.trim() || undefined;
      }

      const res = await apiClient.client.POST("/v1/auth/email/register", {
        body: body as never,
      });

      if (res.error) {
        setErrorMessage(
          (res.error as { detail?: string })?.detail || t("login.notices.invalidCredentials")
        );
        setIsLoading(false);
        return;
      }

      if (res.data) {
        if (role === "caregiver" || role === "field_agent") {
          onRegisteredPending();
        } else {
          // Active parent account: log in automatically
          const loginRes = await apiClient.client.POST("/v1/auth/email/login", {
            body: { email, password },
          });
          if (loginRes.data) {
            const data = loginRes.data;
            const newSession: UserSession = {
              id: data.user.id,
              userId: data.user.id,
              email,
              phone: phone || undefined,
              role: "parent",
              status: "active",
              permissions: ["patients.register"],
              name: `${firstName} ${lastName}`.trim(),
            };
            setSession(newSession, data.access_token, data.refresh_token);
            navigate("/famille", { replace: true });
          } else {
            navigate("/connexion", { replace: true });
          }
        }
      }
    } catch {
      setErrorMessage(t("login.notices.invalidCredentials"));
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
