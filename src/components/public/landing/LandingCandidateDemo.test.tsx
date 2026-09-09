import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingCandidateDemo } from "./LandingCandidateDemo";

describe("LandingCandidateDemo", () => {
  it("lets a visitor inspect a different sample candidate", () => {
    render(<LandingCandidateDemo />);

    expect(screen.getByRole("heading", { name: "Alex Morgan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mina Patel/ }));

    expect(screen.getByRole("button", { name: /Mina Patel/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Mina Patel" })).toBeInTheDocument();
    expect(screen.getByText("Operations lead")).toBeInTheDocument();
  });

  it("switches the product evidence without changing automatically", () => {
    render(<LandingCandidateDemo />);

    const processTab = screen.getByRole("tab", { name: "Hiring process" });
    fireEvent.click(processTab);

    expect(processTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Phone screen");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Next conversation");
  });
});
