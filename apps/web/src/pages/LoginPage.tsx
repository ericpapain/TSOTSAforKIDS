import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/setup";
import { useAuth } from "../api/authContext";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("caregiver");

  useEffect(() => {
    document.title = t("login.pageTitle");
  }, [t]);

  const handleQuickLogin = (role: UserRole) => {
    setSession(
      {
        id: "usr-1",
        name:
          role === "caregiver"
            ? t("login.caregiverDisplayName")
            : role === "admin"
              ? t("login.adminDisplayName")
              : t("login.userDisplayName"),
        role,
        isVerifiedCaregiver: role === "caregiver",
      },
      "token-session",
      "refresh-session"
    );

    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else if (role === "caregiver") {
      navigate("/soignant", { replace: true });
    } else if (role === "admin") {
      navigate("/", { replace: true });
    } else {
      navigate("/nutrition/produits/plumpy-nut", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 font-sans relative">
      <div className="absolute top-4 right-6 bg-[#17302A] rounded-lg px-2 py-1">
        <LanguageSwitcher testID="login-language-switcher" />
      </div>
      <Card className="w-full max-w-[420px] p-8 text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo variant="light" size={48} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">{t("login.title")}</h1>
        <p className="text-sm text-text-secondary mb-6">{t("login.subtitle")}</p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {(["user", "caregiver", "admin"] as UserRole[]).map((r) => (
              <Button
                key={r}
                variant={selectedRole === r ? (r === "user" ? "primary" : r) : "solid"}
                outline={selectedRole !== r}
                size="sm"
                testID={`role-btn-${r}`}
                onClick={() => setSelectedRole(r)}
              >
                {t(`login.roles.${r}`)}
              </Button>
            ))}
          </div>

          <Button
            variant={selectedRole === "user" ? "primary" : selectedRole}
            testID="login-submit-btn"
            className="w-full"
            onClick={() => handleQuickLogin(selectedRole)}
          >
            {t("login.submit", { role: selectedRole })}
          </Button>
        </div>

        <div className="text-xs text-text-muted">{t("login.securityNote")}</div>
      </Card>
    </div>
  );
};

export default LoginPage;
