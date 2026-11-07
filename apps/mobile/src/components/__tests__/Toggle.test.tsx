import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { Toggle } from "../Toggle";

describe("Toggle", () => {
  it("renders with correct accessibility switch role and toggles on press", () => {
    const onValueChangeMock = jest.fn();
    const { getByTestId } = render(
      <Toggle value={false} onValueChange={onValueChangeMock} />
    );

    const toggle = getByTestId("toggle");
    expect(toggle.props.accessibilityRole).toBe("switch");
    expect(toggle.props.accessibilityState.checked).toBe(false);

    act(() => {
      fireEvent.press(toggle);
    });
    expect(onValueChangeMock).toHaveBeenCalledWith(true);
  });

  it("does not call onValueChange when disabled", () => {
    const onValueChangeMock = jest.fn();
    const { getByTestId } = render(
      <Toggle value={true} disabled onValueChange={onValueChangeMock} />
    );

    act(() => {
      fireEvent.press(getByTestId("toggle"));
    });
    expect(onValueChangeMock).not.toHaveBeenCalled();
  });
});


