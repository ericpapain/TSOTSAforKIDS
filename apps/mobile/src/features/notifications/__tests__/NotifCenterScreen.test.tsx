import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import NotifCenterScreen from "../../../../app/u-notif-center";
import { resetInAppNotifications } from "../../../notifications";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("NotifCenterScreen (M27)", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetInAppNotifications();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  it("renders notification items and headers", () => {
    const { getByText, getByTestId } = render(<NotifCenterScreen />);

    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Récents")).toBeTruthy();
    expect(getByTestId("notif-item-notif-1")).toBeTruthy();
    expect(getByText("Amina : Repas du midi (12h30)")).toBeTruthy();
    expect(getByText("Dr. Mbarga")).toBeTruthy();
  });

  it("navigates to settings when clicking the right cog icon", () => {
    const { getByLabelText } = render(<NotifCenterScreen />);

    const rightBtn = getByLabelText("Réglages");
    fireEvent.press(rightBtn);
    expect(mockPush).toHaveBeenCalledWith("/u-notif-settings");
  });

  it("marks as read and navigates when clicking an unread item with route", async () => {
    const { getByTestId } = render(<NotifCenterScreen />);

    fireEvent.press(getByTestId("notif-item-notif-1"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/u-give",
        params: { person_name: "Amina" },
      });
    });
  });
});

