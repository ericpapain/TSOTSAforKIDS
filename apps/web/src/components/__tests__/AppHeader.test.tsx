import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LOCALE_STORAGE_KEY } from "@tsotsa/i18n";
import { AppHeader } from "../AppHeader";
import { changeAppLanguage } from "../../i18n/setup";

describe("AppHeader & LanguageSwitcher", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("fr", { persist: false });
  });

  it("renders header with user space by default", () => {
    render(<AppHeader userName="Hamadou N." />);
    expect(screen.getByTestId("app-header")).toHaveClass("bg-primary");
    expect(screen.getByText("Hamadou N.")).toBeInTheDocument();
    expect(screen.getByText(/Espace utilisateur/)).toBeInTheDocument();
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });

  it("renders caregiver space with bell and notification badge", () => {
    const handleNotif = vi.fn();
    render(
      <AppHeader
        spaceTheme="care"
        userName="Prof. Félicité Ngeufack"
        notificationCount={4}
        onNotificationClick={handleNotif}
      />
    );
    expect(screen.getByTestId("app-header")).toHaveClass("bg-care");
    expect(screen.getByText(/Espace soignant/)).toBeInTheDocument();
    expect(screen.getByTestId("header-notification-badge")).toHaveTextContent("4");

    fireEvent.click(screen.getByTestId("header-notification-btn"));
    expect(handleNotif).toHaveBeenCalledTimes(1);
  });

  it("renders logout button when onLogout is provided", () => {
    const handleLogout = vi.fn();
    render(<AppHeader onLogout={handleLogout} />);
    const logoutBtn = screen.getByText("Déconnexion");
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("switches language between FR and EN, updates <html lang> and localStorage, and supports keyboard navigation", () => {
    const handleLogout = vi.fn();
    render(<AppHeader spaceTheme="care" onLogout={handleLogout} />);

    const switcher = screen.getByTestId("language-switcher");
    const frBtn = screen.getByTestId("lang-btn-fr");
    const enBtn = screen.getByTestId("lang-btn-en");

    expect(switcher).toHaveAttribute("aria-label", "Choisir la langue");
    expect(frBtn).toHaveAttribute("aria-pressed", "true");
    expect(enBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("header-space-title")).toHaveTextContent("· Espace soignant");

    // Click EN button
    fireEvent.click(enBtn);
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(switcher).toHaveAttribute("aria-label", "Select language");
    expect(enBtn).toHaveAttribute("aria-pressed", "true");
    expect(frBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("header-space-title")).toHaveTextContent("· Caregiver portal");
    expect(screen.getByTestId("header-logout-btn")).toHaveTextContent("Log out");

    // Keyboard ArrowLeft switches back to FR
    fireEvent.keyDown(switcher, { key: "ArrowLeft" });
    expect(document.documentElement.lang).toBe("fr");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
    expect(screen.getByTestId("header-space-title")).toHaveTextContent("· Espace soignant");
    expect(screen.getByTestId("header-logout-btn")).toHaveTextContent("Déconnexion");
  });
});
