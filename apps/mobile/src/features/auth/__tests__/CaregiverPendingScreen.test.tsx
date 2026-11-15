import { fireEvent, render } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

import CaregiverPendingScreen from "../../../../app/s-pending";

describe("CaregiverPendingScreen (M31)", () => {
  it("renders all elements according to M31 specification", () => {
    const { getByText, getByTestId } = render(<CaregiverPendingScreen />);

    expect(getByText("Compte soignant")).toBeTruthy();
    expect(getByText("Vérification en cours")).toBeTruthy();
    expect(
      getByText("Notre équipe vérifie votre identité professionnelle. Vous serez prévenu par SMS.")
    ).toBeTruthy();

    expect(getByText("Carte professionnelle")).toBeTruthy();
    expect(getByText("envoyée ✓")).toBeTruthy();
    expect(getByText("Établissement")).toBeTruthy();
    expect(getByText("Structure de rattachement ✓")).toBeTruthy();
    expect(getByText("Numéro d'ordre")).toBeTruthy();
    expect(getByText("envoyé ✓")).toBeTruthy();

    expect(getByText("Voir côté administration →")).toBeTruthy();
    expect(getByText("Compris")).toBeTruthy();

    expect(getByTestId("btn-pending-admin")).toBeTruthy();
    expect(getByTestId("btn-pending-understood")).toBeTruthy();
  });

  it("navigates to welcome when clicking 'Compris'", () => {
    const router = useRouter();
    const { getByTestId } = render(<CaregiverPendingScreen />);

    fireEvent.press(getByTestId("btn-pending-understood"));
    expect(router.replace).toHaveBeenCalledWith("/u-welcome");
  });

  it("navigates when clicking admin link", () => {
    const router = useRouter();
    const { getByTestId } = render(<CaregiverPendingScreen />);

    fireEvent.press(getByTestId("btn-pending-admin"));
    expect(router.replace).toHaveBeenCalledWith("/u-modules");
  });
});

