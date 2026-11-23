import { fireEvent, render } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import WelcomeScreen from "../../../../app/u-welcome";

describe("WelcomeScreen (M01)", () => {
  it("renders all elements conform to M01 specification", () => {
    const { getByText, getByTestId } = render(<WelcomeScreen />);

    expect(getByText("TSOTSA")).toBeTruthy();
    expect(getByText("for")).toBeTruthy();
    expect(getByText("KIDS")).toBeTruthy();
    expect(getByText("Bien nourrir, bien suivre.")).toBeTruthy();
    expect(getByText("Continuer avec Google")).toBeTruthy();
    expect(getByText("Continuer avec mon téléphone")).toBeTruthy();
    expect(getByText("Continuer avec mon e-mail")).toBeTruthy();
    expect(getByText("Un seul compte pour toute la famille.")).toBeTruthy();
    expect(getByText("Français ▾")).toBeTruthy();

    expect(getByTestId("btn-welcome-google")).toBeTruthy();
    expect(getByTestId("btn-welcome-phone")).toBeTruthy();
    expect(getByTestId("btn-welcome-email")).toBeTruthy();
  });

  it("navigates to Google screen when clicking Google button", () => {
    const router = useRouter();
    const { getByTestId } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId("btn-welcome-google"));
    expect(router.push).toHaveBeenCalledWith("/u-google");
  });

  it("navigates to phone screen when clicking phone button", () => {
    const router = useRouter();
    const { getByTestId } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId("btn-welcome-phone"));
    expect(router.push).toHaveBeenCalledWith("/u-signup");
  });

  it("navigates to email screen when clicking email button", () => {
    const router = useRouter();
    const { getByTestId } = render(<WelcomeScreen />);

    fireEvent.press(getByTestId("btn-welcome-email"));
    expect(router.push).toHaveBeenCalledWith("/u-email");
  });
});

