import { describe, expect, it } from "vitest";
import { isBlockedIpAddress, validateEgressUrl } from "./validate-egress-url";

describe("isBlockedIpAddress", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fe80::1",
    "fe90::1",
    "febf::1",
    "fd00::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "::ffff:169.254.169.254",
    "::ffff:7f00:1",
  ])("blocks private or local address %s", (address) => {
    expect(isBlockedIpAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "fec0::1", "::ffff:8.8.8.8"])(
    "allows public address %s",
    (address) => {
      expect(isBlockedIpAddress(address)).toBe(false);
    },
  );
});

describe("validateEgressUrl", () => {
  it.each(["http://8.8.8.8/hook", "https://127.0.0.1/hook", "https://localhost/hook"])(
    "rejects unsafe endpoint %s",
    async (url) => {
      await expect(validateEgressUrl(url)).rejects.toThrow();
    },
  );

  it("accepts a public HTTPS endpoint (literal IP, no DNS lookup needed)", async () => {
    await expect(validateEgressUrl("https://8.8.8.8/hook")).resolves.toBe("https://8.8.8.8/hook");
  });
});
