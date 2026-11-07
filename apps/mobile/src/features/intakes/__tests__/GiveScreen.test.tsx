/* eslint-env jest */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import GiveScreen from "../../../../app/u-give";
import * as intakesService from "../intakesService";

jest.mock("../intakesService", () => ({
  recordIntake: jest.fn().mockResolvedValue({
    id: "test-id-1",
    person_id: "p-amina-1",
    product_name: "Plumpy'Nut",
  }),
}));

describe("GiveScreen (M20)", () => {
  it("renders correctly with default labels and values", () => {
    const { getByTestId, getByText } = render(<GiveScreen />);

    expect(getByText("Confirmer la prise")).toBeTruthy();
    expect(getByTestId("card-person-info")).toBeTruthy();
    expect(getByTestId("card-product-info")).toBeTruthy();
    expect(getByText("1 sachet")).toBeTruthy();
    expect(getByText("Aujourd'hui · 12:30 ▾")).toBeTruthy();
    expect(getByTestId("btn-confirm-intake")).toBeTruthy();
  });

  it("updates quantity when plus and minus buttons are pressed", () => {
    const { getByTestId, getByText } = render(<GiveScreen />);
    const plusBtn = getByTestId("btn-qty-plus");
    const minusBtn = getByTestId("btn-qty-minus");

    fireEvent.press(plusBtn);
    expect(getByText("2 sachets")).toBeTruthy();

    fireEvent.press(minusBtn);
    expect(getByText("1 sachet")).toBeTruthy();

    // Does not go below 1
    fireEvent.press(minusBtn);
    expect(getByText("1 sachet")).toBeTruthy();
  });

  it("submits intake record and navigates to given screen", async () => {
    const { getByTestId } = render(<GiveScreen />);
    const halfBtn = getByTestId("btn-consumption-half");
    const confirmBtn = getByTestId("btn-confirm-intake");

    fireEvent.press(halfBtn);
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(intakesService.recordIntake).toHaveBeenCalledWith(
        expect.objectContaining({
          consumption: "half",
          quantity: 1,
          unit: "sachet",
        })
      );
    });
  });
});
