import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { useAuth } from "../../api/authContext";

export const FieldAgentProfilePage: React.FC = () => {
  const { t } = useTranslation("common");
  const { session } = useAuth();

  return (
    <div className="space-y-6 max-w-[600px] text-left" data-testid="field-agent-profile-page">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("fieldAgent.profileTitle")}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {t("fieldAgent.profileSubtitle")}
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase">
            {t("fieldAgent.profileFullName")}
          </span>
          <p className="text-sm font-bold text-text-primary">{session?.name || "—"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase">
            {t("fieldAgent.profileEmail")}
          </span>
          <p className="text-sm font-bold text-text-primary">{session?.email || "—"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase">
            {t("fieldAgent.profilePhone")}
          </span>
          <p className="text-sm font-bold text-text-primary">{session?.phone || "—"}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase">
            {t("fieldAgent.profileRole")}
          </span>
          <p className="text-sm font-bold text-primary">{t("fieldAgent.profileRoleValue")}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase">
            {t("fieldAgent.profileOrg")}
          </span>
          <p className="text-sm text-text-secondary">
            {session?.orgName || t("fieldAgent.profileOrgDefault")}
          </p>
        </div>
      </Card>
    </div>
  );
};
