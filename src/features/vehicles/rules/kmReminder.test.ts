import { shouldRequestKmUpdate } from "@/features/vehicles/rules/kmReminder";

describe("kmReminder", () => {
  const now = new Date("2026-06-06T12:00:00.000Z");

  it("requests update when there is no previous prompt", () => {
    expect(shouldRequestKmUpdate(undefined, "daily", now)).toBe(true);
  });

  it("respects daily frequency", () => {
    expect(shouldRequestKmUpdate("2026-06-05T11:59:00.000Z", "daily", now)).toBe(true);
    expect(shouldRequestKmUpdate("2026-06-05T12:01:00.000Z", "daily", now)).toBe(false);
  });

  it("respects weekly frequency", () => {
    expect(shouldRequestKmUpdate("2026-05-30T11:59:00.000Z", "weekly", now)).toBe(true);
    expect(shouldRequestKmUpdate("2026-05-30T12:01:00.000Z", "weekly", now)).toBe(false);
  });

  it("requests update when stored prompt date is invalid", () => {
    expect(shouldRequestKmUpdate("invalid-date", "weekly", now)).toBe(true);
  });
});
