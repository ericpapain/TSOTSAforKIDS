import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../i18n/setup";
import { useAuth } from "../api/authContext";
import { Card } from "../components/Card";
import { BrandLogo } from "../components/BrandLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { RoleSelector } from "./auth/RoleSelector";
import { AuthLoginForm } from "./auth/AuthLoginForm";
import { AuthRegisterForm } from "./auth/AuthRegisterForm";
import { PendingAccountNotice } from "./auth/PendingAccountNotice";
import type { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation("auth");
  const { logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("parent");
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPendingNotice, setShowPendingNotice] = useState(false);

  useEffect(() => {
    document.title = t("login.pageTitle");
  }, [t]);

  const handleRoleChange = (role: UserRole) => {
    logout();
    setSelectedRole(role);
    setShowPendingNotice(false);
    if (role === "admin" || role === "super_caregiver") {
      setActiveTab("login");
    }
  };

  const canRegister = selectedRole !== "admin" && selectedRole !== "super_caregiver";

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-8 font-sans relative">
      <div className="absolute top-4 right-6 bg-[#17302A] rounded-lg px-2 py-1">
        <LanguageSwitcher testID="login-language-switcher" />
      </div>

      <Card className="w-full max-w-[520px] p-6 sm:p-8 text-center shadow-lg border border-border">
        {/* Logo officiel agrandi */}
        <div className="flex justify-center mb-3">
          <BrandLogo variant="light" size={96} mode="symbol" />
        </div>

        {/* Marque officielle : TSOTSA for KIDS (Bleu Nuit #092D73 et Orange #F38B1F) */}
        <div className="flex items-baseline justify-center font-bold tracking-tight text-3xl sm:text-4xl mb-1 select-none">
          <span style={{ color: "#092D73" }}>TSOTSA</span>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <span className="mx-2" style={{ color: "#F38B1F" }}>
            for
          </span>
          <span style={{ color: "#092D73" }}>KIDS</span>
        </div>

        {/* Devise officielle : — Bien nourrir, bien suivre — */}
        <div
          className="flex items-center justify-center space-x-2 text-sm sm:text-base italic font-semibold mb-3 select-none"
          style={{ color: "#092D73" }}
        >
          <span className="w-8 sm:w-10 h-[2px] rounded" style={{ backgroundColor: "#F38B1F" }} />
          <span>{t("login.motto")}</span>
          <span className="w-8 sm:w-10 h-[2px] rounded" style={{ backgroundColor: "#F38B1F" }} />
        </div>

        <p className="text-xs text-text-secondary mb-5">{t("login.subtitle")}</p>

        <RoleSelector selectedRole={selectedRole} onSelectRole={handleRoleChange} />

        {canRegister && !showPendingNotice && (
          <div className="flex border-b border-border mb-5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "login"}
              data-testid="tab-login"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === "login"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
            >
              {t("login.tabs.login")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "register"}
              data-testid="tab-register"
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === "register"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
            >
              {t("login.tabs.register")}
            </button>
          </div>
        )}

        {showPendingNotice ? (
          <PendingAccountNotice
            onBackToLogin={() => {
              setShowPendingNotice(false);
              setActiveTab("login");
            }}
          />
        ) : activeTab === "login" || !canRegister ? (
          <AuthLoginForm
            role={selectedRole}
            onPendingDetected={() => setShowPendingNotice(true)}
          />
        ) : (
          <AuthRegisterForm
            role={selectedRole}
            onRegisteredPending={() => setShowPendingNotice(true)}
          />
        )}

        <div className="text-[11px] text-text-muted mt-6 pt-4 border-t border-border">
          {t("login.securityNote")}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
