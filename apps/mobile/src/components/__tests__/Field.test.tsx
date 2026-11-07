import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { Field } from "../Field";

describe("Field", () => {
  it("renders label, placeholder and handles text entry", () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(
      <Field
        label="Prénom"
        placeholder="Ex: Amina"
        onChangeText={onChangeTextMock}
      />
    );

    expect(getByTestId("field-label").props.children).toBe("Prénom");
    const input = getByTestId("field");
    expect(input.props.placeholder).toBe("Ex: Amina");

    fireEvent.changeText(input, "Amina");
    expect(onChangeTextMock).toHaveBeenCalledWith("Amina");
  });

  it("renders error message when present", () => {
    const { getByTestId } = render(
      <Field
        label="E-mail"
        error="Adresse e-mail invalide"
      />
    );

    const error = getByTestId("field-error");
    expect(error.props.children).toBe("Adresse e-mail invalide");
  });
});

