import { describe, it, expect } from "vitest";
import {
  expandState,
  collapseState,
  removeKey,
  createInitialExpandState,
} from "./render-coordination";

describe("createInitialExpandState", () => {
  it("returns a state with no expanded key", () => {
    const state = createInitialExpandState();
    expect(state.expandedKey).toBeNull();
  });
});

describe("expandState", () => {
  it("sets the expanded key when none is expanded", () => {
    const state = { expandedKey: null };
    const next = expandState(state, "a");
    expect(next.expandedKey).toBe("a");
  });

  it("replaces a different expanded key", () => {
    const state = { expandedKey: "a" };
    const next = expandState(state, "b");
    expect(next.expandedKey).toBe("b");
  });

  it("returns the same state when expanding the already-expanded key", () => {
    const state = { expandedKey: "a" };
    const next = expandState(state, "a");
    expect(next).toBe(state);
  });
});

describe("collapseState", () => {
  it("collapses the expanded key when it matches", () => {
    const state = { expandedKey: "a" };
    const next = collapseState(state, "a");
    expect(next.expandedKey).toBeNull();
  });

  it("leaves state unchanged when collapsing a different key", () => {
    const state = { expandedKey: "a" };
    const next = collapseState(state, "b");
    expect(next).toBe(state);
  });

  it("leaves state unchanged when nothing is expanded", () => {
    const state = { expandedKey: null };
    const next = collapseState(state, "a");
    expect(next).toBe(state);
  });
});

describe("removeKey", () => {
  it("clears the expanded key when it matches", () => {
    const state = { expandedKey: "a" };
    const next = removeKey(state, "a");
    expect(next.expandedKey).toBeNull();
  });

  it("leaves state unchanged when removing a different key", () => {
    const state = { expandedKey: "a" };
    const next = removeKey(state, "b");
    expect(next).toBe(state);
  });

  it("leaves state unchanged when nothing is expanded", () => {
    const state = { expandedKey: null };
    const next = removeKey(state, "a");
    expect(next).toBe(state);
  });
});
