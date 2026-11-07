/* eslint-env jest */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import OfflineScreen from "../../../../app/u-offline";
import * as offlineModule from "../../../offline";

const mockRouter = {
  replace: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../../offline", () => ({
  getPendingIntakes: jest.fn().mockResolvedValue([]),
  syncPendingIntakes: jest.fn().mockResolvedValue({
    syncedCount: 2,
    failedCount: 0,
  }),
}));

describe("OfflineScreen (M23)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders offline warning and pending queue list", () => {
    const { getByTestId, getByText } = render(<OfflineScreen />);

    expect(getByText("Connexion")).toBeTruthy();
    expect(getByTestId("card-network-warning")).toBeTruthy();
    expect(getByText("Pas de réseau. Vos prises sont gardées sur le téléphone.")).toBeTruthy();
    expect(getByTestId("title-pending-count")).toBeTruthy();
    expect(getByText("Envoi automatique dès le retour du réseau.")).toBeTruthy();
  });

  it("retries synchronization when button is pressed and redirects to modules", async () => {
    const { getByTestId } = render(<OfflineScreen />);
    const retryBtn = getByTestId("btn-retry-sync");

    fireEvent.press(retryBtn);

    await waitFor(() => {
      expect(offlineModule.syncPendingIntakes).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
    });
  });

  it("navigates back to modules when back arrow is pressed", () => {
    const { getByTestId } = render(<OfflineScreen />);
    const backBtn = getByTestId("btn-back-offline");

    fireEvent.press(backBtn);
    expect(mockRouter.replace).toHaveBeenCalledWith("/u-modules");
  });
});
