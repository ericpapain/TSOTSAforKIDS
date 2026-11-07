import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import PhoneSignupScreen from "../../../../app/u-signup";
import * as authService from "../authService";

describe("PhoneSignupScreen (M03)", () => {
  it("renders all elements according to M03 specification", () => {
    const { getByText, getByTestId } = render(<PhoneSignupScreen />);

    expect(getByText("Mon numéro")).toBeTruthy();
    expect(getByText("Numéro de téléphone")).toBeTruthy();
    expect(getByText("Je m'inscris :")).toBeTruthy();
    expect(getByText("Pour moi ou un proche")).toBeTruthy();
    expect(getByText("Enfant, adulte, parent âgé…")).toBeTruthy();
    expect(getByText("Je suis soignant")).toBeTruthy();
    expect(getByText("Vérification par notre équipe")).toBeTruthy();
    expect(
      getByText("En continuant, j'accepte les conditions d'utilisation et la politique de confidentialité.")
    ).toBeTruthy();
    expect(getByText("Continuer")).toBeTruthy();

    expect(getByTestId("input-phone")).toBeTruthy();
    expect(getByTestId("btn-profile-family")).toBeTruthy();
    expect(getByTestId("btn-profile-caregiver")).toBeTruthy();
    expect(getByTestId("btn-signup-continue")).toBeTruthy();
  });

  it("submits valid phone number, requests OTP and navigates to M05", async () => {
    const router = useRouter();
    jest.spyOn(authService, "requestPhoneOtp").mockResolvedValue({
      success: true,
      expiresIn: 300,
    });

    const { getByTestId } = render(<PhoneSignupScreen />);
    fireEvent.changeText(getByTestId("input-phone"), "+237 670 12 34 56");
    fireEvent.press(getByTestId("btn-signup-continue"));

    await waitFor(() => {
      expect(authService.requestPhoneOtp).toHaveBeenCalledWith("+237670123456");
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/u-otp",
        params: { phone: "+237670123456" },
      });
    });
  });

  it("shows error for short phone number", async () => {
    const { getByTestId, getByText } = render(<PhoneSignupScreen />);
    fireEvent.changeText(getByTestId("input-phone"), "123");
    fireEvent.press(getByTestId("btn-signup-continue"));

    await waitFor(() => {
      expect(getByText("Veuillez saisir un numéro de téléphone valide.")).toBeTruthy();
    });
  });

  it("shows error when API request fails", async () => {
    jest.spyOn(authService, "requestPhoneOtp").mockResolvedValue({
      success: false,
      error: "Erreur SMS: numéro non joignable.",
    });

    const { getByTestId, getByText } = render(<PhoneSignupScreen />);
    fireEvent.changeText(getByTestId("input-phone"), "+237 699 99 99 99");
    fireEvent.press(getByTestId("btn-signup-continue"));

    await waitFor(() => {
      expect(getByText("Erreur SMS: numéro non joignable.")).toBeTruthy();
    });
  });

  it("navigates to pending screen when caregiver option is selected", () => {
    const router = useRouter();
    const { getByTestId } = render(<PhoneSignupScreen />);

    fireEvent.press(getByTestId("btn-profile-caregiver"));
    expect(router.push).toHaveBeenCalledWith("/s-pending");
  });
});

