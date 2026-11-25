import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "../../../i18n/setup";
import { FamilyPersonsPage } from "../FamilyPersonsPage";
import { IntakeHistoryPage } from "../IntakeHistoryPage";
import { CustomProductPage } from "../CustomProductPage";
import { UserSettingsPage } from "../UserSettingsPage";
import { userStore } from "../../../features/user/userStore";

describe("User Portal Mobile-to-Web Features", () => {
  beforeEach(() => {
    localStorage.clear();
    userStore.reset();
  });

  const seedChildren = () => {
    userStore.setChildren([
      {
        id: "child-amina",
        code: "#A-014",
        firstName: "Amina",
        birthDate: "2024-05-10",
        sex: "F",
        relation: "mother",
        weightKg: 8.4,
        heightCm: 72,
        muacMm: 120,
        edema: "none",
        status: "MAS",
        facilityName: "CMA de démo",
        hasConsent: true,
        validationStatus: "validated",
        doctorName: "Dr. Sarah Ngo",
      },
      {
        id: "child-hamadou",
        code: "#H-007",
        firstName: "Hamadou",
        birthDate: "2022-09-15",
        sex: "M",
        relation: "father",
        weightKg: 14.2,
        heightCm: 98,
        muacMm: 145,
        edema: "none",
        status: "normal",
        facilityName: "Hôpital de District",
        hasConsent: true,
        validationStatus: "validated",
        doctorName: "Dr. Sarah Ngo",
      },
    ]);
  };

  it("affiche un état vierge et accueillant pour une nouvelle famille sans enfant", () => {
    render(
      <BrowserRouter>
        <FamilyPersonsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId("family-empty-state")).toBeInTheDocument();
    expect(screen.getByText("Aucun enfant enregistré")).toBeInTheDocument();
    expect(screen.getByTestId("add-first-child-btn")).toBeInTheDocument();
  });

  it("affiche la liste des enfants suivis avec leurs statuts nutritionnels", () => {
    seedChildren();
    render(
      <BrowserRouter>
        <FamilyPersonsPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Amina")).toBeInTheDocument();
    expect(screen.getByText("Hamadou")).toBeInTheDocument();
    expect(screen.getByText("MAS")).toBeInTheDocument();
  });

  it("permet d'ajouter un nouvel enfant avec le consentement légal (M09 + M10)", async () => {
    render(
      <BrowserRouter>
        <FamilyPersonsPage />
      </BrowserRouter>
    );

    const addBtn = screen.getByTestId("add-child-top-btn");
    fireEvent.click(addBtn);

    expect(screen.getByTestId("add-child-modal")).toBeInTheDocument();

    const nameInput = screen.getByTestId("child-firstname-input");
    fireEvent.change(nameInput, { target: { value: "Fatima" } });

    const nextBtn = screen.getByTestId("child-next-step-btn");
    fireEvent.click(nextBtn);

    expect(screen.getByTestId("child-consent-checkbox")).toBeInTheDocument();

    const consentCheckbox = screen.getByTestId("child-consent-checkbox");
    fireEvent.click(consentCheckbox);

    const submitBtn = screen.getByTestId("child-submit-consent-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("add-child-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Fatima")).toBeInTheDocument();
  });

  it("ouvre la fiche profil détaillée d'un enfant (M11)", () => {
    seedChildren();
    render(
      <BrowserRouter>
        <FamilyPersonsPage />
      </BrowserRouter>
    );

    const profileBtn = screen.getByTestId("view-profile-btn-child-amina");
    fireEvent.click(profileBtn);

    expect(screen.getByTestId("child-profile-modal")).toBeInTheDocument();
    expect(screen.getByText(/Centre rattaché/i)).toBeInTheDocument();
    expect(screen.getByText(/Tuteur principal/i)).toBeInTheDocument();
  });

  it("permet d'inviter un second parent légal via la modale dédiée", () => {
    seedChildren();
    render(
      <BrowserRouter>
        <FamilyPersonsPage />
      </BrowserRouter>
    );

    const inviteBtn = screen.getByTestId("invite-parent-btn-child-amina");
    fireEvent.click(inviteBtn);

    expect(screen.getByTestId("invite-parent-modal")).toBeInTheDocument();

    const input = screen.getByTestId("invite-parent-contact-input");
    fireEvent.change(input, { target: { value: "+237699112233" } });

    const sendBtn = screen.getByTestId("invite-parent-submit-btn");
    fireEvent.click(sendBtn);

    expect(screen.getByText(/Invitation envoyée/i)).toBeInTheDocument();
  });

  it("affiche le journal chronologique des prises nutritionnelles", () => {
    userStore.addIntake({
      childId: "child-amina",
      childName: "Amina",
      foodName: "Plumpy'Nut",
      quantity: 1,
      unit: "sachet",
      time: "08:00",
      date: "Aujourd'hui",
      consumption: "all",
      status: "given",
    });
    userStore.addIntake({
      childId: "child-amina",
      childName: "Amina",
      foodName: "Bouillie enrichie à l'arachide",
      quantity: 1,
      unit: "portion",
      time: "12:30",
      date: "Aujourd'hui",
      consumption: "all",
      status: "given",
    });

    render(
      <BrowserRouter>
        <IntakeHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Plumpy'Nut")).toBeInTheDocument();
    expect(screen.getByText("Bouillie enrichie à l'arachide")).toBeInTheDocument();
  });

  it("permet de créer une recette ou bouillie personnalisée avec calcul d'équivalence", () => {
    render(
      <BrowserRouter>
        <CustomProductPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    const nameInput = screen.getByTestId("custom-product-name-input");
    fireEvent.change(nameInput, { target: { value: "Bouillie Soja Courge" } });

    expect(screen.getByTestId("equivalence-score-badge")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("save-custom-product-btn");
    fireEvent.click(submitBtn);
  });

  it("affiche les réglages utilisateur avec les heures calmes et préférences", () => {
    render(
      <BrowserRouter>
        <UserSettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Heures calmes/i)).toBeInTheDocument();
    expect(screen.getByTestId("reminders-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });
});
