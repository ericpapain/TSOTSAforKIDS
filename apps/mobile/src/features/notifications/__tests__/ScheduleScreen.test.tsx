import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import ScheduleScreen from "../../../../app/u-schedule";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("ScheduleScreen (M30)", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  it("renders prescribed plan card and 3 default slots", () => {
    const { getByText, getByTestId } = render(<ScheduleScreen />);

    expect(getByText("Rappels d'Amina")).toBeTruthy();
    expect(getByTestId("prescribed-plan-card")).toBeTruthy();
    expect(getByText("Plan prescrit par Dr. Mbarga")).toBeTruthy();
    expect(getByText("08:00")).toBeTruthy();
    expect(getByText("12:30")).toBeTruthy();
    expect(getByText("18:00")).toBeTruthy();
  });

  it("adds a personal reminder slot when clicking '+ Ajouter un rappel personnel'", () => {
    const { getByTestId, getByText } = render(<ScheduleScreen />);

    fireEvent.press(getByTestId("btn-add-reminder"));
    expect(getByText("Rappel personnel ajouté à 15:30")).toBeTruthy();
    expect(getByText("15:30")).toBeTruthy();
    expect(getByText("Collation")).toBeTruthy();
  });

  it("navigates to settings when clicking 'Réglages des notifications'", () => {
    const { getByTestId } = render(<ScheduleScreen />);

    fireEvent.press(getByTestId("btn-to-settings"));
    expect(mockPush).toHaveBeenCalledWith("/u-notif-settings");
  });
});

