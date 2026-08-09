import { describe, expect, it } from "vitest";
import { isLocalHostname, normalizeHostname } from "./hostname";

describe("hostname normalization", () => {
  it("normalizes a verified-style host without trusting ports or casing", () => {
    expect(normalizeHostname("Shop.Nextech.Test.:443")).toBe(
      "shop.nextech.test",
    );
  });

  it("allows explicit local development hosts", () => {
    expect(normalizeHostname("127.0.0.1:3000")).toBe("127.0.0.1");
    expect(isLocalHostname("127.0.0.1")).toBe(true);
  });

  it("rejects malformed or injected hosts", () => {
    expect(() => normalizeHostname("example.com/path")).toThrow(
      "Invalid request hostname",
    );
    expect(() => normalizeHostname("bad host.example")).toThrow(
      "Invalid request hostname",
    );
  });
});
