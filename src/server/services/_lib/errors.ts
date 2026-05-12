export class ServiceError extends Error {
  constructor(message: string, public code: string = "UNKNOWN") {
    super(message);
    this.name = "ServiceError";
  }
}

export function unauthorized(): ServiceError {
  return new ServiceError("Not authenticated", "UNAUTHORIZED");
}

export function notFound(entity: string): ServiceError {
  return new ServiceError(`${entity} not found`, "NOT_FOUND");
}
