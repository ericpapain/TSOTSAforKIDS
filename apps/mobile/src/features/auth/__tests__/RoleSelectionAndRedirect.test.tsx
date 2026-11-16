import { fireEvent, render } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Linking } from "react-native";

import ProfessionalWebRedirectScreen from "../../../../app/p-web-redirect";
import WelcomeScreen from "../../../../app/u-welcome";
import EmailAuthScreen from "../../../../app/u-email";
import * as storage from "../../../api/storage";

describe("Mobile Roles, Auth Selection & Web Redirection (Étape 4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 5 canonical roles in RoleSelector on WelcomeScreen", () => {
    const { getByTestId, getByText } = render(<WelcomeScreen />);

    expect(getByTestId("role-selector")).toBeTruthy();
    expect(getByTestId("role-btn-parent")).toBeTruthy();
    expect(getByTestId("role-btn-field_agent")).toBeTruthy();
    expect(getByTestId("role-btn-caregiver")).toBeTruthy();
    expect(getByTestId("role-btn-super_caregiver")).toBeTruthy();
    expect(getByTestId("role-btn-admin")).toBeTruthy();

    expect(getByText("Parent")).toBeTruthy();
    expect(getByText("Agent de terrain")).toBeTruthy();
    expect(getByText("Soignant")).toBeTruthy();
    expect(getByText("Super soignant")).toBeTruthy();
    expect(getByText("Administrateur")).toBeTruthy();
  });

  it("clears stored session tokens when switching roles", async () => {
    const clearSpy = jest.spyOn(storage, "clearStoredTokens");
    const { getByTestId } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId("role-btn-caregiver"));
    expect(clearSpy).toHaveBeenCalled();
  });

  it("hides Google and Phone buttons for professional roles on WelcomeScreen", () => {
    const { getByTestId, queryByTestId, getByText } = render(<WelcomeScreen />);

    // Default is parent -> all 3 buttons visible
    expect(getByTestId("btn-welcome-google")).toBeTruthy();
    expect(getByTestId("btn-welcome-phone")).toBeTruthy();
    expect(getByTestId("btn-welcome-email")).toBeTruthy();

    // Select Field Agent
    fireEvent.press(getByTestId("role-btn-field_agent"));
    expect(queryByTestId("btn-welcome-google")).toBeNull();
    expect(queryByTestId("btn-welcome-phone")).toBeNull();
    expect(getByTestId("btn-welcome-email")).toBeTruthy();
    expect(getByText("Connexion sécurisée e-mail + mot de passe.")).toBeTruthy();
  });

  it("hides register tab for Admin and Super Caregiver on EmailAuthScreen", () => {
    const { getByTestId, queryByTestId } = render(<EmailAuthScreen />);

    // Switch to Admin
    fireEvent.press(getByTestId("role-btn-admin"));
    expect(getByTestId("tab-email-login")).toBeTruthy();
    expect(queryByTestId("tab-email-register")).toBeNull();

    // Switch to Super Caregiver
    fireEvent.press(getByTestId("role-btn-super_caregiver"));
    expect(queryByTestId("tab-email-register")).toBeNull();

    // Switch back to Caregiver -> register tab is available
    fireEvent.press(getByTestId("role-btn-caregiver"));
    expect(getByTestId("tab-email-register")).toBeTruthy();
  });

  it("shows caregiver specific fields when registering as caregiver", () => {
    const { getByTestId } = render(<EmailAuthScreen />);

    fireEvent.press(getByTestId("role-btn-caregiver"));
    fireEvent.press(getByTestId("tab-email-register"));

    expect(getByTestId("input-register-facility")).toBeTruthy();
    expect(getByTestId("input-register-specialty")).toBeTruthy();
    expect(getByTestId("input-register-order-number")).toBeTruthy();
  });

  it("shows Cameroon regions list in registration form", () => {
    const { getByTestId } = render(<EmailAuthScreen />);

    fireEvent.press(getByTestId("tab-email-register"));
    expect(getByTestId("region-chip-centre")).toBeTruthy();
    expect(getByTestId("region-chip-littoral")).toBeTruthy();
    expect(getByTestId("region-chip-ouest")).toBeTruthy();
  });

  it("renders ProfessionalWebRedirectScreen and opens web link", () => {
    const openUrlSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
    const { getByTestId, getByText } = render(<ProfessionalWebRedirectScreen />);

    expect(getByText("Espace professionnel")).toBeTruthy();
    expect(getByTestId("btn-open-web-portal")).toBeTruthy();
    expect(getByTestId("btn-pro-logout")).toBeTruthy();

    fireEvent.press(getByTestId("btn-open-web-portal"));
    expect(openUrlSpy).toHaveBeenCalledWith("https://app.tsotsa-for-kids.com");
  });

  it("disconnects and redirects to welcome on ProfessionalWebRedirectScreen", () => {
    const router = useRouter();
    const { getByTestId } = render(<ProfessionalWebRedirectScreen />);

    fireEvent.press(getByTestId("btn-pro-logout"));
    expect(router.replace).toHaveBeenCalledWith("/u-welcome");
  });
});

