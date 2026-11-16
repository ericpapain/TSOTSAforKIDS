import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";
import type { CaregiverPending, UserProductPending } from "../../features/admin/types";

function formatShortDayMonth(dateStr: string, locale: SupportedLocale): string {
  const parts = dateStr.split("/");
  if (parts.length !== 2) return dateStr;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const utcDate = new Date(Date.UTC(2026, month - 1, day, 12, 0, 0));
  return formatDate(utcDate, locale, { day: "2-digit", month: "2-digit" });
}

export function AdminVerifyPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const locale: SupportedLocale = i18n.language === "en" ? "en" : "fr";
  const {
    caregivers,
    userProducts,
    approveCaregiver,
    rejectCaregiver,
    approveUserProduct,
  } = useAdminStore();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("verify.pageTitle");
  }, [t]);

  const handleValidateCaregiver = (id: string, name: string): void => {
    approveCaregiver(id);
    setFeedback(t("verify.feedback.caregiverApproved", { name }));
  };

  const handleRejectCaregiver = (id: string, name: string): void => {
    rejectCaregiver(id);
    setFeedback(t("verify.feedback.caregiverRejected", { name }));
  };

  const handleValidateProduct = (id: string, name: string): void => {
    approveUserProduct(id);
    setFeedback(t("verify.feedback.productApproved", { name }));
  };

  const getCaregiverFields = (cg: CaregiverPending) => ({
    specialty: cg.specialty === "pédiatre" ? t("verify.data.pediatrician") : cg.specialty,
    facility: cg.facility === "CMA de démo" ? t("verify.data.demoFacility") : cg.facility,
    status: cg.orderNumberStatus === "à contrôler" ? t("verify.data.toCheck") : cg.orderNumberStatus,
    notice:
      cg.facilityScopeNotice === "Accès donné uniquement aux personnes de son établissement."
        ? t("verify.data.scopeNotice")
        : cg.facilityScopeNotice,
  });

  const getProductFields = (p: UserProductPending) => ({
    name: p.name === "Farine infantile enrichie" ? t("verify.data.fortifiedFlour") : p.name,
    category:
      p.category === "ajouté par un compte utilisateur"
        ? t("verify.data.addedByUser")
        : p.category,
  });

  return (
    <div
      data-testid="admin-verify-page"
      className="p-[29px] max-w-[1200px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">{t("verify.title")}</h1>

      {feedback && (
        <Notice variant="success" testID="verify-feedback">
          {feedback}
        </Notice>
      )}

      {/* Section Soignants */}
      <section className="flex flex-col gap-3">
        <h2 className="text-21 font-bold text-care">{t("verify.pendingCaregiversTitle")}</h2>
        {caregivers.length === 0 ? (
          <p className="text-16 text-text-muted italic bg-white p-6 rounded-[9px] border border-border">
            {t("verify.emptyCaregivers")}
          </p>
        ) : (
          caregivers.map((cg) => {
            const cgLoc = getCaregiverFields(cg);
            return (
              <Card
                key={cg.id}
                testID={`caregiver-card-${cg.id}`}
                className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-19 font-bold text-text">
                    {`${cg.name} · ${cgLoc.specialty} · ${cgLoc.facility}`}
                  </h3>
                  <p className="text-16 text-text-muted">
                    {t("verify.licenseAndOrder", {
                      pdf: cg.hasLicensePdf ? "✓" : "—",
                      status: cgLoc.status,
                      date: formatShortDayMonth(cg.registeredAt, locale),
                    })}
                  </p>
                  <p className="text-14 italic text-text-muted">
                    {cgLoc.notice}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="primary"
                    testID={`btn-validate-caregiver-${cg.id}`}
                    onClick={() => handleValidateCaregiver(cg.id, cg.name)}
                  >
                    {t("verify.validateBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    className="!text-danger !border-danger hover:!bg-danger-50"
                    testID={`btn-reject-caregiver-${cg.id}`}
                    onClick={() => handleRejectCaregiver(cg.id, cg.name)}
                  >
                    {t("verify.rejectBtn")}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </section>

      {/* Section Produits */}
      <section className="flex flex-col gap-3 mt-4">
        <h2 className="text-21 font-bold text-warning">
          {t("verify.userProductsTitle")}
        </h2>
        {userProducts.length === 0 ? (
          <p className="text-16 text-text-muted italic bg-white p-6 rounded-[9px] border border-border">
            {t("verify.emptyProducts")}
          </p>
        ) : (
          userProducts.map((p) => {
            const pLoc = getProductFields(p);
            return (
              <Card
                key={p.id}
                testID={`user-product-card-${p.id}`}
                className="p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <h3 className="text-19 font-bold text-text">
                    {`${pLoc.name} · ${pLoc.category}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Button
                      variant="primary"
                      testID={`btn-validate-product-${p.id}`}
                      onClick={() => handleValidateProduct(p.id, pLoc.name)}
                    >
                      {t("verify.validatePublicBtn")}
                    </Button>
                    <Button
                      variant="outline"
                      testID={`btn-keep-private-${p.id}`}
                      onClick={() =>
                        setFeedback(t("verify.feedback.productKeptPrivate", { name: pLoc.name }))
                      }
                    >
                      {t("verify.keepPrivateBtn")}
                    </Button>
                  </div>
                </div>

                {/* Nutriments */}
                <div className="flex flex-wrap gap-6 text-14 text-text py-2">
                  <span>{t("verify.nutrients.energy", { val: formatNumber(p.energyKcal, locale) })}</span>
                  <span>{t("verify.nutrients.proteins", { val: formatNumber(p.proteinG, locale) })}</span>
                  <span>{t("verify.nutrients.lipids", { val: formatNumber(p.lipidG, locale) })}</span>
                  <span>{t("verify.nutrients.iron", { val: formatNumber(p.ironMg, locale) })}</span>
                  <span>{t("verify.nutrients.calcium", { val: formatNumber(p.calciumMg, locale) })}</span>
                </div>

                {/* Contrôles */}
                <p className="text-16 font-bold text-primary">
                  {t("verify.autoControls", {
                    units: p.controls.units ? "✓" : "✕",
                    plausible: p.controls.plausible ? "✓" : "✕",
                    photo: p.controls.labelPhoto ? "✓" : "✕",
                  })}
                </p>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}

export default AdminVerifyPage;

