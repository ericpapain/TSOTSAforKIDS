import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SoonScreen from "../../../../app/u-soon";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

describe("SoonScreen (M07)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders overlay, title, description and action buttons", () => {
    const { getByText, getByTestId } = render(<SoonScreen />);

    expect(getByText("Bonjour")).toBeTruthy();
    expect(getByText("Bientôt disponible")).toBeTruthy();
    expect(
      getByText("Le suivi de la tension artérielle arrive dans une prochaine version.")
    ).toBeTruthy();
    expect(getByTestId("btn-soon-notify")).toBeTruthy();
    expect(getByTestId("btn-soon-close")).toBeTruthy();
  });

  it("navigates back to u-modules on clicking 'Me prévenir'", () => {
    const { getByTestId } = render(<SoonScreen />);

    fireEvent.press(getByTestId("btn-soon-notify"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
  });

  it("navigates back to u-modules on clicking 'Fermer'", () => {
    const { getByTestId } = render(<SoonScreen />);

    fireEvent.press(getByTestId("btn-soon-close"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
  });
});
