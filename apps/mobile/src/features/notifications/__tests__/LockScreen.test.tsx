import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import LockScreen from "../../../../app/u-lock";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

describe("LockScreen (M26)", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it("renders the lock screen clock and reminder notification", () => {
    const { getAllByText, getByText, getByTestId } = render(<LockScreen />);

    expect(getAllByText("12:30").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Jeudi 12 novembre")).toBeTruthy();
    expect(getByTestId("lock-notification-card")).toBeTruthy();
    expect(getByText("Rappel pour Amina")).toBeTruthy();
    expect(getByText("C'est donné")).toBeTruthy();
    expect(getByText("Plus tard")).toBeTruthy();
    expect(getByText("Pas donné")).toBeTruthy();
  });

  it("navigates to /u-give when pressing 'C'est donné'", async () => {
    const { getByTestId } = render(<LockScreen />);

    fireEvent.press(getByTestId("btn-give-now"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/u-give?person_id=person-amina")
      );
    });
  });

  it("shows feedback when pressing 'Plus tard'", async () => {
    const { getByTestId, getByText } = render(<LockScreen />);

    fireEvent.press(getByTestId("btn-snooze"));
    await waitFor(() => {
      expect(getByText("Rappel reporté de 15 minutes")).toBeTruthy();
    });
  });

  it("navigates to /u-history when pressing 'Pas donné'", async () => {
    const { getByTestId } = render(<LockScreen />);

    fireEvent.press(getByTestId("btn-not-given"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/u-history");
    });
  });
});

