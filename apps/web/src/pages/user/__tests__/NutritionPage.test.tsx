import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NutritionPage } from "../NutritionPage";

describe("NutritionPage (W01)", () => {
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
    expect(screen.getByText(/Compte démo · Amina/i)).toBeInTheDocument();

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

  it("filtre les aliments locaux selon la région Ouest", () => {
    renderNutritionPage();

    const filterBtn = screen.getByTestId("region-filter-btn");
    expect(filterBtn).toHaveTextContent("Toutes régions ▾");

    // Click filter to switch to Region Ouest
    fireEvent.click(filterBtn);
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

    // Click again to toggle back
    fireEvent.click(filterBtn);
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
});
