/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ChooseProductScreen from "../../../../app/u-choose";
import DropdownScreen from "../../../../app/u-dropdown";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({ personId: "p-01", name: "Amina", region: "Ouest" }),
}));

jest.mock("../productsService", () => ({
  getUserPreferredRegion: jest.fn().mockResolvedValue("Ouest"),
  listProducts: jest.fn().mockResolvedValue([
    { id: "ref-1", name: "F-75", type: "reference", usage: "Lait thérapeutique · à l'hôpital", base: "100ml", status: "validated" },
    { id: "ref-2", name: "Plumpy'Nut", type: "reference", usage: "Pâte prête à l'emploi (ATPE)", base: "100g", status: "validated" },
    { id: "cust-1", name: "Farine infantile enrichie", type: "custom", base: "100g", status: "private" },
  ]),
}));

describe("M12 & M13: Choose and Dropdown Screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("u-choose (M12)", () => {
    it("renders person pill, region pill and empty state", () => {
      const { getByText, getAllByText, getByTestId } = render(<ChooseProductScreen />);
      expect(getByText("Pour : Amina")).toBeTruthy();
      expect(getByText("Ma région : Ouest")).toBeTruthy();
      expect(getAllByText("Choisir un produit").length).toBeGreaterThanOrEqual(1);
      expect(
        getByText("Choisissez un produit pour voir sa composition et les aliments locaux équivalents.")
      ).toBeTruthy();
      expect(getByTestId("btn-add-product")).toBeTruthy();
    });

    it("navigates to u-dropdown when clicking trigger", () => {
      const { getByTestId } = render(<ChooseProductScreen />);
      fireEvent.press(getByTestId("btn-open-dropdown"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-dropdown",
        params: { personId: "p-01", name: "Amina", region: "Ouest" },
      });
    });

    it("navigates to u-addproduct when clicking + Ajouter mon produit", () => {
      const { getByTestId } = render(<ChooseProductScreen />);
      fireEvent.press(getByTestId("btn-add-product"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-addproduct",
        params: { personId: "p-01", name: "Amina", region: "Ouest" },
      });
    });
  });

  describe("u-dropdown (M13)", () => {
    it("renders reference products and custom products from API", async () => {
      const { getByText, findByText } = render(<DropdownScreen />);
      expect(getByText("PRODUITS DE RÉFÉRENCE")).toBeTruthy();
      expect(await findByText("F-75")).toBeTruthy();
      expect(await findByText("Plumpy'Nut")).toBeTruthy();
      expect(getByText("MES PRODUITS")).toBeTruthy();
      expect(await findByText("Farine infantile enrichie")).toBeTruthy();
      expect(await findByText("En vérification")).toBeTruthy();
    });

    it("navigates to F-75 when clicking F-75 item", async () => {
      const { findByTestId } = render(<DropdownScreen />);
      const item = await findByTestId("product-item-ref-1");
      fireEvent.press(item);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-f75",
        params: expect.objectContaining({ productName: "F-75" }),
      });
    });

    it("navigates to u-product when clicking Plumpy'Nut", async () => {
      const { findByTestId } = render(<DropdownScreen />);
      const item = await findByTestId("product-item-ref-2");
      fireEvent.press(item);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-product",
        params: expect.objectContaining({ productName: "Plumpy'Nut" }),
      });
    });

    it("navigates to u-myproduct-eq when clicking custom product", async () => {
      const { findByTestId } = render(<DropdownScreen />);
      const item = await findByTestId("custom-item-cust-1");
      fireEvent.press(item);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-myproduct-eq",
        params: expect.objectContaining({ productName: "Farine infantile enrichie" }),
      });
    });
  });
});

