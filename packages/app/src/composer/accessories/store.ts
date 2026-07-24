import { create } from "zustand";
import type { ComposerAccessoryRegistration } from "./types";

/**
 * Global registry of composer accessory registrations.
 *
 * Accessories are rendered above the composer input area in priority order.
 * Only one accessory may be expanded at a time (coordinated by the context
 * provider, not this store).
 */

interface ComposerAccessoryStoreState {
  /** All registered accessories, keyed by id. */
  registrations: ReadonlyMap<string, ComposerAccessoryRegistration>;

  /**
   * Register a composer accessory.
   *
   * - If an accessory with the same id already exists, it is replaced.
   * - Returns an `unregister` function that removes this accessory.
   * - Calling `unregister` after the store has been torn down is a safe no-op.
   */
  register: (registration: ComposerAccessoryRegistration) => () => void;

  /** Directly unregister an accessory by id. */
  unregister: (id: string) => void;
}

export const useComposerAccessoryStore = create<ComposerAccessoryStoreState>((set, get) => ({
  registrations: new Map(),

  register: (registration) => {
    const id = registration.id;
    const next = new Map(get().registrations);
    next.set(id, registration);
    set({ registrations: next });

    // Track whether this registration is still the active one. When a
    // later registration with the same id replaces it, the earlier
    // unregister becomes a no-op (it would remove the replacement).
    let current = true;

    const unregister = () => {
      if (!current) return;
      current = false;
      const state = get();
      // Only remove if this exact registration is still the one in the store.
      if (state.registrations.get(id) === registration) {
        const nextMap = new Map(state.registrations);
        nextMap.delete(id);
        set({ registrations: nextMap });
      }
    };

    return unregister;
  },

  unregister: (id) => {
    const state = get();
    if (!state.registrations.has(id)) return;
    const next = new Map(state.registrations);
    next.delete(id);
    set({ registrations: next });
  },
}));

// E2E test bridge: expose store API on window for Playwright tests to
// register/deregister accessories and inspect state.
interface PaseoE2EBridge {
  composerAccessoryStore: {
    register: (registration: ComposerAccessoryRegistration) => () => void;
    unregister: (id: string) => void;
    getRegistrations: () => Array<{ id: string; label: string; priority: number }>;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __PASEO__: PaseoE2EBridge | undefined;
}

if (typeof window !== "undefined") {
  window.__PASEO__ = {
    composerAccessoryStore: {
      register: useComposerAccessoryStore.getState().register,
      unregister: useComposerAccessoryStore.getState().unregister,
      getRegistrations: () => {
        const entries = [...useComposerAccessoryStore.getState().registrations.entries()];
        return entries.map(([k, v]) => ({ id: k, label: v.label, priority: v.priority }));
      },
    },
  };
}
