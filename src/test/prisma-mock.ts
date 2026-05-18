import { vi } from "vitest";

type Fn = ReturnType<typeof vi.fn>;

export interface MockedPrisma {
  pipelineStage: { findMany: Fn };
  applicant: { findMany: Fn; findUnique: Fn; create: Fn; update: Fn };
  job: { findMany: Fn; findUnique: Fn; findFirst: Fn; create: Fn; update: Fn };
  user: { findUnique: Fn };
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
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
}
