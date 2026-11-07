import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { BottomNav } from "../BottomNav";

describe("BottomNav", () => {
  it("renders 4 tabs and indicates active tab", () => {
    const onTabPressMock = jest.fn();
    const { getByTestId, getByText } = render(
      <BottomNav activeTab="modules" onTabPress={onTabPressMock} />
    );

    expect(getByTestId("bottom-nav")).toBeTruthy();
    expect(getByText("Modules")).toBeTruthy();
    expect(getByText("Personnes")).toBeTruthy();
    expect(getByText("Produits")).toBeTruthy();
    expect(getByText("Prises")).toBeTruthy();

    const modulesTab = getByTestId("bottom-nav-tab-modules");
    expect(modulesTab.props.accessibilityState.selected).toBe(true);

    const personsTab = getByTestId("bottom-nav-tab-persons");
    expect(personsTab.props.accessibilityState.selected).toBe(false);
  });

  it("calls onTabPress when a tab is pressed", () => {
    const onTabPressMock = jest.fn();
    const { getByTestId } = render(
      <BottomNav activeTab="modules" onTabPress={onTabPressMock} />
    );

    fireEvent.press(getByTestId("bottom-nav-tab-intakes"));
    expect(onTabPressMock).toHaveBeenCalledWith("intakes");
  });
});

