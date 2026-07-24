import { type ReactElement } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MAX_CONTENT_WIDTH } from "@/constants/layout";
import { AccessoryShell } from "./accessory-shell";
import { useComposerAccessory } from "./context";
import type { ComposerAccessoryRegistration } from "./types";

export interface AccessoriesTrackProps {
  /**
   * Accessory registrations to render, sorted by priority.
   * The track renders nothing when the list is empty.
   */
  registrations: ComposerAccessoryRegistration[];
  /** The active agent id, passed through to content components. */
  agentId: string;
  /** The active server id, passed through to content components. */
  serverId: string;
  /** The active workspace id, passed through to content components. */
  workspaceId?: string | null;
}

/**
 * Renders a vertically stacked list of accessory shells.
 *
 * Each accessory gets its own expand/collapse state via `useComposerAccessory`.
 * The track sits above the composer input area, inside a
 * `ComposerAccessoryProvider` that carries agent context.
 */
export function AccessoriesTrack({
  registrations,
  agentId,
  serverId,
  workspaceId = null,
}: AccessoriesTrackProps): ReactElement | null {
  if (registrations.length === 0) {
    return null;
  }

  return (
    <View style={styles.outer} testID="accessories-track">
      <View style={styles.track}>
        {registrations.map((registration) => (
          <AccessoryTrackItem
            key={registration.id}
            registration={registration}
            agentId={agentId}
            serverId={serverId}
            workspaceId={workspaceId}
          />
        ))}
      </View>
    </View>
  );
}

function AccessoryTrackItem({
  registration,
  agentId,
  serverId,
  workspaceId,
}: {
  registration: ComposerAccessoryRegistration;
  agentId: string;
  serverId: string;
  workspaceId: string | null;
}): ReactElement {
  const { isExpanded, onToggle } = useComposerAccessory(registration.id);

  const Content = registration.content;

  return (
    <AccessoryShell
      id={registration.id}
      label={registration.label}
      expanded={isExpanded}
      onToggle={onToggle}
      badge={registration.badge}
      action={registration.action}
    >
      {isExpanded ? (
        <Content agentId={agentId} serverId={serverId} workspaceId={workspaceId} />
      ) : null}
    </AccessoryShell>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: theme.spacing[4],
  },
  track: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    gap: 0,
  },
}));
