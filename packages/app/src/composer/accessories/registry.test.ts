import { afterEach, describe, expect, it } from "vitest";
import { useComposerAccessoryStore } from "./store";
import type { ComposerAccessoryRegistration } from "./types";

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

afterEach(() => {
  useComposerAccessoryStore.setState({ registrations: new Map() });
});

describe("useComposerAccessoryStore", () => {
  describe("register", () => {
    it("adds the registration to the store", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "a" }));

      expect(useComposerAccessoryStore.getState().registrations.get("a")).toEqual(
        expect.objectContaining({ id: "a", label: "Accessory a" }),
      );
    });

    it("returns an unregister function", () => {
      const store = useComposerAccessoryStore.getState();
      const unregister = store.register(reg({ id: "a" }));

      expect(useComposerAccessoryStore.getState().registrations.has("a")).toBe(true);

      unregister();

      expect(useComposerAccessoryStore.getState().registrations.has("a")).toBe(false);
    });

    it("replaces an existing registration with the same id", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "a", label: "First", priority: 10 }));

      store.register(reg({ id: "a", label: "Second", priority: 20 }));

      const entry = useComposerAccessoryStore.getState().registrations.get("a");
      expect(entry?.label).toBe("Second");
      expect(entry?.priority).toBe(20);
    });

    it("makes the old unregister a no-op after replacement", () => {
      const store = useComposerAccessoryStore.getState();
      const firstUnregister = store.register(reg({ id: "a", label: "First" }));

      // Replace with a new registration
      store.register(reg({ id: "a", label: "Second" }));

      // Old unregister should not remove the replacement
      firstUnregister();

      expect(useComposerAccessoryStore.getState().registrations.get("a")?.label).toBe("Second");
    });

    it("maintains insertion order of registrations", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "c" }));
      store.register(reg({ id: "a" }));
      store.register(reg({ id: "b" }));

      const keys = [...useComposerAccessoryStore.getState().registrations.keys()];
      expect(keys).toEqual(["c", "a", "b"]);
    });

    it("preserves order of existing keys when replacing one", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "c" }));
      store.register(reg({ id: "a" }));
      store.register(reg({ id: "b" }));

      store.register(reg({ id: "a", label: "Replaced" }));

      const keys = [...useComposerAccessoryStore.getState().registrations.keys()];
      expect(keys).toEqual(["c", "a", "b"]);
    });

    it("handles rapid unregister then re-register with the same id", () => {
      const store = useComposerAccessoryStore.getState();
      const unregister = store.register(reg({ id: "a", label: "First" }));

      unregister();
      store.register(reg({ id: "a", label: "Second" }));

      expect(useComposerAccessoryStore.getState().registrations.get("a")?.label).toBe("Second");
    });

    it("handles rapid register/unregister/register churn without leaking", () => {
      const store = useComposerAccessoryStore.getState();

      const unregister1 = store.register(reg({ id: "x" }));
      unregister1();
      const unregister2 = store.register(reg({ id: "x" }));
      unregister2();
      store.register(reg({ id: "x", label: "Final" }));
      store.register(reg({ id: "y" }));

      const state = useComposerAccessoryStore.getState();
      expect(state.registrations.size).toBe(2);
      expect(state.registrations.get("x")?.label).toBe("Final");
      expect(state.registrations.has("y")).toBe(true);
    });

    it("allows unregister of a recently replaced key without affecting the replacement", () => {
      const store = useComposerAccessoryStore.getState();
      const firstUnregister = store.register(reg({ id: "a", label: "First" }));
      const secondUnregister = store.register(reg({ id: "a", label: "Second" }));

      // old unregister is a no-op
      firstUnregister();
      expect(useComposerAccessoryStore.getState().registrations.get("a")?.label).toBe("Second");

      // new unregister removes it
      secondUnregister();
      expect(useComposerAccessoryStore.getState().registrations.has("a")).toBe(false);
    });
  });

  describe("unregister", () => {
    it("removes a registration by id", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "a" }));
      store.register(reg({ id: "b" }));

      store.unregister("a");

      const state = useComposerAccessoryStore.getState();
      expect(state.registrations.has("a")).toBe(false);
      expect(state.registrations.has("b")).toBe(true);
    });

    it("is a no-op when the id is not registered", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "a" }));

      store.unregister("nonexistent");

      expect(useComposerAccessoryStore.getState().registrations.size).toBe(1);
    });

    it("is a no-op on an empty store", () => {
      const store = useComposerAccessoryStore.getState();
      store.unregister("a");

      expect(useComposerAccessoryStore.getState().registrations.size).toBe(0);
    });

    it("removes the last remaining registration", () => {
      const store = useComposerAccessoryStore.getState();
      store.register(reg({ id: "sole" }));

      store.unregister("sole");

      expect(useComposerAccessoryStore.getState().registrations.size).toBe(0);
    });
  });
});
