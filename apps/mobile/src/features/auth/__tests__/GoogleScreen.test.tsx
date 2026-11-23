import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import GoogleAuthScreen from "../../../../app/u-google";
import * as authService from "../authService";

process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-client-id";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      data: { idToken: "test-token" },
      idToken: "test-token",
    })),
  },
}));

describe("GoogleAuthScreen (M02)", () => {
  it("renders Google account chooser according to M02 specification", () => {
    const { getByText, getByTestId } = render(<GoogleAuthScreen />);

    expect(getByText("Choisir un compte")).toBeTruthy();
    expect(getByText("pour continuer vers TSOTSA for Kids")).toBeTruthy();
    expect(getByText("Se connecter avec Google")).toBeTruthy();
    expect(getByText("Compte Google personnel")).toBeTruthy();
    expect(getByText("Je suis soignant ›")).toBeTruthy();
    expect(
      getByText("Google partagera votre nom, votre adresse e-mail et votre photo avec TSOTSA for Kids.")
    ).toBeTruthy();
    expect(getByTestId("btn-google-account-demo")).toBeTruthy();
  });

  it("authenticates and navigates to modules when selecting demo account", async () => {
    const router = useRouter();
    jest.spyOn(authService, "authenticateWithGoogle").mockResolvedValue({
      success: true,
      role: "user",
    });

    const { getByTestId } = render(<GoogleAuthScreen />);
    fireEvent.press(getByTestId("btn-google-account-demo"));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/u-modules");
    });
  });

  it("navigates to pending screen if caregiver logs in via Google", async () => {
    const router = useRouter();
    jest.spyOn(authService, "authenticateWithGoogle").mockResolvedValue({
      success: true,
      role: "caregiver",
    });

    const { getByTestId } = render(<GoogleAuthScreen />);
    fireEvent.press(getByTestId("btn-google-account-demo"));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/s-pending");
    });
  });

  it("displays error message if authentication fails", async () => {
    jest.spyOn(authService, "authenticateWithGoogle").mockResolvedValue({
      success: false,
      error: "Jeton Google invalide.",
    });

    const { getByTestId, getByText } = render(<GoogleAuthScreen />);
    fireEvent.press(getByTestId("btn-google-account-demo"));

    await waitFor(() => {
      expect(getByText("Jeton Google invalide.")).toBeTruthy();
    });
  });

  it("navigates to caregiver screen when clicking caregiver link", () => {
    const router = useRouter();
    const { getByTestId } = render(<GoogleAuthScreen />);

    fireEvent.press(getByTestId("btn-google-caregiver"));
    expect(router.push).toHaveBeenCalledWith("/s-pending");
  });

  it("dismisses modal when backdrop is pressed", () => {
    const router = useRouter();
    const { getByTestId } = render(<GoogleAuthScreen />);

    fireEvent.press(getByTestId("btn-google-dismiss"));
    expect(router.replace).toHaveBeenCalledWith("/u-welcome");
  });
});

