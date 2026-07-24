import type { ComposerAccessoryRegistration } from "./types";

/**
 * Sort accessory registrations by priority (ascending), breaking ties by id.
 *
 * Returns a new sorted array. The original array is not mutated.
 */
export function sortRegistrations(
  registrations: readonly ComposerAccessoryRegistration[],
): ComposerAccessoryRegistration[] {
  return [...registrations].sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Format the accessory track header label based on the number of registrations.
 *
 * - 0 → "0 accessories"
 * - 1 → "1 accessory"
 * - N → "N accessories"
 */
export function formatAccessoryTrackHeader(count: number): string {
  if (count === 1) return "1 accessory";
  return `${count} accessories`;
}

/**
 * Resolve and normalize an accessory label for display.
 *
 * Returns `null` when the label is empty or whitespace-only,
 * otherwise returns the trimmed label.
 */
export function resolveAccessoryLabel(label: string | undefined | null): string | null {
  if (label == null) return null;
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : null;
}
