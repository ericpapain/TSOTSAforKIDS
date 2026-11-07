import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { ListItem } from "../ListItem";

describe("ListItem", () => {
  it("renders title, subtitle and icon", () => {
    const { getByTestId, queryByTestId } = render(
      <ListItem
        title="Farine de maïs"
        subtitle="Riche en zinc · 100g"
        icon="seedling"
      />
    );

    expect(getByTestId("list-item")).toBeTruthy();
    expect(getByTestId("list-item-title").props.children).toBe("Farine de maïs");
    expect(getByTestId("list-item-subtitle").props.children).toBe("Riche en zinc · 100g");
    // No chevron when not pressable
    expect(queryByTestId("list-item-chevron")).toBeNull();
  });

  it("renders chevron and handles onPress when pressable", () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <ListItem
        title="Amina (#A-014)"
        onPress={onPressMock}
        badge={<Text testID="badge-sample">Nouveau</Text>}
      />
    );

    expect(getByTestId("list-item-chevron")).toBeTruthy();
    expect(getByTestId("badge-sample")).toBeTruthy();

    fireEvent.press(getByTestId("list-item"));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

