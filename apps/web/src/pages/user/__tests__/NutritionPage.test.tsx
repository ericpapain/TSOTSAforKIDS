import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NutritionPage } from "../NutritionPage";
import { userStore } from "../../../features/user/userStore";

describe("NutritionPage (W01)", () => {
  beforeEach(() => {
    localStorage.clear();
    userStore.reset();
  });

  const renderNutritionPage = () => {
    return render(
      <BrowserRouter>
        <NutritionPage />
      </BrowserRouter>
    );
  };

  it("affiche l'en-tête utilisateur et les deux cartes principales", () => {
    renderNutritionPage();

    expect(screen.getByText(/Espace utilisateur \(web\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Espace Famille/i)).toBeInTheDocument();

    expect(screen.getByTestId("product-card")).toBeInTheDocument();
    expect(screen.getByTestId("equivalents-card")).toBeInTheDocument();
    expect(screen.getByText("Plumpy'Nut ▾")).toBeInTheDocument();
    expect(screen.getByText("Aliments locaux équivalents")).toBeInTheDocument();
  });

  it("affiche la composition nutritionnelle exacte du produit de référence", () => {
    renderNutritionPage();

    expect(screen.getByText("520 – 550 kcal")).toBeInTheDocument();
    expect(screen.getByText("Protéines ★")).toBeInTheDocument();
    expect(screen.getByText("Lipides ★")).toBeInTheDocument();
    expect(screen.getByText("Fer ★")).toBeInTheDocument();
    expect(screen.getByText("10 – 14 mg")).toBeInTheDocument();
    expect(screen.getByText("Coût : prix non renseigné pour l'Ouest")).toBeInTheDocument();
    expect(
      screen.getByText(/Équivalence nutritionnelle indicative/i)
    ).toBeInTheDocument();
  });

  it("affiche les 7 aliments locaux classés dans l'ordre de l'algorithme", () => {
    renderNutritionPage();

    const expectedFoods = [
      "Graines de courge",
      "Sésame",
      "Arachide",
      "Soja",
      "Niébé",
      "Lait entier en poudre",
      "Feuilles de moringa",
    ];

    expectedFoods.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    // header row + 7 food rows = 8 rows
    expect(rows.length).toBe(8);
  });

  it("filtre les aliments locaux selon la région choisie parmi les 10 régions du Cameroun", () => {
    renderNutritionPage();

    const filterBtn = screen.getByTestId("region-filter-btn");
    expect(filterBtn).toHaveTextContent("Toutes régions ▾");

    // Open dropdown and select Region Ouest
    fireEvent.click(filterBtn);
    expect(screen.getByTestId("region-dropdown-menu")).toBeInTheDocument();
    expect(screen.getByTestId("region-option-adamaoua")).toBeInTheDocument();
    expect(screen.getByTestId("region-option-centre")).toBeInTheDocument();
    expect(screen.getByTestId("region-option-far-north")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("region-option-west"));
    expect(filterBtn).toHaveTextContent("Région Ouest ▾");

    // Sésame and Lait entier en poudre are NOT available in Ouest (marked —)
    expect(screen.queryByText("Sésame")).not.toBeInTheDocument();
    expect(screen.queryByText("Lait entier en poudre")).not.toBeInTheDocument();

    // Graines de courge, Arachide, Soja, Niébé, Feuilles de moringa are available
    expect(screen.getByText("Graines de courge")).toBeInTheDocument();
    expect(screen.getByText("Arachide")).toBeInTheDocument();
    expect(screen.getByText("Soja")).toBeInTheDocument();
    expect(screen.getByText("Niébé")).toBeInTheDocument();
    expect(screen.getByText("Feuilles de moringa")).toBeInTheDocument();

    // Open dropdown and switch back to Toutes régions
    fireEvent.click(filterBtn);
    fireEvent.click(screen.getByTestId("region-option-all"));
    expect(filterBtn).toHaveTextContent("Toutes régions ▾");
    expect(screen.getByText("Sésame")).toBeInTheDocument();
  });

  it("ouvre le dialogue de détail d'un aliment lors du clic sur Arachide", () => {
    renderNutritionPage();

    const arachideLink = screen.getByText("Arachide");
    fireEvent.click(arachideLink);

    // Modal opens
    const modalTitle = screen.getByRole("heading", { name: "Arachide" });
    expect(modalTitle).toBeInTheDocument();
    expect(screen.getByText(/Rang #3/i)).toBeInTheDocument();
    expect(screen.getByText(/567 kcal/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByTestId("modal-close-btn");
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("déclenche l'action du bouton Version mobile", () => {
    vi.useFakeTimers();
    renderNutritionPage();

    const mobileBtn = screen.getByTestId("mobile-version-btn");
    act(() => {
      fireEvent.click(mobileBtn);
    });

    expect(screen.getByTestId("mobile-toast")).toHaveTextContent(
      "Redirection vers la version mobile..."
    );

    act(() => {
      vi.runAllTimers();
    });
    vi.useRealTimers();
  });

  it("ouvre le menu déroulant des produits et permet de changer de produit", () => {
    renderNutritionPage();

    const selector = screen.getByTestId("product-selector");
    expect(selector).toHaveTextContent("Plumpy'Nut");
    expect(screen.queryByTestId("product-dropdown-menu")).not.toBeInTheDocument();

    // Open dropdown
    fireEvent.click(selector);
    expect(screen.getByTestId("product-dropdown-menu")).toBeInTheDocument();
    expect(screen.getByTestId("product-option-plumpy-sup")).toBeInTheDocument();
    expect(screen.getByTestId("product-option-f-75")).toBeInTheDocument();
    expect(screen.getByTestId("product-option-f-100")).toBeInTheDocument();
    expect(screen.getByTestId("product-option-farine-infantile-enrichie")).toBeInTheDocument();

    // Select F-75
    fireEvent.click(screen.getByTestId("product-option-f-75"));
    expect(screen.queryByTestId("product-dropdown-menu")).not.toBeInTheDocument();
    expect(selector).toHaveTextContent("F-75");
    expect(screen.getByText("75 kcal")).toBeInTheDocument();
  });

  it("affiche le bouton Déconnexion dans l'en-tête et permet de se déconnecter", () => {
    renderNutritionPage();

    const logoutBtn = screen.getByTestId("header-logout-btn");
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveTextContent("Déconnexion");
    fireEvent.click(logoutBtn);
  });

  it("ouvre la modale Confirmer la prise (Donner à Hamadou) et enregistre la prise", () => {
    userStore.addChild({
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
      validationStatus: "validated",
    });
    renderNutritionPage();

    const giveBtn = screen.getByTestId("give-product-btn");
    expect(giveBtn).toHaveTextContent("Donner à Hamadou");
    fireEvent.click(giveBtn);

    expect(screen.getByTestId("confirm-intake-modal")).toBeInTheDocument();
    expect(screen.getByText("Confirmer la prise")).toBeInTheDocument();

    // Increment quantity
    fireEvent.click(screen.getByTestId("qty-plus-btn"));
    expect(screen.getByTestId("qty-display")).toHaveTextContent("2 sachets");

    // Submit confirmation
    fireEvent.click(screen.getByTestId("confirm-intake-submit-btn"));
    expect(screen.getByTestId("intake-recorded-view")).toBeInTheDocument();
    expect(screen.getByText("Prise enregistrée")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId("return-to-person-btn"));
    expect(screen.queryByTestId("confirm-intake-modal")).not.toBeInTheDocument();
  });
});
