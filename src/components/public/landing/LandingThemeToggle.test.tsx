import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingThemeToggle } from "./LandingThemeToggle";

describe("LandingThemeToggle", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: vi.fn(() => values.clear()),
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => values.set(key, value)),
      },
    });
  });

  afterEach(() => {
    delete document.documentElement.dataset.scoutTheme;
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("switches and persists the landing color theme", async () => {
    document.documentElement.dataset.scoutTheme = "light";
    render(<LandingThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Switch to dark theme" });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);

    expect(document.documentElement.dataset.scoutTheme).toBe("dark");
    expect(window.localStorage.getItem("scoutlane-theme")).toBe("dark");
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-label", "Switch to light theme");
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("keeps the visual and accessible theme in sync when storage is blocked", async () => {
    document.documentElement.dataset.scoutTheme = "light";
    window.localStorage.setItem = vi.fn(() => {
      throw new Error("Storage is unavailable");
    });
    render(<LandingThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Switch to dark theme" });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);

    expect(document.documentElement.dataset.scoutTheme).toBe("dark");
    expect(toggle).toHaveAttribute("aria-label", "Switch to light theme");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
