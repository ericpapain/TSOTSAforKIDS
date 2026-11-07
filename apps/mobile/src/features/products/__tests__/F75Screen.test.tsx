/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import F75Screen from "../../../../app/u-f75";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({
    productId: "ref-f75",
    personId: "p-01",
    name: "Amina",
    region: "Ouest",
  }),
}));

describe("M14: F75 Hospital Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders hospital warning banner", () => {
    const { getByText } = render(<F75Screen />);
    expect(
      getByText(
        "Lait thérapeutique de stabilisation, donné à l'hôpital sous surveillance médicale."
      )
    ).toBeTruthy();
  });

  it("renders standard composition table for 100 ml", () => {
    const { getByText } = render(<F75Screen />);
    expect(getByText("Composition pour 100 ml")).toBeTruthy();
    expect(getByText("Énergie")).toBeTruthy();
    expect(getByText("75 kcal")).toBeTruthy();
    expect(getByText("Protéines")).toBeTruthy();
    expect(getByText("0,9 g")).toBeTruthy();
    expect(getByText("Lactose")).toBeTruthy();
    expect(getByText("Potassium")).toBeTruthy();
  });

  it("renders OMS 1999 citation", () => {
    const { getByText } = render(<F75Screen />);
    expect(
      getByText(
        "Source : OMS, prise en charge de la malnutrition sévère (1999). À confirmer par la référente médicale."
      )
    ).toBeTruthy();
  });

  it("navigates back to dropdown on Choisir un autre produit", () => {
    const { getByTestId } = render(<F75Screen />);
    fireEvent.press(getByTestId("btn-choose-other"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/u-dropdown",
      params: { personId: "p-01", name: "Amina", region: "Ouest" },
    });
  });
});

