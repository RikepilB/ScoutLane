const SENSITIVE_VALUE_PATTERNS: ReadonlyArray<RegExp> = [
  /((?:proxy-)?authorization\s*[:=]\s*(?:bearer\s+)?)([^\s,;'"\\]+)/gi,
  /(\bbearer\s+)([^\s,;'"\\]+)/gi,
  /(["']?(?:api[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?)([^\s,;'"}]+)/gi,
];

/** Redacts credential-like values from third-party response and error bodies before storage or display. */
export function redactIntegrationResponse(value: string | null): string | null {
  if (value === null) return null;

  return SENSITIVE_VALUE_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, "$1[REDACTED]"),
    value,
  );
}
