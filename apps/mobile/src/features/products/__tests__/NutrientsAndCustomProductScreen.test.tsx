/* eslint-env jest */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import NutrientsScreen from "../../../../app/u-nutrients";
import AddProductScreen from "../../../../app/u-addproduct";
import MyProductEquivalentsScreen from "../../../../app/u-myproduct-eq";
import * as productsService from "../productsService";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({
    productId: "my-farine",
    productName: "Farine infantile enrichie",
    personId: "p-01",
    name: "Amina",
    region: "Ouest",
  }),
}));

describe("M19, M24 & M25: Nutrients and Custom Product Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("u-nutrients (M19)", () => {
    it("renders all checkboxes and allows toggling", () => {
      const { getByText, getByTestId } = render(<NutrientsScreen />);
      expect(getByText("Nutriments à retrouver dans les aliments locaux :")).toBeTruthy();
      expect(getByText("Énergie")).toBeTruthy();
      expect(getByText("Protéines")).toBeTruthy();

      const checkboxEnergy = getByTestId("checkbox-Énergie");
      fireEvent.press(checkboxEnergy);

      fireEvent.press(getByTestId("btn-reset-default"));
      fireEvent.press(getByTestId("btn-apply"));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-product",
        params: expect.objectContaining({ nutrients: "Protéines,Lipides,Fer" }),
      });
    });
  });

  describe("u-addproduct (M24)", () => {
    it("renders form, toggles units and validates", async () => {
      jest.spyOn(productsService, "createCustomProduct").mockResolvedValue({
        data: {
          id: "cp-new-1",
          name: "Farine infantile enrichie",
          type: "custom",
          base: "100g",
          status: "private",
          nutrients: [],
          essential_nutrients: [],
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      });

      const { getByText, getAllByText, getByTestId } = render(<AddProductScreen />);
      expect(getByText("Nom du produit")).toBeTruthy();
      expect(getByText("Composition pour 100 g (étiquette)")).toBeTruthy();

      // Test unit cycling
      const unitToggle = getByTestId("unit-toggle-protein");
      fireEvent.press(unitToggle);
      expect(getAllByText("mg ▾").length).toBeGreaterThanOrEqual(2);

      // Submit form
      fireEvent.press(getByTestId("btn-see-equivalents"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/u-myproduct-eq",
          params: expect.objectContaining({
            productName: "Farine infantile enrichie",
          }),
        });
      });
    });
  });

  describe("u-myproduct-eq (M25)", () => {
    it("renders custom product with verification badge and equivalent foods", () => {
      const { getByText, getByTestId } = render(<MyProductEquivalentsScreen />);
      expect(getByText("Farine infantile enrichie")).toBeTruthy();
      expect(getByText("Privé · en vérification")).toBeTruthy();
      expect(getByText("Nutriments : protéines, fer, calcium")).toBeTruthy();

      expect(getByTestId("my-eq-item-1")).toBeTruthy();
      expect(getByText("Niébé")).toBeTruthy();
      expect(getByText("Feuilles de moringa")).toBeTruthy();
      expect(getByTestId("btn-give-myproduct")).toBeTruthy();
    });
  });
});

