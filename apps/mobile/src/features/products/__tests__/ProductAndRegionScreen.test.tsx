/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ProductScreen from "../../../../app/u-product";
import RegionFilterScreen from "../../../../app/u-region";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({
    productId: "ref-plumpy",
    productName: "Plumpy'Nut",
    personId: "p-01",
    name: "Amina",
    region: "Ouest",
  }),
}));

describe("M15 & M16: Product and Region Filter Screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("u-product (M15)", () => {
    it("renders product composition and equivalents in order", () => {
      const { getByText, getAllByText, getByTestId } = render(<ProductScreen />);
      expect(getAllByText("Plumpy'Nut").length).toBeGreaterThanOrEqual(1);
      expect(getByText("520–550 kcal")).toBeTruthy();
      expect(getByText("Aliments locaux équivalents")).toBeTruthy();

      expect(getByTestId("equivalent-item-1")).toBeTruthy();
      expect(getByText("Graines de courge")).toBeTruthy();
      expect(getByText("Sésame")).toBeTruthy();
      expect(getByText("Arachide")).toBeTruthy();
      expect(getByText("Soja")).toBeTruthy();
    });

    it("navigates to u-food when tapping Arachide", () => {
      const { getByTestId } = render(<ProductScreen />);
      fireEvent.press(getByTestId("equivalent-item-3"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-food",
        params: expect.objectContaining({ foodName: "Arachide" }),
      });
    });

    it("navigates to nutrients filter when tapping Nutriments pill", () => {
      const { getByTestId } = render(<ProductScreen />);
      fireEvent.press(getByTestId("btn-nutrients-filter"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-nutrients",
        params: expect.objectContaining({ productName: "Plumpy'Nut" }),
      });
    });

    it("navigates to region filter when tapping Toutes régions", () => {
      const { getByTestId } = render(<ProductScreen />);
      fireEvent.press(getByTestId("btn-region-filter"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-region",
        params: expect.objectContaining({ productName: "Plumpy'Nut" }),
      });
    });
  });

  describe("u-region (M16)", () => {
    it("renders region filter active and shows available items in Ouest", () => {
      const { getByText, getByTestId } = render(<RegionFilterScreen />);
      expect(getByText("Ouest uniquement ✕")).toBeTruthy();
      expect(getByText("Changer ▾")).toBeTruthy();
      expect(getByTestId("region-item-1")).toBeTruthy();
      expect(getByText("Niébé")).toBeTruthy();
      expect(getByText("2/3")).toBeTruthy();
    });

    it("removes region filter when pressing Ouest uniquement ✕", () => {
      const { getByTestId } = render(<RegionFilterScreen />);
      fireEvent.press(getByTestId("btn-remove-region-filter"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-product",
        params: expect.objectContaining({ region: "Ouest" }),
      });
    });

    it("navigates to empty state when changing region to Extrême-Nord", () => {
      const { getByTestId } = render(<RegionFilterScreen />);
      fireEvent.press(getByTestId("btn-change-region"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-empty",
        params: expect.objectContaining({ region: "Extrême-Nord" }),
      });
    });
  });
});

