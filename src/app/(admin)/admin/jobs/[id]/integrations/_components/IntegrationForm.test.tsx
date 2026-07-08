import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { IntegrationForm } from "./IntegrationForm";

afterEach(() => {
  cleanup();
});

const stages = [{ id: "s1", name: "New", order: 0 }];

describe("IntegrationForm", () => {
  it("masks the API key input so it can't be shoulder-surfed or screen-shared", () => {
    render(<IntegrationForm jobId="job-1" stages={stages} />);

    fireEvent.click(screen.getByRole("button", { name: /add integration/i }));

    const apiKeyInput = screen.getByPlaceholderText("sk-...");
    expect(apiKeyInput).toHaveAttribute("type", "password");
    expect(apiKeyInput).toHaveAttribute("autocomplete", "off");
  });
});
