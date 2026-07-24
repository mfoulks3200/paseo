import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ComposerAccessoryContextValue {
  /** The id of the currently expanded accessory, or null if none. */
  expandedKey: string | null;
  /** Toggle expansion: expands the key or collapses if already expanded. */
  toggleExpanded: (key: string) => void;
  /** The active agent id (passed to accessory content components). */
  agentId: string;
  /** The active server id (passed to accessory content components). */
  serverId: string;
  /** The active workspace id (passed to accessory content components). */
  workspaceId: string | null | undefined;
}

export const ComposerAccessoryContext = createContext<ComposerAccessoryContextValue | null>(null);

export interface ComposerAccessoryProviderProps {
  agentId: string;
  serverId: string;
  workspaceId?: string | null;
  children: ReactNode;
}

/**
 * Provider that wraps the composer area in ActiveAgentComposer.
 *
 * Holds the single-expand coordination state: at most one accessory
 * is expanded at a time. Toggling the same key collapses it; toggling
 * a different key expands the new one and collapses the old one.
 */
export function ComposerAccessoryProvider({
  agentId,
  serverId,
  workspaceId,
  children,
}: ComposerAccessoryProviderProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedKey((current) => (current === key ? null : key));
  }, []);

  const value = useMemo(
    (): ComposerAccessoryContextValue => ({
      expandedKey,
      toggleExpanded,
      agentId,
      serverId,
      workspaceId,
    }),
    [expandedKey, toggleExpanded, agentId, serverId, workspaceId],
  );

  return (
    <ComposerAccessoryContext.Provider value={value}>{children}</ComposerAccessoryContext.Provider>
  );
}

/**
 * Low-level hook to access the full composer accessory context.
 *
 * Prefer `useComposerAccessory` for individual accessory expand/collapse state.
 */
export function useComposerAccessoryContext(): ComposerAccessoryContextValue {
  const ctx = useContext(ComposerAccessoryContext);
  if (!ctx) {
    throw new Error("useComposerAccessoryContext must be used within a ComposerAccessoryProvider");
  }
  return ctx;
}

export interface UseComposerAccessoryResult {
  /** Whether this accessory is currently expanded. */
  isExpanded: boolean;
  /** Toggle this accessory's expanded state. */
  onToggle: () => void;
  /** Expand this accessory (no-op if already expanded). */
  onExpand: () => void;
  /** Collapse this accessory (no-op if already collapsed). */
  onCollapse: () => void;
}

/**
 * Hook for an individual accessory to read and control its expanded state.
 *
 * Returns expansion state and callbacks for a specific accessory id.
 * The id must match the one used in `ComposerAccessoryRegistration`.
 */
export function useComposerAccessory(id: string): UseComposerAccessoryResult {
  const { expandedKey, toggleExpanded } = useComposerAccessoryContext();

  const isExpanded = expandedKey === id;

  const onToggle = useCallback(() => {
    toggleExpanded(id);
  }, [toggleExpanded, id]);

  const onExpand = useCallback(() => {
    if (!isExpanded) {
      toggleExpanded(id);
    }
  }, [toggleExpanded, id, isExpanded]);

  const onCollapse = useCallback(() => {
    if (isExpanded) {
      toggleExpanded(id);
    }
  }, [toggleExpanded, id, isExpanded]);

  return useMemo(
    () => ({ isExpanded, onToggle, onExpand, onCollapse }),
    [isExpanded, onToggle, onExpand, onCollapse],
  );
}
