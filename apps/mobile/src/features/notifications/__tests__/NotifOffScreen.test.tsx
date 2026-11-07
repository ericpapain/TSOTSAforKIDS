import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import NotifOffScreen from "../../../../app/u-notif-off";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("NotifOffScreen (M29)", () => {
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      back: mockBack,
    });
  });

  it("renders the caregiver warning card and disabled toggles", async () => {
    const { getByText, getByTestId } = render(<NotifOffScreen />);

    await waitFor(() => {
      expect(getByTestId("warning-caregiver-card")).toBeTruthy();
      expect(getByText("Attention")).toBeTruthy();
      expect(
        getByText(
          "Le soignant Dr. Mbarga sera informé que les rappels sont désactivés pour Amina."
        )
      ).toBeTruthy();
      expect(getByTestId("toggle-reminders-off")).toBeTruthy();
    });
  });

  it("redirects back to settings when re-enabling reminders", async () => {
    const { getByTestId } = render(<NotifOffScreen />);

    await waitFor(() => {
      expect(getByTestId("toggle-reminders-off")).toBeTruthy();
    });

    fireEvent.press(getByTestId("toggle-reminders-off"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/u-notif-settings");
    });
  });
});

