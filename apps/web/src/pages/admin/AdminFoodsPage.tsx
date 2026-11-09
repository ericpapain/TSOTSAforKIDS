import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";
import type { FoodBatch } from "../../features/admin/types";

export function AdminFoodsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const { t: tErrors } = useTranslation("errors");
  const { batches, validateBatch, currentUser, setCurrentUser } = useAdminStore();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    document.title = t("foods.pageTitle");
  }, [t]);

  const nutrientMappings = [
    { source: "Protein, proteins, protéines", target: t("foods.dictionaryTargets.proteins") },
    { source: "Fat, lipids, matières grasses", target: t("foods.dictionaryTargets.lipids") },
    { source: "Iron, Fe", target: t("foods.dictionaryTargets.iron") },
    { source: "Calcium, Ca", target: t("foods.dictionaryTargets.calcium") },
    { source: "Energy, énergie (kJ ou kcal)", target: t("foods.dictionaryTargets.energy") },
  ];

  const displayCurrentUser =
    currentUser === "Équipe TSOTSA" ? t("nav.shortTeamName") : currentUser;

  const handleValidateBatchClick = (batchId: string): void => {
    const result = validateBatch(batchId, currentUser);
    if (!result.success) {
      const msg = result.errorCode
        ? tErrors(`import.batch.${result.errorCode}`)
        : tErrors("import.batch.ERR_GENERIC");
      setFeedback({ type: "error", message: msg });
    } else {
      setFeedback({
        type: "success",
        message: t("foods.batchPublishedFeedback", {
          batchId,
          reviewer: displayCurrentUser,
        }),
      });
    }
  };

  const getLocalizedBatch = (batch: FoodBatch) => ({
    lotNumber:
      batch.id === "lot-1"
        ? t("foods.data.lot1Num")
        : batch.id === "lot-2"
        ? t("foods.data.lot2Num")
        : batch.lotNumber,
    source:
      batch.id === "lot-1"
        ? t("foods.data.lot1Source")
        : batch.id === "lot-2"
        ? t("foods.data.lot2Source")
        : batch.source,
    submittedBy:
      batch.submittedBy === "Équipe TSOTSA"
        ? t("nav.shortTeamName")
        : batch.submittedBy,
    statusLabel:
      batch.status === "published"
        ? t("foods.data.statusPublished")
        : batch.status === "pending_review"
        ? t("foods.data.statusPendingReview")
        : t("foods.data.statusDraft"),
  });

  const controlsList = [
    t("foods.controlsList.recognizedNutrients"),
    t("foods.controlsList.harmonizedUnits"),
    t("foods.controlsList.outOfBounds"),
    t("foods.controlsList.duplicates"),
    t("foods.controlsList.sourceProvided"),
  ];

  return (
    <div
      data-testid="admin-foods-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">{t("foods.title")}</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="!bg-admin hover:!bg-slate-800"
            onClick={() => navigate("/base-aliments/import")}
            testID="btn-import-file"
          >
            {t("foods.importFileBtn")}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/base-aliments/nouveau")}
            testID="btn-manual-food"
          >
            {t("foods.manualEntryBtn")}
          </Button>
        </div>
      </div>

      {/* Switcher de compte pour simuler la 2e relecture */}
      <div className="bg-surface-2 p-3 rounded-[6px] border border-border flex items-center justify-between text-14">
        <span className="text-text-muted">
          {`${t("foods.reviewerLabel")} `}
          <strong className="text-text">{displayCurrentUser}</strong>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="switch-user-fidel"
            onClick={() => setCurrentUser("Fidel")}
            className={`px-3 py-1 rounded text-12 font-bold ${
              currentUser === "Fidel" ? "bg-admin text-white" : "bg-white text-text border"
            }`}
          >
            {t("foods.switchFidelBtn")}
          </button>
          <button
            type="button"
            data-testid="switch-user-team"
            onClick={() => setCurrentUser("Équipe TSOTSA")}
            className={`px-3 py-1 rounded text-12 font-bold ${
              currentUser === "Équipe TSOTSA" ? "bg-admin text-white" : "bg-white text-text border"
            }`}
          >
            {t("foods.switchTeamBtn")}
          </button>
        </div>
      </div>

      {feedback && (
        <Notice
          variant={feedback.type === "success" ? "success" : "warning"}
          testID="batch-feedback"
        >
          {feedback.message}
        </Notice>
      )}

      {/* Tableau des lots */}
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white" data-testid="foods-table">
        <table className="w-full text-left border-collapse" data-testid="batches-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[91px]">{t("foods.columns.lot")}</th>
              <th className="px-4 py-2 w-[445px]">{t("foods.columns.source")}</th>
              <th className="px-4 py-2 w-[160px]">{t("foods.columns.submittedBy")}</th>
              <th className="px-4 py-2 w-[114px]">{t("foods.columns.lines")}</th>
              <th className="px-4 py-2 w-[325px]">{t("foods.columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, index) => {
              const bLoc = getLocalizedBatch(batch);
              return (
                <tr
                  key={batch.id}
                  data-testid={`batch-row-${batch.id}`}
                  className={`h-[51px] text-16 border-t border-border ${
                    index % 2 === 0 ? "bg-surface-2" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-2 font-bold text-text">{bLoc.lotNumber}</td>
                  <td className="px-4 py-2 text-text-muted">{bLoc.source}</td>
                  <td className="px-4 py-2 text-text">{bLoc.submittedBy}</td>
                  <td className="px-4 py-2 text-text-muted">{batch.lineCount}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold ${
                          batch.status === "published"
                            ? "text-primary"
                            : batch.status === "pending_review"
                            ? "text-warning"
                            : "text-text-muted"
                        }`}
                      >
                        {bLoc.statusLabel}
                      </span>
                      {batch.status === "pending_review" && (
                        <button
                          type="button"
                          data-testid={`btn-validate-batch-${batch.id}`}
                          onClick={() => handleValidateBatchClick(batch.id)}
                          className="px-3 py-1 bg-primary text-white rounded text-12 font-bold hover:bg-emerald-700"
                        >
                          {t("foods.validateSecondReviewBtn")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartes inférieures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card testID="controls-card" className="p-6">
          <h2 className="text-21 font-bold text-text mb-4">{t("foods.controlsCardTitle")}</h2>
          <div className="flex flex-col gap-3">
            {controlsList.map((item) => (
              <div key={item} className="flex justify-between items-center py-1">
                <span className="text-16 text-text">{item}</span>
                <span className="text-17 font-bold text-text">{`—`}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card testID="dictionary-card" className="p-6">
          <h2 className="text-21 font-bold text-text mb-4">{t("foods.dictionaryCardTitle")}</h2>
          <div className="flex flex-col gap-3">
            {nutrientMappings.map((mapping) => (
              <div key={mapping.source} className="flex items-center justify-between py-1">
                <span className="text-14 text-text-muted">{mapping.source}</span>
                <span className="text-14 font-bold text-text">{mapping.target}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminFoodsPage;

