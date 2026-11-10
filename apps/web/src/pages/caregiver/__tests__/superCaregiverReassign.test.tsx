import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { FollowedPersonsPage } from "../FollowedPersonsPage";
import { PersonFilePage } from "../PersonFilePage";
import { caregiverStore } from "../../../features/caregiver/caregiverStore";
import { userStore } from "../../../features/user/userStore";
import { ChildProfileModal } from "../../user/ChildProfileModal";

describe("Super Caregiver & Doctor Assignment Features", () => {
  beforeEach(() => {
    localStorage.clear();
    caregiverStore.reset();
    userStore.reset();
  });

  it("affiche la colonne Médecin référent et la barre Super Soignant", () => {
    render(
      <BrowserRouter>
        <FollowedPersonsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId("super-caregiver-bar")).toBeInTheDocument();
    expect(screen.getByText("Super Soignant")).toBeInTheDocument();
    expect(screen.getByText("Médecin référent")).toBeInTheDocument();
    expect(screen.getAllByText("Prof. Félicité Ngeufack").length).toBeGreaterThan(0);
  });

  it("permet au Super Soignant de réattribuer un patient à un autre médecin", () => {
    render(
      <BrowserRouter>
        <FollowedPersonsPage />
      </BrowserRouter>
    );

    // Click reassign on first person (A-014 Hamadou)
    const reassignBtn = screen.getByTestId("reassign-btn-A-014");
    fireEvent.click(reassignBtn);

    expect(screen.getByTestId("reassign-doctor-modal")).toBeInTheDocument();
    expect(screen.getAllByText(/Hamadou/i).length).toBeGreaterThan(0);

    // Select target doctor (e.g. Dr. Samuel Eboule)
    const select = screen.getByTestId("target-doctor-select");
    fireEvent.change(select, { target: { value: "doc-eboule" } });

    // Enter transfer reason
    const reasonInput = screen.getByTestId("reassign-reason-input");
    fireEvent.change(reasonInput, {
      target: { value: "Transfert pour protocole nutritionnel avancé" },
    });

    // Confirm
    const confirmBtn = screen.getByTestId("confirm-reassign-btn");
    fireEvent.click(confirmBtn);

    expect(screen.queryByTestId("reassign-doctor-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("reassign-success-toast")).toBeInTheDocument();

    // Verify store state updated
    const state = caregiverStore.getState();
    const updated = state.persons.find((p) => p.id === "A-014");
    expect(updated?.assignedDoctorId).toBe("doc-eboule");
    expect(updated?.assignedDoctorName).toBe("Dr. Samuel Eboule");
  });

  it("masque les boutons de réattribution lorsque le mode Super Soignant est désactivé", () => {
    render(
      <BrowserRouter>
        <FollowedPersonsPage />
      </BrowserRouter>
    );

    const toggleBtn = screen.getByTestId("toggle-super-caregiver-btn");
    fireEvent.click(toggleBtn);

    expect(screen.queryByTestId("reassign-btn-A-014")).not.toBeInTheDocument();
  });

  it("affiche le médecin référent dans le dossier patient et permet la réattribution", () => {
    render(
      <BrowserRouter>
        <PersonFilePage />
      </BrowserRouter>
    );

    expect(screen.getByText("Médecin référent")).toBeInTheDocument();
    expect(screen.getAllByText("Prof. Félicité Ngeufack").length).toBeGreaterThan(0);

    const reassignFileBtn = screen.getByTestId("reassign-file-btn");
    fireEvent.click(reassignFileBtn);

    expect(screen.getByTestId("reassign-doctor-modal")).toBeInTheDocument();
  });

  it("affiche le médecin référent et les rapports médicaux dans la fiche de l'enfant côté famille", () => {
    const amina = userStore.getState().children.find((c) => c.firstName === "Amina")!;
    expect(amina).toBeDefined();

    render(
      <BrowserRouter>
        <ChildProfileModal
          child={amina}
          isOpen={true}
          onClose={() => {}}
          onInviteParent={() => {}}
        />
      </BrowserRouter>
    );

    expect(screen.getAllByText("Médecin référent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Prof. Félicité Ngeufack").length).toBeGreaterThan(0);
    expect(screen.getByTestId("doctor-reports-section")).toBeInTheDocument();
    expect(screen.getByText("Protocole de rattrapage nutritionnel MAM")).toBeInTheDocument();
    expect(screen.getByText(/Poids cible : 9.2 kg/i)).toBeInTheDocument();
  });

  it("associe automatiquement le médecin référent familial lors de l'ajout d'un nouvel enfant", () => {
    const newChild = userStore.addChild({
      firstName: "Salif",
      birthDate: "2024-01-15",
      sex: "M",
      relation: "father",
      weightKg: 9.1,
      heightCm: 75,
      muacMm: 122,
      edema: "none",
      status: "MAM",
      facilityName: "CMA de démo",
    });

    expect(newChild.doctorName).toBe("Prof. Félicité Ngeufack");
    expect(newChild.doctorId).toBe("doc-felicite");
    expect(newChild.doctorReports).toBeDefined();
    expect(newChild.doctorReports?.length).toBeGreaterThan(0);
  });
});
