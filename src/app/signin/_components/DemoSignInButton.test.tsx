import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: undefined as undefined | { ticket: ReturnType<typeof vi.fn>; finalize: ReturnType<typeof vi.fn> },
  push: vi.fn(),
  refresh: vi.fn(),
  signInAsDemo: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useSignIn: () => ({ signIn: mocks.signIn }),
  useClerk: () => ({ signOut: vi.fn(), user: null }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/lib/auth/demo-sign-in", () => ({ signInAsDemo: mocks.signInAsDemo }));

import { DemoSignInButton } from "./DemoSignInButton";

beforeEach(() => { vi.clearAllMocks(); mocks.signIn = undefined; });

describe("DemoSignInButton error accessibility", () => {
  it("recovers if activation succeeds but navigation stalls", async () => {
    vi.useFakeTimers();
    try {
      mocks.signIn = {
        ticket: vi.fn().mockResolvedValue({ error: null }),
        finalize: vi.fn().mockResolvedValue({ error: null }),
      };
      mocks.signInAsDemo.mockResolvedValue({ ok: true, ticket: "test-only-ticket", redirectTo: "/admin" });
      render(<DemoSignInButton role="admin">Admin</DemoSignInButton>);
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Admin" })); });
      await act(async () => { await vi.advanceTimersByTimeAsync(12_001); });
      expect(screen.getByRole("alert")).toHaveTextContent("Taking too long");
      expect(screen.getByRole("button", { name: "Admin" })).toBeEnabled();
    } finally { vi.useRealTimers(); }
  });
  it("activates the ticket session before navigating", async () => {
    const events: string[] = [];
    mocks.signIn = {
      ticket: vi.fn(async () => { events.push("ticket"); return { error: null }; }),
      finalize: vi.fn(async () => { events.push("finalize"); return { error: null }; }),
    };
    mocks.signInAsDemo.mockResolvedValue({ ok: true, ticket: "test-only-ticket", redirectTo: "/admin" });
    mocks.push.mockImplementation(() => { events.push("navigate"); });
    render(<DemoSignInButton role="admin">Admin</DemoSignInButton>);
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(events).toEqual(["ticket", "finalize", "navigate"]);
  });
  it("gives each error a unique ID and retains both description and error association", async () => {
    render(<><p id="hint">Shared demo data</p>
      <DemoSignInButton role="admin" aria-describedby="hint">Admin</DemoSignInButton>
      <DemoSignInButton role="recruiter">Recruiter</DemoSignInButton>
    </>);
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Recruiter" }));
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    const [admin, recruiter] = screen.getAllByRole("alert");
    expect(admin.id).not.toBe(recruiter.id);
    expect(screen.getByRole("button", { name: "Admin" })).toHaveAttribute("aria-describedby", `hint ${admin.id}`);
    expect(screen.getByRole("button", { name: "Recruiter" })).toHaveAttribute("aria-describedby", recruiter.id);
    expect(screen.getByRole("button", { name: "Admin" })).toBeEnabled();
  });
  it("keeps the user on the page when activation fails", async () => {
    mocks.signIn = {
      ticket: vi.fn().mockResolvedValue({ error: null }),
      finalize: vi.fn().mockResolvedValue({ error: { message: "Session activation failed." } }),
    };
    mocks.signInAsDemo.mockResolvedValue({ ok: true, ticket: "test-only-ticket", redirectTo: "/admin" });
    render(<DemoSignInButton role="admin">Admin</DemoSignInButton>);
    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Session activation failed.");
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Admin" })).toBeEnabled();
  });
});
