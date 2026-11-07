/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GivenScreen from "../../../../app/u-given";

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    personName: "Amina",
    productName: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    consumption: "all",
  }),
}));

describe("GivenScreen (M21)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with confirmation title and summary text", () => {
    const { getByTestId, getByText } = render(<GivenScreen />);

    expect(getByTestId("title-given")).toBeTruthy();
    expect(getByText("Prise enregistrée")).toBeTruthy();
    expect(getByTestId("text-summary")).toBeTruthy();
    expect(
      getByText("Votre soignant est prévenu et la voit dans le suivi d'Amina.")
    ).toBeTruthy();
    expect(getByText("Retour à Amina")).toBeTruthy();
    expect(getByText("Voir côté soignant →")).toBeTruthy();
  });

  it("navigates back to person profile when Retour button is pressed", () => {
    const { getByTestId } = render(<GivenScreen />);
    const returnBtn = getByTestId("btn-back-profile");

    fireEvent.press(returnBtn);
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-profile");
  });

  it("navigates to caregiver view when caregiver button is pressed", () => {
    const { getByTestId } = render(<GivenScreen />);
    const careBtn = getByTestId("btn-view-caregiver");

    fireEvent.press(careBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/s-pending");
  });
});
