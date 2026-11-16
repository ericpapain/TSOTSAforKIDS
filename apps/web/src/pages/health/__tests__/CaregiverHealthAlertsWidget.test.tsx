import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CaregiverHealthAlertsWidget } from "../CaregiverHealthAlertsWidget";
import * as healthApi from "../../../api/health";

vi.mock("../../../api/health", () => ({
  listHealthAlerts: vi.fn(),
}));

describe("CaregiverHealthAlertsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when there are no alerts", async () => {
    vi.mocked(healthApi.listHealthAlerts).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CaregiverHealthAlertsWidget />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("caregiver-health-alerts-widget")).toBeDefined();
      expect(screen.getByText(/Aucune alerte de santé active/i)).toBeDefined();
    });
  });

  it("renders urgent alerts list with danger sign badge", async () => {
    vi.mocked(healthApi.listHealthAlerts).mockResolvedValue([
      {
        event_id: "alert-1",
        person_id: "p-001",
        person_code: "#A-014",
        created_at: new Date().toISOString(),
        priority: "urgent",
        status: "open",
        symptoms_summary: ["Convulsions", "Fièvre élevée"],
        has_danger_sign: true,
        requires_urgent_transfer: true,
      },
    ]);

    render(
      <BrowserRouter>
        <CaregiverHealthAlertsWidget />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("health-alert-item-alert-1")).toBeDefined();
      expect(screen.getByText("#A-014")).toBeDefined();
      expect(screen.getByText(/SIGNE DE DANGER/i)).toBeDefined();
    });
  });
});

