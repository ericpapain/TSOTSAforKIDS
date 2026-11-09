import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../DashboardPage";
import { FollowedPersonsPage } from "../FollowedPersonsPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("DashboardPage (W02)", () => {
  it("renders caregiver dashboard with title and KPIs", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Tableau de bord — Espace soignant")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-followed-persons")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-active-alerts")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-evaluations-today")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-adherence")).toBeInTheDocument();
  });

  it("sorts alerts by priority by default and by date when requested", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const alertItems = screen.getAllByTestId(/^alert-item-/);
    expect(alertItems.length).toBe(3);
    // Highest priority first is Hamadou
    expect(alertItems[0]).toHaveTextContent("Hamadou");

    // Change sort to date
    const sortSelect = screen.getByTestId("alert-sort-select");
    fireEvent.change(sortSelect, { target: { value: "date" } });
    expect(sortSelect).toHaveValue("date");
  });

  it("navigates to person file when clicking open file button", () => {
    mockNavigate.mockReset();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const openBtn = screen.getByTestId("open-file-btn-A-014");
    fireEvent.click(openBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/soignant/personnes/A-014");
  });
});

describe("FollowedPersonsPage (W03)", () => {
  it("renders followed persons list table with 4 persons", () => {
    render(
      <MemoryRouter>
        <FollowedPersonsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Personnes suivies (4)")).toBeInTheDocument();
    expect(screen.getByText("Hamadou")).toBeInTheDocument();
    expect(screen.getByText("Maurice")).toBeInTheDocument();
    expect(screen.getByText("Fatimata")).toBeInTheDocument();
    expect(screen.getByText("Anicet")).toBeInTheDocument();
  });

  it("filters persons by search keyword", () => {
    render(
      <MemoryRouter>
        <FollowedPersonsPage />
      </MemoryRouter>
    );

    const input = screen.getByTestId("search-person-input");
    fireEvent.change(input, { target: { value: "Maurice" } });

    expect(screen.getByText("Maurice")).toBeInTheDocument();
    expect(screen.queryByText("Hamadou")).not.toBeInTheDocument();
  });

  it("filters persons by nutritional status", () => {
    render(
      <MemoryRouter>
        <FollowedPersonsPage />
      </MemoryRouter>
    );

    const select = screen.getByTestId("status-filter-select");
    fireEvent.change(select, { target: { value: "MAS" } });

    expect(screen.getByText("Maurice")).toBeInTheDocument();
    expect(screen.queryByText("Hamadou")).not.toBeInTheDocument();
  });

  it("navigates to person file when clicking dossier button", () => {
    mockNavigate.mockReset();
    render(
      <MemoryRouter>
        <FollowedPersonsPage />
      </MemoryRouter>
    );

    const btn = screen.getByTestId("view-person-A-014");
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith("/soignant/personnes/A-014");
  });
});

