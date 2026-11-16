import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PersonsScreen from "../../../../app/u-persons";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock("../personsService", () => ({
  fetchFamilyMembers: jest.fn().mockResolvedValue([
    {
      id: "amina-123",
      first_name: "Amina",
      sex: "F",
      birth_date: "2024-12-12",
      facility_name: "CMA de démo",
    },
    {
      id: "myself-456",
      first_name: "Moi-même",
      sex: "M",
      birth_date: "1990-01-01",
    },
  ]),
  calculateAgeLabel: jest.fn().mockReturnValue("1 an 11 mois"),
}));

describe("PersonsScreen (M08)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders screen elements conform to M08 specification", async () => {
    const { getByText, getByTestId } = render(<PersonsScreen />);

    expect(getByText("Nutrition")).toBeTruthy();
    expect(getByText("Pour qui ?")).toBeTruthy();
    expect(getByText("Ajouter une personne")).toBeTruthy();
    expect(getByText("Explorer les produits sans profil  ›")).toBeTruthy();
    expect(
      getByText("Ajoutez les membres de votre famille : pas besoin de leur créer un compte.")
    ).toBeTruthy();

    await waitFor(() => {
      expect(getByText(/Amina/)).toBeTruthy();
      expect(getByText(/Suivi\(e\) par CMA de démo/)).toBeTruthy();
      expect(getByText(/Moi-même/)).toBeTruthy();
    });

    expect(getByTestId("app-bar-back-button")).toBeTruthy();
  });

  it("navigates to u-profile when clicking a person card", async () => {
    const { getByTestId } = render(<PersonsScreen />);

    await waitFor(() => {
      expect(getByTestId("card-person-amina-123")).toBeTruthy();
    });

    fireEvent.press(getByTestId("card-person-amina-123"));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/u-profile",
      params: { personId: "amina-123", name: "Amina" },
    });
  });

  it("navigates to u-addperson when clicking 'Ajouter une personne'", () => {
    const { getByTestId } = render(<PersonsScreen />);

    fireEvent.press(getByTestId("btn-add-person"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-addperson");
  });

  it("navigates to u-choose when clicking 'Explorer les produits sans profil'", () => {
    const { getByTestId } = render(<PersonsScreen />);

    fireEvent.press(getByTestId("btn-explore-no-profile"));
    expect(mockRouter.push).toHaveBeenCalledWith("/u-choose");
  });

  it("navigates back to u-modules when clicking back button", () => {
    const { getByTestId } = render(<PersonsScreen />);

    fireEvent.press(getByTestId("app-bar-back-button"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
  });
});
