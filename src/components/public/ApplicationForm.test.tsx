import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { submitJobApplication } = vi.hoisted(() => ({ submitJobApplication: vi.fn() }));

vi.mock("@/server/services/submit-job-application", () => ({ submitJobApplication }));

import { ApplicationForm } from "./ApplicationForm";

describe("ApplicationForm custom fields", () => {
  it("renders persisted select options and blocks a client-side required field", async () => {
    render(
      <ApplicationForm
        jobSlug="backend-engineer"
        customFields={[
          {
            id: "location",
            label: "Location",
            type: "select",
            required: true,
            options: ["Remote", "Santiago"],
          },
        ]}
      />,
    );

    expect(screen.getByRole("option", { name: "Remote" })).toBeInTheDocument();
    const select = document.querySelector("select");
    expect(select).toBeRequired();
    expect(select!.checkValidity()).toBe(false);

    fireEvent.change(screen.getByPlaceholderText("Jane"), { target: { value: "Sam" } });
    fireEvent.change(screen.getByPlaceholderText("Doe"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByPlaceholderText("jane@example.com"), {
      target: { value: "sam@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("+1 555 123 4567"), {
      target: { value: "+1 555 0100" },
    });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["resume"], "resume.pdf", { type: "application/pdf" })],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));

    expect(submitJobApplication).not.toHaveBeenCalled();
  });
});
