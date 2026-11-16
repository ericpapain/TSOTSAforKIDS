import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HealthFlowScreen from "../../../../app/u-health-flow";
import * as healthService from "../healthService";

jest.mock("../healthService", () => ({
  fetchSymptomCatalog: jest.fn(),
  submitHealthEvent: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    personId: "child-42",
    name: "Amina",
  }),
}));

const mockCatalog = [
  { code: "fever", category: "general", label_fr: "Fièvre chaude au toucher", label_en: "Fever", is_danger_sign: false, display_order: 1 },
  { code: "convulsions", category: "neurological", label_fr: "Convulsions ou crises", label_en: "Convulsions", is_danger_sign: true, display_order: 2 },
];

describe("HealthFlowScreen", () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
    (healthService.fetchSymptomCatalog as jest.Mock).mockResolvedValue(mockCatalog);
    (healthService.submitHealthEvent as jest.Mock).mockResolvedValue({
      id: "evt-001",
      person_id: "child-42",
      created_at: new Date().toISOString(),
      status: "open",
      priority: "urgent",
      has_danger_sign: true,
      parent_guidance_message: "Rendez-vous immédiatement aux urgences.",
      symptoms: [{ symptom_code: "convulsions", duration: "less_than_24h" }],
    });
  });

  it("loads symptoms and renders Step 1", async () => {
    const { getByText, getByTestId } = render(<HealthFlowScreen />);
    await waitFor(() => {
      expect(getByText("Fièvre chaude au toucher")).toBeTruthy();
      expect(getByTestId("btn-continue-step-1")).toBeTruthy();
    });
  });

  it("intercepts vital danger sign immediately when tapped", async () => {
    const { getByText, getByTestId } = render(<HealthFlowScreen />);
    await waitFor(() => {
      expect(getByText("Convulsions ou crises")).toBeTruthy();
    });

    fireEvent.press(getByTestId("symptom-item-convulsions"));

    // Immediate danger banner must be visible before continuing
    await waitFor(() => {
      expect(getByTestId("mobile-immediate-danger-banner")).toBeTruthy();
      expect(getByText(/URGENCE VITALE/i)).toBeTruthy();
    });
  });
});

