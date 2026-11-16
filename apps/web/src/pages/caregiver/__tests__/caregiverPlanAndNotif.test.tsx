import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { IntakePlanPage } from "../IntakePlanPage";
import { NotificationsPage } from "../NotificationsPage";
import { NotificationSettingsPage } from "../NotificationSettingsPage";

describe("IntakePlanPage (W07)", () => {
  it("renders 5 daily intakes and toggles reminder switches", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014/plan"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId/plan" element={<IntakePlanPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Plan de prises et rappels — Hamadou (#A-014)")).toBeInTheDocument();
    expect(screen.getByTestId("intake-row-intake-1")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-reminder-intake-1")).toBeInTheDocument();

    // Toggle reminder
    const toggle = screen.getByTestId("toggle-reminder-intake-1");
    fireEvent.click(toggle);

    // Save modifications
    const saveBtn = screen.getByTestId("save-plan-btn");
    fireEvent.click(saveBtn);
    expect(screen.getByTestId("plan-saved-notice")).toBeInTheDocument();
  });

  it("adds a new daily intake slot", () => {
    render(
      <MemoryRouter initialEntries={["/soignant/personnes/A-014/plan"]}>
        <Routes>
          <Route path="/soignant/personnes/:personId/plan" element={<IntakePlanPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addBtn = screen.getByTestId("add-intake-btn");
    fireEvent.click(addBtn);

    const timeInput = screen.getByTestId("new-slot-time-input");
    const mealInput = screen.getByTestId("new-slot-meal-input");
    fireEvent.change(timeInput, { target: { value: "21h30" } });
    fireEvent.change(mealInput, { target: { value: "Collation du soir" } });

    const submitBtn = screen.getByTestId("save-new-slot-btn");
    fireEvent.click(submitBtn);

    expect(screen.getByText("21h30")).toBeInTheDocument();
    expect(screen.getByText("Collation du soir")).toBeInTheDocument();
  });
});

describe("NotificationsPage (W08)", () => {
  it("renders notifications list and filters by category", () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Notifications soignant")).toBeInTheDocument();
    const notifs = screen.getAllByTestId(/^notif-item-/);
    expect(notifs.length).toBe(5);

    // Filter by alerts
    const alertBtn = screen.getByTestId("filter-alerts-btn");
    fireEvent.click(alertBtn);
    const filteredNotifs = screen.getAllByTestId(/^notif-item-/);
    expect(filteredNotifs.length).toBe(2);
  });

  it("marks all notifications as read when clicking the action button", () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const markBtn = screen.getByTestId("mark-all-read-btn");
    fireEvent.click(markBtn);

    const unreadDots = screen.getAllByTestId(/^unread-dot-/);
    for (const dot of unreadDots) {
      expect(dot).toHaveClass("bg-transparent");
    }
  });
});

describe("NotificationSettingsPage (W09)", () => {
  it("renders notification settings matrix and toggles channels", () => {
    render(
      <MemoryRouter>
        <NotificationSettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Réglages des notifications soignant")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-quiet-hours")).toBeInTheDocument();

    // Toggle quiet hours
    const quietToggle = screen.getByTestId("toggle-quiet-hours");
    fireEvent.click(quietToggle);

    // Save settings
    const saveBtn = screen.getByTestId("save-settings-btn");
    fireEvent.click(saveBtn);
    expect(screen.getByTestId("settings-saved-notice")).toBeInTheDocument();
  });

  it("modifies individual person frequency and toggles per-person status", () => {
    render(
      <MemoryRouter>
        <NotificationSettingsPage />
      </MemoryRouter>
    );

    const select = screen.getByTestId("freq-select-A-014");
    fireEvent.change(select, { target: { value: "Résumé quotidien" } });
    expect(select).toHaveValue("Résumé quotidien");

    const personToggle = screen.getByTestId("toggle-person-A-014");
    fireEvent.click(personToggle);
  });
});
