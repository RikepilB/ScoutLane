import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.google.internal.",
]);

function isBlockedIpv4(address: string): boolean {
  const [first, second] = address.split(".").map(Number);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168)
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;

  // IPv4-mapped ("::ffff:1.2.3.4" or "::ffff:0102:0304") addresses must be judged by their
  // embedded IPv4 address, not by the IPv6 prefix check below (which would never match them).
  const mappedDotted = normalized.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mappedDotted) return isBlockedIpv4(mappedDotted[1]);
  const mappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isBlockedIpv4(`${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`);
  }

  // First hextet, numeric, so range checks cover the whole block instead of one literal prefix.
  const firstHextet = parseInt(normalized.split(":")[0] || "0", 16) || 0;
  const isLinkLocal = (firstHextet & 0xffc0) === 0xfe80; // fe80::/10
  const isUniqueLocal = (firstHextet & 0xfe00) === 0xfc00; // fc00::/7
  return isLinkLocal || isUniqueLocal;
}

export function isBlockedIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
}

/**
 * Validates a customer-controlled destination before an outbound integration call.
 * Resolve hostnames as well as literal IPs so private and metadata networks are never targets.
 */
export async function validateEgressUrl(value: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Endpoint URL must be a valid HTTPS URL.");
  }

  if (url.protocol !== "https:" || url.username || url.password || BLOCKED_HOSTNAMES.has(url.hostname)) {
    throw new Error("Endpoint URL must be a public HTTPS URL.");
  }

  const literalFamily = isIP(url.hostname);
  const addresses = literalFamily
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIpAddress(address))) {
    throw new Error("Endpoint URL must not resolve to a private network.");
  }

  return url.toString();
}
