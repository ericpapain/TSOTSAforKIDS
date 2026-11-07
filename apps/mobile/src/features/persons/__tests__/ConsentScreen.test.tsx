import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ConsentScreen from "../../../../app/u-consent";
import { submitConsent } from "../personsService";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    personId: "amina-123",
    name: "Amina",
  }),
}));

jest.mock("../personsService", () => ({
  submitConsent: jest.fn().mockResolvedValue({ success: true }),
}));

describe("ConsentScreen (M10)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 3 bullets, checkbox, full text link and accept button", () => {
    const { getByText, getByTestId } = render(<ConsentScreen />);

    expect(getByText("Votre accord")).toBeTruthy();
    expect(getByText("Les informations d'Amina servent à suivre sa nutrition.")).toBeTruthy();
    expect(getByText("Seul son soignant les voit.")).toBeTruthy();
    expect(getByText("Vous pouvez retirer votre accord à tout moment.")).toBeTruthy();
    expect(getByText("J'ai lu et j'accepte pour Amina")).toBeTruthy();
    expect(getByText("Lire le texte complet")).toBeTruthy();
    expect(getByText("J'accepte")).toBeTruthy();

    expect(getByTestId("checkbox-consent")).toBeTruthy();
    expect(getByTestId("link-full-text")).toBeTruthy();
    expect(getByTestId("btn-accept")).toBeTruthy();
  });

  it("toggling checkbox enables and disables accept button", () => {
    const { getByTestId } = render(<ConsentScreen />);

    const checkbox = getByTestId("checkbox-consent");
    const acceptBtn = getByTestId("btn-accept");

    // Initially checked
    expect(acceptBtn.props.accessibilityState?.disabled).toBeFalsy();

    // Toggle to uncheck
    fireEvent.press(checkbox);
    expect(acceptBtn.props.accessibilityState?.disabled).toBe(true);

    // Toggle back to check
    fireEvent.press(checkbox);
    expect(acceptBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("submits consent and navigates to u-profile on accept button press", async () => {
    const { getByTestId } = render(<ConsentScreen />);

    fireEvent.press(getByTestId("btn-accept"));

    await waitFor(() => {
      expect(submitConsent).toHaveBeenCalledWith("amina-123");
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/u-profile",
          params: { personId: "amina-123", name: "Amina" },
        })
      );
    });
  });

  it("navigates back when pressing back arrow", () => {
    const { getByTestId } = render(<ConsentScreen />);

    fireEvent.press(getByTestId("btn-back"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
