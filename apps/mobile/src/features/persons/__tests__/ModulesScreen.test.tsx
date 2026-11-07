import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ModulesScreen from "../../../../app/u-modules";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

// Mock personsService
jest.mock("../personsService", () => ({
  fetchModules: jest.fn().mockResolvedValue([
    { code: "nutrition", name: "Nutrition", is_active: true },
    { code: "hta", name: "HTA", is_active: false },
    { code: "diabete", name: "Diabète", is_active: false },
  ]),
}));

describe("ModulesScreen (M06)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header, title and modules conform to M06 specification", async () => {
    const { getByText, getByTestId, getAllByText } = render(<ModulesScreen />);

    expect(getByText("Bonjour")).toBeTruthy();
    expect(getByText("Que voulez-vous suivre ?")).toBeTruthy();
    expect(getByText("Nutrition")).toBeTruthy();
    expect(getByText("Produits, aliments locaux, suivi des prises")).toBeTruthy();
    expect(getByText("HTA")).toBeTruthy();
    expect(getByText("Diabète")).toBeTruthy();
    expect(getAllByText("Bientôt")).toHaveLength(2);
    expect(getByTestId("app-bar-right-button")).toBeTruthy();
  });

  it("navigates to u-persons when Nutrition module is pressed", () => {
    const { getByTestId } = render(<ModulesScreen />);

    fireEvent.press(getByTestId("card-module-nutrition"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-persons");
  });

  it("navigates to u-soon when HTA module is pressed", () => {
    const { getByTestId } = render(<ModulesScreen />);

    fireEvent.press(getByTestId("card-module-hta"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-soon");
  });

  it("navigates to u-soon when Diabète module is pressed", () => {
    const { getByTestId } = render(<ModulesScreen />);

    fireEvent.press(getByTestId("card-module-diabete"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-soon");
  });

  it("navigates to u-offline when wifi button is pressed", () => {
    const { getByTestId } = render(<ModulesScreen />);

    fireEvent.press(getByTestId("app-bar-right-button"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-offline");
  });
});
