import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { Button } from "../Button";

describe("Button", () => {
  it("renders solid button with default primary background and white text", () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button title="Enregistrer" onPress={onPressMock} />
    );

    const btn = getByTestId("button");
    const title = getByTestId("button-title");
    expect(title.props.children).toBe("Enregistrer");
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: colors.white }),
      ])
    );

    fireEvent.press(btn);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it("renders outline variant with transparent/white background and colored border", () => {
    const { getByTestId } = render(
      <Button
        title="Annuler"
        variant="outline"
        color={colors.danger}
        onPress={() => {}}
      />
    );

    const title = getByTestId("button-title");
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: colors.danger }),
      ])
    );
  });

  it("does not trigger onPress when disabled", () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button title="Bloqué" disabled onPress={onPressMock} />
    );

    fireEvent.press(getByTestId("button"));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it("displays loader when loading", () => {
    const { getByTestId, queryByTestId } = render(
      <Button title="Envoi" loading onPress={() => {}} />
    );

    expect(getByTestId("button-loader")).toBeTruthy();
    expect(queryByTestId("button-title")).toBeNull();
  });
});

