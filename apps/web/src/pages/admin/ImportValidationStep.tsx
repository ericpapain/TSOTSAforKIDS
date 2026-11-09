import React from "react";
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
  return (
    <Card testID="validation-step-card" className="p-6 flex flex-col gap-5">
      <h2 className="text-21 font-bold text-text">
        Étape 4 : Validation du lot par un second relecteur
      </h2>
      <p className="text-16 text-text-muted">
        Conformément aux règles de sécurité sanitaire, l'auteur du lot ne peut pas approuver sa propre saisie.
      </p>

      <div className="bg-surface-2 p-4 rounded-[6px] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-14 text-text-muted">Utilisateur actuellement connecté :</span>
          <p className="text-16 font-bold text-text" data-testid="current-reviewer-display">
            {currentUser}
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
            Fidel (Auteur)
          </button>
          <button
            type="button"
            data-testid="btn-login-team"
            onClick={() => onSelectUser("Équipe TSOTSA")}
            className={`px-3 py-1.5 rounded text-13 font-bold ${
              currentUser === "Équipe TSOTSA" ? "bg-admin text-white" : "bg-white border text-text"
            }`}
          >
            Équipe TSOTSA (Second lecteur)
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
          {isPublished ? "Lot publié avec succès" : "Valider et publier le lot"}
        </Button>
        <Button
          variant="outline"
          onClick={onBackToFoods}
          testID="btn-back-foods"
        >
          Retour à la base aliments
        </Button>
        {isPublished && (
          <Button
            variant="outline"
            className="!text-primary !border-primary"
            onClick={onViewUserSide}
            testID="btn-view-user-side"
          >
            Voir côté utilisateur ›
          </Button>
        )}
      </div>
    </Card>
  );
}

