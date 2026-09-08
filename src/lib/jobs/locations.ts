/**
 * Job locations are stored as a single free-text string, often semicolon- or
 * comma-joined ("Alberta, Canada; California; Remote"). These helpers split
 * that raw string into clean tokens so filters and cards never render the
 * storage format.
 */

export function parseLocations(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(";")) {
    const token = part.trim();
    if (token) seen.add(token);
  }
  return [...seen];
}

export function formatLocations(
  raw: string | null | undefined,
  max = 3
): string {
  const tokens = parseLocations(raw);
  if (tokens.length === 0) return "";
  if (tokens.length <= max) return tokens.join(" · ");
  return `${tokens.slice(0, max).join(" · ")} +${tokens.length - max}`;
}
