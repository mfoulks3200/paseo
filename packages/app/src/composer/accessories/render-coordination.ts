/**
 * Pure coordination functions for the single-expand accessory state machine.
 *
 * These are deterministic, testable-in-isolation functions with no React
 * or store dependencies. The context provider uses them internally to
 * manage which accessory (if any) is currently expanded.
 */

export interface AccessoryExpandState {
  /** The currently expanded accessory key, or null if none. */
  expandedKey: string | null;
}

/**
 * Expand the given key.
 *
 * - If the key is already expanded, collapse it (toggle off).
 * - Otherwise, expand the given key and collapse any currently-expanded key.
 * - Returns the same state object when there is no change.
 */
export function expandState(state: AccessoryExpandState, key: string): AccessoryExpandState {
  if (state.expandedKey === key) {
    return state;
  }
  return { expandedKey: key };
}

/**
 * Collapse the expanded key if it matches the given key.
 *
 * Returns the same state if nothing is expanded or a different key is expanded.
 */
export function collapseState(state: AccessoryExpandState, key: string): AccessoryExpandState {
  if (state.expandedKey !== key) {
    return state;
  }
  return { expandedKey: null };
}

/**
 * Remove a deregistered key from the state.
 *
 * If the removed key is currently expanded, the expanded key is cleared.
 * Returns the same state otherwise.
 */
export function removeKey(state: AccessoryExpandState, key: string): AccessoryExpandState {
  if (state.expandedKey !== key) {
    return state;
  }
  return { expandedKey: null };
}

/** Initial (empty) expand state. */
export function createInitialExpandState(): AccessoryExpandState {
  return { expandedKey: null };
}
