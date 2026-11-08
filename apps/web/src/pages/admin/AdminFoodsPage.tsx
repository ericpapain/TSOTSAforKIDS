import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Notice } from "../../components/Notice";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminFoodsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { batches, validateBatch, currentUser, setCurrentUser } = useAdminStore();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const nutrientMappings = [
    { source: "Protein, proteins, protéines", target: "protéines (g)" },
    { source: "Fat, lipids, matières grasses", target: "lipides (g)" },
    { source: "Iron, Fe", target: "fer (mg)" },
    { source: "Calcium, Ca", target: "calcium (mg)" },
    { source: "Energy, énergie (kJ ou kcal)", target: "énergie (kcal)" },
  ];

  const handleValidateBatchClick = (batchId: string): void => {
    const result = validateBatch(batchId, currentUser);
    if (!result.success) {
      setFeedback({ type: "error", message: result.error || "Validation refusée." });
    } else {
      setFeedback({ type: "success", message: `Lot ${batchId} validé avec succès par ${currentUser} et publié !` });
    }
  };

  return (
    <div
      data-testid="admin-foods-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">Base aliments (extraite d'ORKG)</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="!bg-admin hover:!bg-slate-800"
            onClick={() => navigate("/base-aliments/import")}
            testID="btn-import-file"
          >
            Importer un fichier
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/base-aliments/nouveau")}
            testID="btn-manual-food"
          >
            Saisie manuelle
          </Button>
        </div>
      </div>

      {/* Switcher de compte pour simuler la 2e relecture */}
      <div className="bg-surface-2 p-3 rounded-[6px] border border-border flex items-center justify-between text-14">
        <span className="text-text-muted">
          Compte connecté pour la relecture : <strong className="text-text">{currentUser}</strong>
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
            Connecté : Fidel (auteur)
          </button>
          <button
            type="button"
            data-testid="switch-user-team"
            onClick={() => setCurrentUser("Équipe TSOTSA")}
            className={`px-3 py-1 rounded text-12 font-bold ${
              currentUser === "Équipe TSOTSA" ? "bg-admin text-white" : "bg-white text-text border"
            }`}
          >
            Connecté : Équipe TSOTSA (2ᵉ lecteur)
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
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
        <table className="w-full text-left border-collapse" data-testid="batches-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[91px]">Lot</th>
              <th className="px-4 py-2 w-[445px]">Source</th>
              <th className="px-4 py-2 w-[160px]">Saisi par</th>
              <th className="px-4 py-2 w-[114px]">Lignes</th>
              <th className="px-4 py-2 w-[325px]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch, index) => (
              <tr
                key={batch.id}
                data-testid={`batch-row-${batch.id}`}
                className={`h-[51px] text-16 border-t border-border ${
                  index % 2 === 0 ? "bg-surface-2" : "bg-white"
                }`}
              >
                <td className="px-4 py-2 font-bold text-text">{batch.lotNumber}</td>
                <td className="px-4 py-2 text-text-muted">{batch.source}</td>
                <td className="px-4 py-2 text-text">{batch.submittedBy}</td>
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
                      {batch.statusLabel}
                    </span>
                    {batch.status === "pending_review" && (
                      <button
                        type="button"
                        data-testid={`btn-validate-batch-${batch.id}`}
                        onClick={() => handleValidateBatchClick(batch.id)}
                        className="px-3 py-1 bg-primary text-white rounded text-12 font-bold hover:bg-emerald-700"
                      >
                        Valider la 2ᵉ relecture
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes inférieures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card testID="controls-card" className="p-6">
          <h2 className="text-21 font-bold text-text mb-4">Contrôles avant validation</h2>
          <div className="flex flex-col gap-3">
            {[
              "Nutriments reconnus",
              "Unités harmonisées (pour 100 g)",
              "Valeurs hors limites",
              "Doublons",
              "Source renseignée (ORKG + article)",
            ].map((item) => (
              <div key={item} className="flex justify-between items-center py-1">
                <span className="text-16 text-text">{item}</span>
                <span className="text-17 font-bold text-text">—</span>
              </div>
            ))}
          </div>
        </Card>

        <Card testID="dictionary-card" className="p-6">
          <h2 className="text-21 font-bold text-text mb-4">Dictionnaire des nutriments</h2>
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

