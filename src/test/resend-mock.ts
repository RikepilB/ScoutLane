import { vi } from "vitest";

type Fn = ReturnType<typeof vi.fn>;

export interface MockedResend {
  emails: { send: Fn };
}

export function createMockResend(): MockedResend {
  return {
    emails: { send: vi.fn() },
  };
}

export function resendSuccess(id = "resend-test-id") {
  return { data: { id }, error: null };
}

export function resendErrorUnion(message = "Test provider error") {
  return {
    data: null,
    error: { message, name: "validation_error", statusCode: 422 },
  };
}
