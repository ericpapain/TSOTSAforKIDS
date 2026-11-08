import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PersonFilePage } from "../PersonFilePage";
import { NewEvaluationPage } from "../NewEvaluationPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("PersonFilePage (W04 & W06)", () => {
  it("renders standard initial dossier (W04) with 3 evaluations and chart", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId" element={<PersonFilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Amina (#A-014)")).toBeInTheDocument();
    expect(screen.getByText("CMA de Kousséri")).toBeInTheDocument();
    expect(screen.getByTestId("new-evaluation-btn")).toBeInTheDocument();
    expect(screen.getByTestId("modify-plan-btn")).toBeInTheDocument();

    // Verify 3 rows in history table
    expect(screen.getByTestId("eval-row-29-10")).toBeInTheDocument();
    expect(screen.getByTestId("eval-row-22-10")).toBeInTheDocument();
    expect(screen.getByTestId("eval-row-15-10")).toBeInTheDocument();
    expect(screen.queryByTestId("eval-row-12-11")).not.toBeInTheDocument();
  });

  it("renders updated dossier state (W06) with notice banner and 4th measurement row", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014?updated=true"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId" element={<PersonFilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("evaluation-saved-notice")).toBeInTheDocument();
    expect(screen.getByTestId("eval-row-12-11")).toBeInTheDocument();
    expect(screen.getByTestId("back-to-dashboard-btn")).toBeInTheDocument();
    expect(screen.getByTestId("finish-demo-btn")).toBeInTheDocument();
  });
});

describe("NewEvaluationPage (W05)", () => {
  it("renders clinical evaluation form with live calculation results", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014/evaluation"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId/evaluation" element={<NewEvaluationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Nouvelle évaluation clinique — Amina (#A-014)")).toBeInTheDocument();
    expect(screen.getByTestId("clinical-calc-results")).toBeInTheDocument();

    // Check default calibrated values
    const weightInput = screen.getByTestId("eval-weight-input");
    expect(weightInput).toHaveValue("8,5");
    expect(screen.getByTestId("proposed-classification")).toHaveTextContent("malnutrition aiguë modérée");
  });

  it("updates live calculations when changing anthropometric values", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014/evaluation"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId/evaluation" element={<NewEvaluationPage />} />
        </Routes>
      </MemoryRouter>
    );

    const pbInput = screen.getByTestId("eval-pb-input");
    fireEvent.change(pbInput, { target: { value: "110" } });

    expect(screen.getByTestId("proposed-classification")).toHaveTextContent("malnutrition aiguë sévère");
  });

  it("submits the evaluation and navigates to dossier with updated query param", () => {
    mockNavigate.mockReset();
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014/evaluation"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId/evaluation" element={<NewEvaluationPage />} />
        </Routes>
      </MemoryRouter>
    );

    const submitBtn = screen.getByTestId("submit-evaluation-btn");
    fireEvent.click(submitBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/soignant/personnes/A-014?updated=true");
  });
});

