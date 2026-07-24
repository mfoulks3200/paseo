import { describe, expect, it } from "vitest";
import type { ComposerAccessoryRegistration } from "./types";
import {
  formatAccessoryTrackHeader,
  resolveAccessoryLabel,
  sortRegistrations,
} from "./presentation";

function reg(
  overrides: Partial<ComposerAccessoryRegistration> & Pick<ComposerAccessoryRegistration, "id">,
): ComposerAccessoryRegistration {
  return {
    label: `Accessory ${overrides.id}`,
    priority: 0,
    content: () => null,
    ...overrides,
  };
}

describe("sortRegistrations", () => {
  it("returns an empty array when given an empty array", () => {
    expect(sortRegistrations([])).toEqual([]);
  });

  it("returns the same single-element array", () => {
    const single = [reg({ id: "a" })];
    expect(sortRegistrations(single)).toEqual(single);
  });

  it("sorts by priority ascending", () => {
    const registrations = [
      reg({ id: "high", priority: 100 }),
      reg({ id: "low", priority: 10 }),
      reg({ id: "mid", priority: 50 }),
    ];

    const sorted = sortRegistrations(registrations);

    expect(sorted.map((r) => r.id)).toEqual(["low", "mid", "high"]);
  });

  it("breaks ties by id when priorities are equal", () => {
    const registrations = [
      reg({ id: "c", priority: 0 }),
      reg({ id: "a", priority: 0 }),
      reg({ id: "b", priority: 0 }),
    ];

    const sorted = sortRegistrations(registrations);

    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the original array", () => {
    const registrations = [reg({ id: "b", priority: 20 }), reg({ id: "a", priority: 10 })];
    const copy = [...registrations];

    sortRegistrations(registrations);

    expect(registrations).toEqual(copy);
  });

  it("handles mixed priorities with tie-breaking", () => {
    const registrations = [
      reg({ id: "z", priority: 10 }),
      reg({ id: "a", priority: 0 }),
      reg({ id: "m", priority: 10 }),
      reg({ id: "b", priority: 0 }),
    ];

    const sorted = sortRegistrations(registrations);

    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "m", "z"]);
  });
});

describe("formatAccessoryTrackHeader", () => {
  it('returns "0 accessories" for zero', () => {
    expect(formatAccessoryTrackHeader(0)).toBe("0 accessories");
  });

  it('returns "1 accessory" (singular) for one', () => {
    expect(formatAccessoryTrackHeader(1)).toBe("1 accessory");
  });

  it('returns "N accessories" (plural) for counts greater than one', () => {
    expect(formatAccessoryTrackHeader(2)).toBe("2 accessories");
    expect(formatAccessoryTrackHeader(42)).toBe("42 accessories");
  });
});

describe("resolveAccessoryLabel", () => {
  it("returns null for undefined", () => {
    expect(resolveAccessoryLabel(undefined)).toBeNull();
  });

  it("returns null for null", () => {
    expect(resolveAccessoryLabel(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(resolveAccessoryLabel("")).toBeNull();
  });

  it("returns null for whitespace-only strings", () => {
    expect(resolveAccessoryLabel("   ")).toBeNull();
    expect(resolveAccessoryLabel("\t\n ")).toBeNull();
  });

  it("returns the trimmed label for a non-empty string", () => {
    expect(resolveAccessoryLabel("  My Accessory  ")).toBe("My Accessory");
  });

  it("returns the label unchanged when already trimmed", () => {
    expect(resolveAccessoryLabel("Status")).toBe("Status");
  });
});
