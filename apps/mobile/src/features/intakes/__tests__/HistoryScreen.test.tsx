/* eslint-env jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HistoryScreen from "../../../../app/u-history";
import * as intakesService from "../intakesService";

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    name: "Amina",
    personId: "p-amina-1",
  }),
}));

describe("HistoryScreen (M22)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(intakesService, "listPersonIntakes").mockResolvedValue([]);
  });

  it("renders correctly with default timeline cards and recap text", async () => {
    const { getByText, getByTestId } = render(<HistoryScreen />);

    expect(getByText("Prises d'Amina")).toBeTruthy();
    expect(getByTestId("card-history-h1")).toBeTruthy();
    expect(getByTestId("card-history-h4")).toBeTruthy();
    expect(getByTestId("text-recap")).toBeTruthy();
    expect(getByText("Prises des 7 derniers jours : 11 sur 14 (démo)")).toBeTruthy();
  });

  it("handles late confirmation button click", () => {
    const { getByTestId } = render(<HistoryScreen />);
    const confirmLateBtn = getByTestId("btn-confirm-late-h4");

    fireEvent.press(confirmLateBtn);
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/u-give",
        params: expect.objectContaining({
          origin: "late",
        }),
      })
    );
  });

  it("navigates back to profile on back arrow click", () => {
    const { getByTestId } = render(<HistoryScreen />);
    const backBtn = getByTestId("btn-back-history");

    fireEvent.press(backBtn);
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-profile");
  });

  it("navigates to tabs on bottom nav press", () => {
    const { getByTestId } = render(<HistoryScreen />);
    const modulesTab = getByTestId("bottom-nav-tab-modules");

    fireEvent.press(modulesTab);
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
  });
});
