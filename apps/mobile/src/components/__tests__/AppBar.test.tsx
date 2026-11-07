import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { colors } from "../../theme/colors";
import { AppBar } from "../AppBar";

describe("AppBar", () => {
  it("renders title with default background", () => {
    const { getByTestId, queryByTestId } = render(<AppBar title="Mes Modules" />);

    expect(getByTestId("app-bar")).toBeTruthy();
    const titleText = getByTestId("app-bar-title");
    expect(titleText.props.children).toBe("Mes Modules");
    expect(queryByTestId("app-bar-back-button")).toBeNull();
  });

  it("renders back button and triggers onBack", () => {
    const onBackMock = jest.fn();
    const { getByTestId } = render(
      <AppBar title="Détail" onBack={onBackMock} />
    );

    const backBtn = getByTestId("app-bar-back-button");
    fireEvent.press(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom background and right icon action", () => {
    const onRightMock = jest.fn();
    const { getByTestId } = render(
      <AppBar
        title="Soignant"
        backgroundColor={colors.care}
        rightIcon="bell"
        onRightPress={onRightMock}
      />
    );

    const rightBtn = getByTestId("app-bar-right-button");
    fireEvent.press(rightBtn);
    expect(onRightMock).toHaveBeenCalledTimes(1);
  });
});

