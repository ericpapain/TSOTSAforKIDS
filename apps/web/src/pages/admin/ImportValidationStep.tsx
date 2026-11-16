import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";

interface ImportValidationStepProps {
  currentUser: string;
  isPublished: boolean;
  onSelectUser: (user: string) => void;
  onPublish: () => void;
  onBackToFoods: () => void;
  onViewUserSide: () => void;
}

export function ImportValidationStep({
  currentUser,
  isPublished,
  onSelectUser,
  onPublish,
  onBackToFoods,
  onViewUserSide,
}: ImportValidationStepProps): React.JSX.Element {
  const { t } = useTranslation("admin");
  const displayUser =
    currentUser === "Équipe TSOTSA" ? t("nav.shortTeamName") : currentUser;

  return (
    <Card testID="validation-step-card" className="p-6 flex flex-col gap-5">
      <h2 className="text-21 font-bold text-text">
        {t("import.step4.title")}
      </h2>
      <p className="text-16 text-text-muted">
        {t("import.step4.subtitle")}
      </p>

      <div className="bg-surface-2 p-4 rounded-[6px] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-14 text-text-muted">{t("import.step4.currentReviewerLabel")}</span>
          <p className="text-16 font-bold text-text" data-testid="current-reviewer-display">
            {displayUser}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="btn-login-fidel"
            onClick={() => onSelectUser("Fidel")}
            className={`px-3 py-1.5 rounded text-13 font-bold ${
              currentUser === "Fidel" ? "bg-admin text-white" : "bg-white border text-text"
            }`}
          >
            {t("import.step4.fidelAuthorBtn")}
          </button>
          <button
            type="button"
            data-testid="btn-login-team"
            onClick={() => onSelectUser("Équipe TSOTSA")}
            className={`px-3 py-1.5 rounded text-13 font-bold ${
              currentUser === "Équipe TSOTSA" ? "bg-admin text-white" : "bg-white border text-text"
            }`}
          >
            {t("import.step4.teamSecondReaderBtn")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          className="!bg-primary hover:!bg-emerald-700"
          testID="btn-publish-lot"
          disabled={isPublished}
          onClick={onPublish}
        >
          {isPublished ? t("import.step4.publishedBtn") : t("import.step4.publishBtn")}
        </Button>
        <Button
          variant="outline"
          onClick={onBackToFoods}
          testID="btn-back-foods"
        >
          {t("import.step4.backToFoodsBtn")}
        </Button>
        {isPublished && (
          <Button
            variant="outline"
            className="!text-primary !border-primary"
            onClick={onViewUserSide}
            testID="btn-view-user-side"
          >
            {t("import.step4.viewUserSideBtn")}
          </Button>
        )}
      </div>
    </Card>
  );
}


