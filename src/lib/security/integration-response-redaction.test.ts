import { describe, expect, it } from "vitest";
import { redactIntegrationResponse } from "./integration-response-redaction";

describe("integration response redaction", () => {
  it("redacts authorization and credential values before logs can persist or render them", () => {
    const response =
      'upstream error: Authorization: Bearer integration-token-1234, token="secondary-token-5678"';

    const redacted = redactIntegrationResponse(response);

    expect(redacted).toBe(
      'upstream error: Authorization: Bearer [REDACTED], token="[REDACTED]"',
    );
    expect(redacted).not.toContain("integration-token-1234");
    expect(redacted).not.toContain("secondary-token-5678");
  });

  it("preserves an absent response body", () => {
    expect(redactIntegrationResponse(null)).toBeNull();
  });
});
