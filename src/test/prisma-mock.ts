import { vi } from "vitest";

type Fn = ReturnType<typeof vi.fn>;

export interface MockedPrisma {
  pipelineStage: { findMany: Fn };
  applicant: { findMany: Fn; findUnique: Fn; create: Fn; update: Fn };
  job: { findMany: Fn; findUnique: Fn; create: Fn; update: Fn };
}

export function createMockPrisma(): MockedPrisma {
  return {
    pipelineStage: { findMany: vi.fn() },
    applicant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}
