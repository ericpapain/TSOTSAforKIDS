import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import EmailAuthScreen from "../../../../app/u-email";
import * as authService from "../authService";

describe("EmailAuthScreen (M04)", () => {
  it("renders all elements according to M04 specification", () => {
    const { getByText, getByTestId } = render(<EmailAuthScreen />);

    expect(getByText("Mon e-mail")).toBeTruthy();
    expect(getByText("Se connecter")).toBeTruthy();
    expect(getByText("Créer un compte")).toBeTruthy();
    expect(getByText("Adresse e-mail")).toBeTruthy();
    expect(getByText("Mot de passe")).toBeTruthy();
    expect(getByText("8 caractères minimum")).toBeTruthy();
    expect(getByText("Mot de passe oublié ?")).toBeTruthy();
    expect(getByText("Continuer")).toBeTruthy();
    expect(getByText("Je suis soignant ›")).toBeTruthy();
    expect(
      getByText("Votre mot de passe est chiffré : personne, même notre équipe, ne peut le lire.")
    ).toBeTruthy();

    expect(getByTestId("input-email")).toBeTruthy();
    expect(getByTestId("input-password")).toBeTruthy();
    expect(getByTestId("tab-email-login")).toBeTruthy();
    expect(getByTestId("tab-email-register")).toBeTruthy();
  });

  it("submits login with valid credentials and redirects to modules", async () => {
    const router = useRouter();
    jest.spyOn(authService, "loginWithEmail").mockResolvedValue({
      success: true,
      role: "user",
    });

    const { getByTestId } = render(<EmailAuthScreen />);
    fireEvent.changeText(getByTestId("input-email"), "parent@tsotsa.org");
    fireEvent.changeText(getByTestId("input-password"), "Secret12345");
    fireEvent.press(getByTestId("btn-email-continue"));

    await waitFor(() => {
      expect(authService.loginWithEmail).toHaveBeenCalledWith("parent@tsotsa.org", "Secret12345");
      expect(router.replace).toHaveBeenCalledWith("/u-modules");
    });
  });

  it("shows error when password is too short", async () => {
    const { getByTestId, getByText } = render(<EmailAuthScreen />);
    fireEvent.changeText(getByTestId("input-email"), "test@tsotsa.org");
    fireEvent.changeText(getByTestId("input-password"), "short");
    fireEvent.press(getByTestId("btn-email-continue"));

    await waitFor(() => {
      expect(getByText("Le mot de passe doit comporter au moins 8 caractères.")).toBeTruthy();
    });
  });

  it("shows error when login API fails", async () => {
    jest.spyOn(authService, "loginWithEmail").mockResolvedValue({
      success: false,
      error: "Mot de passe incorrect.",
    });

    const { getByTestId, getByText } = render(<EmailAuthScreen />);
    fireEvent.changeText(getByTestId("input-email"), "test@tsotsa.org");
    fireEvent.changeText(getByTestId("input-password"), "BadPassword!");
    fireEvent.press(getByTestId("btn-email-continue"));

    await waitFor(() => {
      expect(getByText("Mot de passe incorrect.")).toBeTruthy();
    });
  });

  it("toggles to register tab and handles registration", async () => {
    jest.spyOn(authService, "registerWithEmail").mockResolvedValue({
      success: true,
      message: "Compte créé avec succès. Vérifiez vos e-mails.",
    });

    const { getByTestId, getByText } = render(<EmailAuthScreen />);
    fireEvent.press(getByTestId("tab-email-register"));

    fireEvent.changeText(getByTestId("input-email"), "nouveau@tsotsa.org");
    fireEvent.changeText(getByTestId("input-password"), "MonSecret123");
    fireEvent.press(getByTestId("btn-email-continue"));

    await waitFor(() => {
      expect(authService.registerWithEmail).toHaveBeenCalledWith("nouveau@tsotsa.org", "MonSecret123");
      expect(getByText("Compte créé avec succès. Vérifiez vos e-mails.")).toBeTruthy();
    });
  });

  it("navigates to pending screen when clicking caregiver link", () => {
    const router = useRouter();
    const { getByTestId } = render(<EmailAuthScreen />);

    fireEvent.press(getByTestId("btn-email-caregiver"));
    expect(router.push).toHaveBeenCalledWith("/s-pending");
  });
});

