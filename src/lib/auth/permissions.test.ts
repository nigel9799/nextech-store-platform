import { describe, expect, it } from "vitest";
import { hasCapability } from "./permissions";

describe("tenant role permissions", () => {
  it("matches the approved role matrix", () => {
    const expected = {
      owner: [true, true, true, true, true, true],
      administrator: [true, false, true, true, true, true],
      catalogue_manager: [true, false, true, false, false, false],
      enquiries_agent: [true, false, false, true, false, false],
    } as const;
    const capabilities = [
      "access_admin",
      "manage_members",
      "manage_catalogue",
      "manage_enquiries",
      "manage_website",
      "view_audit",
    ] as const;
    for (const [role, values] of Object.entries(expected)) {
      expect(
        capabilities.map((capability) =>
          hasCapability(role as keyof typeof expected, capability),
        ),
      ).toEqual(values);
    }
  });

  it("limits member management to owners", () => {
    expect(hasCapability("owner", "manage_members")).toBe(true);
    expect(hasCapability("administrator", "manage_members")).toBe(false);
    expect(hasCapability("catalogue_manager", "manage_members")).toBe(false);
    expect(hasCapability("enquiries_agent", "manage_members")).toBe(false);
  });

  it("applies least privilege to staff roles", () => {
    expect(hasCapability("administrator", "manage_website")).toBe(true);
    expect(hasCapability("catalogue_manager", "manage_catalogue")).toBe(true);
    expect(hasCapability("catalogue_manager", "manage_enquiries")).toBe(false);
    expect(hasCapability("enquiries_agent", "manage_enquiries")).toBe(true);
    expect(hasCapability("enquiries_agent", "view_audit")).toBe(false);
  });
});
