import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 with status ok and an ISO timestamp", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
