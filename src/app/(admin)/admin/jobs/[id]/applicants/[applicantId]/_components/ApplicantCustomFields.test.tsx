import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApplicantCustomFields } from "./ApplicantCustomFields";

describe("ApplicantCustomFields", () => {
  it("renders configured fields with submitted values in the configured order", () => {
    const configured = [
      { id: "city", label: "City", type: "text" as const, required: true },
      {
        id: "yrs",
        label: "Years of experience",
        type: "select" as const,
        required: false,
        options: ["0-2", "3-5", "6+"],
      },
    ];
    const submitted = { city: "Lima", yrs: "3-5" };
    render(<ApplicantCustomFields configured={configured} submitted={submitted} />);

    const labels = screen.getAllByRole("term").map((el) => el.textContent);
    expect(labels).toEqual(["City", "Years of experience"]);
    expect(screen.getByText("Lima")).toBeInTheDocument();
    expect(screen.getByText("3-5")).toBeInTheDocument();
  });

  it("renders an em-dash placeholder when a field has no submitted value", () => {
    const configured = [{ id: "city", label: "City", type: "text" as const, required: false }];
    render(<ApplicantCustomFields configured={configured} submitted={{}} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("treats whitespace-only answers as empty", () => {
    const configured = [{ id: "city", label: "City", type: "text" as const, required: false }];
    render(<ApplicantCustomFields configured={configured} submitted={{ city: "   " }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders nothing when configured is empty", () => {
    const { container } = render(<ApplicantCustomFields configured={[]} submitted={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
