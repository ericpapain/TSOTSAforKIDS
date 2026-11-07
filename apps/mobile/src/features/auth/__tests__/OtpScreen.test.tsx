import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import OtpVerificationScreen from "../../../../app/u-otp";
import * as authService from "../authService";

describe("OtpVerificationScreen (M05)", () => {
  it("renders instruction and 6 OTP boxes", () => {
    const { getByText, getByTestId } = render(<OtpVerificationScreen />);

    expect(getByText("Vérification")).toBeTruthy();
    expect(getByText(/Entrez le code reçu par SMS/)).toBeTruthy();
    expect(getByText("Valider")).toBeTruthy();
    expect(getByTestId("input-otp-code")).toBeTruthy();
    expect(getByTestId("btn-otp-validate")).toBeTruthy();
    expect(getByTestId("btn-resend-code")).toBeTruthy();
  });

  it("inputs 6 digits, verifies code and navigates to modules", async () => {
    const router = useRouter();
    jest.spyOn(authService, "verifyPhoneOtp").mockResolvedValue({
      success: true,
      role: "user",
    });

    const { getByTestId } = render(<OtpVerificationScreen />);
    fireEvent.changeText(getByTestId("input-otp-code"), "654321");
    fireEvent.press(getByTestId("btn-otp-validate"));

    await waitFor(() => {
      expect(authService.verifyPhoneOtp).toHaveBeenCalledWith(
        expect.any(String),
        "654321"
      );
      expect(router.replace).toHaveBeenCalledWith("/u-modules");
    });
  });

  it("shows error when code is incomplete", async () => {
    const { getByTestId, getByText } = render(<OtpVerificationScreen />);
    fireEvent.changeText(getByTestId("input-otp-code"), "123");
    fireEvent.press(getByTestId("btn-otp-validate"));

    await waitFor(() => {
      expect(getByText("Veuillez saisir le code complet à 6 chiffres.")).toBeTruthy();
    });
  });

  it("shows error when verification fails on API", async () => {
    jest.spyOn(authService, "verifyPhoneOtp").mockResolvedValue({
      success: false,
      error: "Code invalide ou expiré.",
    });

    const { getByTestId, getByText } = render(<OtpVerificationScreen />);
    fireEvent.changeText(getByTestId("input-otp-code"), "000000");
    fireEvent.press(getByTestId("btn-otp-validate"));

    await waitFor(() => {
      expect(getByText("Code invalide ou expiré.")).toBeTruthy();
    });
  });
});

