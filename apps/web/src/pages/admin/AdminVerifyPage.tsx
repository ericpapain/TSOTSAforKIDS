import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminVerifyPage(): React.JSX.Element {
  const {
    caregivers,
    userProducts,
    approveCaregiver,
    rejectCaregiver,
    approveUserProduct,
  } = useAdminStore();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleValidateCaregiver = (id: string, name: string): void => {
    approveCaregiver(id);
    setFeedback(`Le soignant ${name} a été validé et notifié avec succès.`);
  };

  const handleRejectCaregiver = (id: string, name: string): void => {
    rejectCaregiver(id);
    setFeedback(`La demande pour ${name} a été refusée.`);
  };

  const handleValidateProduct = (id: string, name: string): void => {
    approveUserProduct(id);
    setFeedback(`Le produit "${name}" a été validé et rendu public.`);
  };

  return (
    <div
      data-testid="admin-verify-page"
      className="p-[29px] max-w-[1200px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">Vérifications</h1>

      {feedback && (
        <Notice variant="success" testID="verify-feedback">
          {feedback}
        </Notice>
      )}

      {/* Section Soignants */}
      <section className="flex flex-col gap-3">
        <h2 className="text-21 font-bold text-care">Soignants en attente</h2>
        {caregivers.length === 0 ? (
          <p className="text-16 text-text-muted italic bg-white p-6 rounded-[9px] border border-border">
            Aucun soignant en attente de vérification.
          </p>
        ) : (
          caregivers.map((cg) => (
            <Card
              key={cg.id}
              testID={`caregiver-card-${cg.id}`}
              className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <h3 className="text-19 font-bold text-text">
                  {cg.name} · {cg.specialty} · {cg.facility}
                </h3>
                <p className="text-16 text-text-muted">
                  Carte professionnelle (PDF) {cg.hasLicensePdf ? "✓" : "—"} ·
                  Numéro d'ordre [{cg.orderNumberStatus}] · Inscrit le {cg.registeredAt}
                </p>
                <p className="text-14 italic text-text-muted">
                  {cg.facilityScopeNotice}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  testID={`btn-validate-caregiver-${cg.id}`}
                  onClick={() => handleValidateCaregiver(cg.id, cg.name)}
                >
                  Valider
                </Button>
                <Button
                  variant="outline"
                  className="!text-danger !border-danger hover:!bg-danger-50"
                  testID={`btn-reject-caregiver-${cg.id}`}
                  onClick={() => handleRejectCaregiver(cg.id, cg.name)}
                >
                  Refuser
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* Section Produits */}
      <section className="flex flex-col gap-3 mt-4">
        <h2 className="text-21 font-bold text-warning">
          Produits ajoutés par les utilisateurs
        </h2>
        {userProducts.length === 0 ? (
          <p className="text-16 text-text-muted italic bg-white p-6 rounded-[9px] border border-border">
            Aucun produit utilisateur en attente de validation.
          </p>
        ) : (
          userProducts.map((p) => (
            <Card
              key={p.id}
              testID={`user-product-card-${p.id}`}
              className="p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h3 className="text-19 font-bold text-text">
                  {p.name} · {p.category}
                </h3>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    variant="primary"
                    testID={`btn-validate-product-${p.id}`}
                    onClick={() => handleValidateProduct(p.id, p.name)}
                  >
                    Valider et rendre public
                  </Button>
                  <Button
                    variant="outline"
                    testID={`btn-keep-private-${p.id}`}
                    onClick={() => setFeedback(`Produit "${p.name}" conservé en privé.`)}
                  >
                    Garder privé / corriger
                  </Button>
                </div>
              </div>

              {/* Nutriments */}
              <div className="flex flex-wrap gap-6 text-14 text-text py-2">
                <span>Énergie : {p.energyKcal} kcal</span>
                <span>Protéines : {p.proteinG} g</span>
                <span>Lipides : {p.lipidG} g</span>
                <span>Fer : {p.ironMg} mg</span>
                <span>Calcium : {p.calciumMg} mg</span>
              </div>

              {/* Contrôles */}
              <p className="text-16 font-bold text-primary">
                Contrôles automatiques : unités{" "}
                {p.controls.units ? "✓" : "✕"} valeurs plausibles{" "}
                {p.controls.plausible ? "✓" : "✕"} photo de l'étiquette{" "}
                {p.controls.labelPhoto ? "✓" : "✕"}
              </p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

export default AdminVerifyPage;

