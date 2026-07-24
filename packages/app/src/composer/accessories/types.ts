import type { ReactNode } from "react";

export interface ComposerAccessoryRegistration {
  id: string;
  /** Label shown in the collapsed shell header next to the chevron toggle. */
  label: string;
  /** Lower numbers render first. Accessories with equal priority sort by id. */
  priority: number;
  /** Content rendered inside the expanded shell body. Receives agent context. */
  content: React.ComponentType<ComposerAccessoryContentProps>;
  /** Optional status badge displayed in the header after the label. */
  badge?: ComposerAccessoryBadge;
  /** Optional action button rendered in the header trailing slot. */
  action?: ComposerAccessoryAction;
}

export interface ComposerAccessoryContentProps {
  agentId: string;
  serverId: string;
  workspaceId?: string | null;
}

export interface ComposerAccessoryBadge {
  label: string;
  variant: "success" | "error" | "muted";
}

export interface ComposerAccessoryAction {
  label: string;
  icon: ReactNode;
  onPress: () => void;
}
