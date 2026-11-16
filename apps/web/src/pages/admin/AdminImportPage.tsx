import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";
import { ImportValidationStep } from "./ImportValidationStep";

export function AdminImportPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const { t: tErrors } = useTranslation("errors");
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "fr";
  const navigate = useNavigate();
  const {
    checkItems,
    columnMapping,
    updateColumnMapping,
    fixCheckItem,
    addImportedFoodBatch,
    validateBatch,
    currentUser,
    setCurrentUser,
  } = useAdminStore();

  useEffect(() => {
    document.title = t("import.pageTitle");
  }, [t, i18n.language]);

  const [currentStep, setCurrentStep] = useState<number>(3);
  const [isEditingColumns, setIsEditingColumns] = useState<boolean>(false);
  const [newTargetCol, setNewTargetCol] = useState<string>("lipides");
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [validationErrorCode, setValidationErrorCode] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const validCount = checkItems.filter((i) => i.status === "valid").length;
  const errorCount = checkItems.filter((i) => i.status === "error").length;
  const warningCount = checkItems.filter((i) => i.status === "warning").length;

  const handleFixColumn = (): void => {
    updateColumnMapping("Fat (g)", newTargetCol);
    fixCheckItem(2, { valeur: "19,9", status: "valid", code: "VALID", message: "✓ valide" });
    setIsEditingColumns(false);
  };

  const handleImportValidLines = (): void => {
    const batch = addImportedFoodBatch("Arachide, Niébé, Soja", "lot_ouest_novembre.xlsx", "Fidel");
    setCreatedBatchId(batch.id);
    setCurrentStep(4);
  };

  const handleSecondReaderValidation = (): void => {
    if (!createdBatchId) return;
    const res = validateBatch(createdBatchId, currentUser);
    if (!res.success) {
      setValidationErrorCode(res.errorCode || "ERR_GENERIC");
    } else {
      setValidationErrorCode(null);
      setIsPublished(true);
    }
  };

  const formatCellValue = (val: string): string => {
    const num = Number(val.replace(",", "."));
    return !Number.isNaN(num) && val.trim() !== "—" ? formatNumber(num, locale) : val;
  };

  const mappedFieldLabel = (key: string): string =>
    t(`import.mappedFields.${key}` as never);

  return (
    <div data-testid="admin-import-page" className="p-[29px] max-w-[1400px] flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">{t("import.title")}</h1>
        <a href="#gabarit" data-testid="link-download-template" className="text-16 font-bold text-admin text-right hover:underline">
          {t("import.downloadTemplateLink")}
        </a>
      </div>

      {/* 4 Étapes Wizard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { num: 1, label: t("import.steps.step1"), active: currentStep === 1, done: currentStep > 1 },
          { num: 2, label: t("import.steps.step2"), active: currentStep === 2, done: currentStep > 2 },
          { num: 3, label: t("import.steps.step3"), active: currentStep === 3, done: currentStep > 3 },
          { num: 4, label: t("import.steps.step4"), active: currentStep === 4, done: isPublished },
        ].map((step) => (
          <div
            key={step.num}
            data-testid={`step-indicator-${step.num}`}
            className={`h-[46px] rounded-[7px] flex items-center justify-center text-16 font-bold ${
              step.active ? "bg-admin text-white" : step.done ? "bg-admin-50 text-admin" : "bg-white border border-border text-text-muted"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      {validationErrorCode && (
        <Notice variant="warning" testID="validation-error-notice">
          {tErrors(`import.batch.${validationErrorCode}` as never)}
        </Notice>
      )}

      {isPublished && (
        <Notice variant="success" testID="publish-success-notice">
          {t("import.publishSuccessNotice")}
        </Notice>
      )}

      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card testID="file-info-card" className="p-5 flex flex-col gap-3">
              <div>
                <h3 className="text-17 font-bold text-text">{t("import.fileCardTitle")}</h3>
                {/* eslint-disable i18next/no-literal-string -- Technical file name */}
                <p className="text-14 text-text-muted">
                  lot_ouest_novembre.xlsx<br />
                  {t("import.fileCardSub")}
                </p>
                {/* eslint-enable i18next/no-literal-string */}
              </div>
              <div>
                <h3 className="text-16 font-bold text-text">{t("import.columnMappingTitle")}</h3>
                {/* eslint-disable i18next/no-literal-string -- Expected CSV/Excel column header names are technical format */}
                <p className="text-13 text-text-muted">
                  Food → {mappedFieldLabel(columnMapping.Food || "aliment")} · Protein (g) → {mappedFieldLabel(columnMapping["Protein (g)"] || "protéines")}<br />
                  Fe (mg) → {mappedFieldLabel(columnMapping["Fe (mg)"] || "fer")} · Ca (mg) → {mappedFieldLabel(columnMapping["Ca (mg)"] || "calcium")}
                </p>
                {/* eslint-enable i18next/no-literal-string */}
              </div>
              <Button variant="outline" testID="btn-correct-columns" onClick={() => setIsEditingColumns(!isEditingColumns)} className="text-14">
                {isEditingColumns ? t("import.closeEditBtn") : t("import.correctMappingBtn")}
              </Button>
              {isEditingColumns && (
                <div className="p-3 bg-surface-2 rounded-[6px] border border-border flex flex-col gap-2 mt-1">
                  <label className="text-13 font-bold text-text">{t("import.mapFatLabel")}</label>
                  <select
                    data-testid="select-column-mapping"
                    value={newTargetCol}
                    onChange={(e) => setNewTargetCol(e.target.value)}
                    className="h-[36px] px-2 bg-white border border-border rounded text-14"
                  >
                    <option value="lipides">{t("import.mappedFields.lipides")}</option>
                    <option value="energie">{t("import.mappedFields.energie")}</option>
                  </select>
                  <Button variant="primary" className="!bg-admin text-13 h-[36px]" testID="btn-apply-column-fix" onClick={handleFixColumn}>
                    {t("import.applyFixBtn")}
                  </Button>
                </div>
              )}
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <span data-testid="badge-valid-count" className="px-4 py-2 bg-primary-50 text-primary font-bold text-16 rounded-full">
                {t("import.validCountBadge", { count: validCount })}
              </span>
              <span data-testid="badge-error-count" className="px-4 py-2 bg-danger-50 text-danger font-bold text-16 rounded-full">
                {t("import.errorCountBadge", { count: errorCount })}
              </span>
              <span data-testid="badge-warning-count" className="px-4 py-2 bg-warning-50 text-warning font-bold text-16 rounded-full">
                {t("import.warningCountBadge", { count: warningCount })}
              </span>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
              <table className="w-full text-left border-collapse" data-testid="import-checks-table">
                <thead>
                  <tr className="bg-admin text-white text-14 font-bold h-[41px]">
                    <th className="px-3 py-2 w-[171px]">{t("import.tableCols.food")}</th>
                    <th className="px-3 py-2 w-[137px]">{t("import.tableCols.nutrient")}</th>
                    <th className="px-3 py-2 w-[86px]">{t("import.tableCols.value")}</th>
                    <th className="px-3 py-2 w-[74px]">{t("import.tableCols.unit")}</th>
                    <th className="px-3 py-2 w-[285px]">{t("import.tableCols.check")}</th>
                  </tr>
                </thead>
                <tbody>
                  {checkItems.map((item, index) => {
                    const isErr = item.status === "error";
                    const isWarn = item.status === "warning";
                    const rowBg = isErr ? "bg-danger-50" : isWarn ? "bg-warning-50" : index % 2 === 0 ? "bg-surface-2" : "bg-white";
                    const textCl = isErr ? "text-danger font-bold" : isWarn ? "text-warning font-bold" : "text-primary font-bold";
                    return (
                      <tr key={`${item.aliment}-${item.nutriment}-${index}`} data-testid={`import-row-${index}`} className={`h-[43px] text-14 border-t border-border ${rowBg}`}>
                        <td className="px-3 py-2 font-normal text-text">{t(`foodNew.foodNames.${item.aliment}` as never)}</td>
                        <td className="px-3 py-2 font-normal text-text">{t(`foodNew.nutrientNames.${item.nutriment}` as never)}</td>
                        <td className="px-3 py-2 font-normal text-text">{formatCellValue(item.valeur)}</td>
                        <td className="px-3 py-2 font-normal text-text">{item.unite}</td>
                        <td className={`px-3 py-2 ${textCl}`}>
                          {item.code ? tErrors(`import.rowChecks.${item.code}` as never) : item.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-16 text-text-muted">
              {t("import.footnote")}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Button variant="outline" testID="btn-correct-file" onClick={() => navigate("/base-aliments")}>
                {t("import.correctFileBtn")}
              </Button>
              <Button variant="primary" className="!bg-admin hover:!bg-slate-800" testID="btn-import-valid-lines" onClick={handleImportValidLines}>
                {t("import.importValidBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <ImportValidationStep
          currentUser={currentUser}
          isPublished={isPublished}
          onSelectUser={setCurrentUser}
          onPublish={handleSecondReaderValidation}
          onBackToFoods={() => navigate("/base-aliments")}
          onViewUserSide={() => navigate("/nutrition/produits/plumpy-nut")}
        />
      )}
    </div>
  );
}

export default AdminImportPage;
