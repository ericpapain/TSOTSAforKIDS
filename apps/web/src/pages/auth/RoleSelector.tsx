import React from "react";
import { useTranslation } from "react-i18next";
import type { UserRole } from "../../types";

export interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const AVAILABLE_ROLES: UserRole[] = [
  "parent",
  "field_agent",
  "caregiver",
  "super_caregiver",
  "admin",
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  const { t } = useTranslation("auth");

  return (
    <div className="mb-6">
      <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 text-left">
        {t("login.whoAreYou")}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
        {AVAILABLE_ROLES.map((role) => {
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              type="button"
              data-testid={`role-btn-${role}`}
              onClick={() => onSelectRole(role)}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center min-h-[52px] ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-text-primary border-border hover:border-primary/50"
              }`}
            >
              <span
                data-testid={role === "parent" ? "role-btn-user" : undefined}
                className="w-full flex items-center justify-center pointer-events-auto"
              >
                {t(`login.roles.${role}`)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-text-muted mt-2 text-left italic">
        {t(`login.roleDescriptions.${selectedRole === "user" ? "parent" : selectedRole}` as never)}
      </p>
    </div>
  );
};
