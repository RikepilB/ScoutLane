import { describe, expect, it } from "vitest";
import { parseWorkspaceRole } from "./parse-workspace-role";

describe("parseWorkspaceRole", () => {
  it("accepts admin and recruiter", () => {
    expect(parseWorkspaceRole("admin")).toBe("admin");
    expect(parseWorkspaceRole("recruiter")).toBe("recruiter");
  });

  it("rejects guest and junk", () => {
    expect(parseWorkspaceRole("guest")).toBeNull();
    expect(parseWorkspaceRole("ADMIN")).toBeNull();
    expect(parseWorkspaceRole(undefined)).toBeNull();
  });
});
