import React from "react";
import { useTranslation } from "react-i18next";
import { Notice } from "../../components/Notice";
import { Button } from "../../components/Button";

export interface PendingAccountNoticeProps {
  onBackToLogin: () => void;
}

export const PendingAccountNotice: React.FC<PendingAccountNoticeProps> = ({ onBackToLogin }) => {
  const { t } = useTranslation("auth");

  return (
    <div className="space-y-4 text-left" data-testid="pending-account-notice">
      <Notice variant="info">
        <h4 className="font-bold text-sm mb-1 text-primary">{t("login.notices.pendingTitle")}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("login.notices.pendingRegistration")}
        </p>
      </Notice>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onBackToLogin}
        testID="back-to-login-btn"
      >
        {t("login.notices.backToLogin")}
      </Button>
    </div>
  );
};
