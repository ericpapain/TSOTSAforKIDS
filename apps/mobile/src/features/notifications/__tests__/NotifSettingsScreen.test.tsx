import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import NotifSettingsScreen from "../../../../app/u-notif-settings";
import * as SecureStore from "expo-secure-store";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("NotifSettingsScreen (M28)", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  it("renders all setting sections and toggles", async () => {
    const { getByText, getByTestId } = render(<NotifSettingsScreen />);

    await waitFor(() => {
      expect(getByText("Pour Amina")).toBeTruthy();
      expect(getByText("Général")).toBeTruthy();
      expect(getByText("Comment recevoir")).toBeTruthy();
      expect(getByText("Heures calmes")).toBeTruthy();
      expect(getByTestId("toggle-reminders")).toBeTruthy();
      expect(getByTestId("toggle-followup")).toBeTruthy();
    });
  });

  it("redirects to /u-notif-off when disabling reminders for Amina", async () => {
    const { getByTestId } = render(<NotifSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("toggle-reminders")).toBeTruthy();
    });

    fireEvent.press(getByTestId("toggle-reminders"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/u-notif-off");
    });
  });

  it("updates quiet hours toggle and saves to storage", async () => {
    const { getByTestId } = render(<NotifSettingsScreen />);

    await waitFor(() => {
      expect(getByTestId("toggle-quiet-hours")).toBeTruthy();
    });

    fireEvent.press(getByTestId("toggle-quiet-hours"));
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });
});

