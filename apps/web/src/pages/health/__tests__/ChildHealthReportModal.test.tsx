import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChildHealthReportModal } from "../ChildHealthReportModal";
import * as healthApi from "../../../api/health";

vi.mock("../../../api/health", () => ({
  getSymptomCatalog: vi.fn(),
  createHealthEvent: vi.fn(),
}));

const mockCatalog: healthApi.SymptomCatalogItem[] = [
  {
    code: "vomiting",
    category: "digestive",
    label_fr: "Vomissements",
    label_en: "Vomiting",
    is_danger_sign: false,
    display_order: 1,
    conditional_questions: [
      { key: "vomiting_freq", label_fr: "Nombre d'épisodes par jour", type: "number" },
    ],
  },
  {
    code: "convulsions",
    category: "neurological",
    label_fr: "Convulsions",
    label_en: "Convulsions",
    is_danger_sign: true,
    display_order: 2,
  },
  {
    code: "fever",
    category: "general",
    label_fr: "Fièvre",
    label_en: "Fever",
    is_danger_sign: false,
    display_order: 3,
  },
];

describe("ChildHealthReportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(healthApi.getSymptomCatalog).mockResolvedValue(mockCatalog);
    vi.mocked(healthApi.createHealthEvent).mockResolvedValue({
      id: "evt-001",
      person_id: "child-123",
      reported_by: "parent-1",
      created_at: new Date().toISOString(),
      declaration_context: "standalone",
      status: "open",
      priority: "urgent",
      has_danger_sign: true,
      parent_guidance_message: "Rendez-vous immédiatement dans la formation sanitaire la plus proche.",
      symptoms: [{ id: "s-1", symptom_code: "convulsions", duration: "less_than_24h" }],
    });
  });

  it("does not render when isOpen is false", () => {
    render(
      <ChildHealthReportModal
        isOpen={false}
        onClose={vi.fn()}
        personId="child-123"
        personName="Amina"
      />
    );
    expect(screen.queryByTestId("child-health-report-modal")).toBeNull();
  });

  it("renders modal and loads catalog symptoms", async () => {
    render(
      <ChildHealthReportModal
        isOpen={true}
        onClose={vi.fn()}
        personId="child-123"
        personName="Amina"
      />
    );

    expect(screen.getByTestId("child-health-report-modal")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("Vomissements")).toBeDefined();
    });
  });

  it("immediately triggers vital danger warning when a danger sign is selected", async () => {
    render(
      <ChildHealthReportModal
        isOpen={true}
        onClose={vi.fn()}
        personId="child-123"
        personName="Amina"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Convulsions")).toBeDefined();
    });

    const convulsionsCheckbox = screen.getByTestId("symptom-check-convulsions");
    fireEvent.click(convulsionsCheckbox);

    // Immediate danger banner must be displayed
    await waitFor(() => {
      expect(screen.getByTestId("immediate-danger-sign-banner")).toBeDefined();
      expect(screen.getByText(/URGENCE VITALE/i)).toBeDefined();
    });
  });

  it("navigates through steps and submits event successfully", async () => {
    const onCloseMock = vi.fn();
    render(
      <ChildHealthReportModal
        isOpen={true}
        onClose={onCloseMock}
        personId="child-123"
        personName="Amina"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Vomissements")).toBeDefined();
    });

    // Step 1: select vomiting
    fireEvent.click(screen.getByTestId("symptom-check-vomiting"));
    fireEvent.click(screen.getByTestId("next-step-btn"));

    // Step 2: Details & Duration
    await waitFor(() => {
      expect(screen.getByTestId("step-2-view")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("next-step-btn"));

    // Step 3: Context / meal info
    await waitFor(() => {
      expect(screen.getByTestId("step-3-view")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("next-step-btn"));

    // Step 4: Summary & Submit
    await waitFor(() => {
      expect(screen.getByTestId("step-4-view")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("submit-health-report-btn"));

    // Step 5: Success & Guidance view
    await waitFor(() => {
      expect(screen.getByTestId("step-5-guidance-view")).toBeDefined();
    });

    expect(healthApi.createHealthEvent).toHaveBeenCalledTimes(1);
  });
});

