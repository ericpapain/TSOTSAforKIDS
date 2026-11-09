import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../../../../app/u-profile";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    personId: "person-123",
    name: "Amina",
  }),
}));

jest.mock("../personsService", () => ({
  getFamilyMember: jest.fn().mockResolvedValue({
    id: "person-123",
    first_name: "Amina",
    sex: "F",
    birth_date: "2024-12-12",
  }),
  calculateAgeLabel: jest.fn().mockReturnValue("1 an 11 mois"),
}));

describe("ProfileScreen (M11)", () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders profile card, status, appointment and action buttons conform to M11", async () => {
    const { getByText, getByTestId, getAllByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getAllByText("Amina").length).toBeGreaterThan(0);
      expect(getByText("Démo")).toBeTruthy();
      expect(getByText("Fille · 1 an 11 mois")).toBeTruthy();
      expect(getByText("À surveiller")).toBeTruthy();
      expect(getByText("Dernière visite : 29/10 · 7,9 kg")).toBeTruthy();
      expect(getByText("Prochain rendez-vous : 12 novembre")).toBeTruthy();
    });

    expect(getByText("Donner un produit")).toBeTruthy();
    expect(getByText("Mes prises")).toBeTruthy();
    expect(getByText("Rappels : 08:00 · 12:30 · 18:00")).toBeTruthy();

    expect(getByTestId("btn-give-product")).toBeTruthy();
    expect(getByTestId("btn-history")).toBeTruthy();
    expect(getByTestId("btn-schedule")).toBeTruthy();
    expect(getByTestId("btn-back")).toBeTruthy();
    expect(getByTestId("btn-notif")).toBeTruthy();
  });

  it("navigates to u-choose when clicking 'Donner un produit'", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("btn-give-product"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/u-choose",
      })
    );
  });

  it("navigates to u-history when clicking 'Mes prises'", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("btn-history"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/u-history",
      })
    );
  });

  it("navigates to u-schedule when clicking 'Rappels'", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("btn-schedule"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/u-schedule",
      })
    );
  });

  it("navigates to u-persons when clicking back arrow", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("btn-back"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-persons");
  });

  it("navigates to u-notif-center when clicking bell icon", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("btn-notif"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-notif-center");
  });
});
