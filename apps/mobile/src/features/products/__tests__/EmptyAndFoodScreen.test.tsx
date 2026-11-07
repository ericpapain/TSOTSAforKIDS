/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EmptyEquivalentsScreen from "../../../../app/u-empty";
import FoodDetailScreen from "../../../../app/u-food";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({
    productId: "ref-plumpy",
    productName: "Plumpy'Nut",
    foodId: "food-arachide",
    foodName: "Arachide",
    personId: "p-01",
    name: "Amina",
    region: "Extrême-Nord",
  }),
}));

describe("M17 & M18: Empty and Food Detail Screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("u-empty (M17)", () => {
    it("renders empty state notice for region without data", () => {
      const { getByText, getByTestId } = render(<EmptyEquivalentsScreen />);
      expect(
        getByText("Aucun aliment local n'est encore renseigné pour cette région.")
      ).toBeTruthy();
      expect(getByText("Extrême-Nord uniquement ✕")).toBeTruthy();
      expect(getByTestId("btn-show-all-regions")).toBeTruthy();
    });

    it("returns to all regions on button press", () => {
      const { getByTestId } = render(<EmptyEquivalentsScreen />);
      fireEvent.press(getByTestId("btn-show-all-regions"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-product",
        params: expect.objectContaining({ region: "Ouest" }),
      });
    });
  });

  describe("u-food (M18)", () => {
    it("renders comparison table between Plumpy'Nut and Arachide", () => {
      const { getByText, getAllByText } = render(<FoodDetailScreen />);
      expect(getAllByText("Arachide").length).toBeGreaterThanOrEqual(1);
      expect(getByText("Graine crue · pour 100 g")).toBeTruthy();
      expect(getByText("3/3 nutriments")).toBeTruthy();
      expect(getByText("Protéines ★")).toBeTruthy();
      expect(getByText("25,8 g")).toBeTruthy();
      expect(getByText("Lipides ★")).toBeTruthy();
      expect(getByText("49,2 g")).toBeTruthy();
      expect(getByText("Fer ★")).toBeTruthy();
      expect(getByText("4,6 mg")).toBeTruthy();
      expect(getByText("★ nutriment essentiel recherché")).toBeTruthy();
    });

    it("renders medical notice and source", () => {
      const { getByText } = render(<FoodDetailScreen />);
      expect(
        getByText(
          "Équivalence nutritionnelle indicative. Ne remplace pas un traitement prescrit : demandez l'avis de votre soignant."
        )
      ).toBeTruthy();
    });

    it("navigates to u-give on Donner à Amina", () => {
      const { getByTestId } = render(<FoodDetailScreen />);
      fireEvent.press(getByTestId("btn-give-food"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-give",
        params: {
          productName: "Arachide",
          personId: "p-01",
          name: "Amina",
        },
      });
    });
  });
});

