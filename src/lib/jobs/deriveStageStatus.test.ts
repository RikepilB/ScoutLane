import { describe, expect, it, vi } from "vitest";
import { deriveStageStatus } from "./deriveStageStatus";

describe("deriveStageStatus", () => {
  it("maps known stage names case-insensitively", () => {
    expect(deriveStageStatus("Interview")).toBe("INTERVIEW");
    expect(deriveStageStatus("OFFER")).toBe("OFFERED");
    expect(deriveStageStatus("rejected")).toBe("REJECTED");
  });

  it("defaults unmapped names to REVIEWING and logs a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(deriveStageStatus("Final Round")).toBe("REVIEWING");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("Final Round");

    warn.mockRestore();
  });

  it("does not warn for mapped names", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    deriveStageStatus("New");
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
