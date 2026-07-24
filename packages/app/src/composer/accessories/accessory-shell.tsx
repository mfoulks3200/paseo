import { useCallback, useState, useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View, type PressableStateCallbackType } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { isNative } from "@/constants/platform";
import { useIsCompactFormFactor } from "@/constants/layout";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Theme } from "@/styles/theme";
import type { ComposerAccessoryBadge, ComposerAccessoryAction } from "./types";

const ThemedChevronDown = withUnistyles(ChevronDown);
const ThemedChevronRight = withUnistyles(ChevronRight);

const foregroundMutedColorMapping = (theme: Theme) => ({
  color: theme.colors.foregroundMuted,
});

const MAX_EXPANDED_HEIGHT = 200;

export interface AccessoryShellProps {
  /** The accessory registration id. Used for test identifiers. */
  id: string;
  /** Label shown in the collapsed header. */
  label: string;
  /** Whether the shell body is expanded. */
  expanded: boolean;
  /** Called when the header toggle is pressed. */
  onToggle: () => void;
  /** Optional status badge. */
  badge?: ComposerAccessoryBadge | undefined;
  /** Optional action in the header trailing slot. */
  action?: ComposerAccessoryAction | undefined;
  /** Content rendered inside the expanded body. */
  children: ReactNode;
}

/**
 * Reusable collapsible accessory shell.
 *
 * Structure:
 * - Outer plain View tracks hover (canonical pattern per docs/hover.md).
 * - Inner Pressable handles the toggle press.
 * - Header: chevron toggle + label + optional status badge + optional action slot.
 * - Expanded body: ScrollView with maxHeight 200 containing children.
 * - Surface: surface1 background, borderAccent border, top corners only.
 * - Actions visible via isNative || isCompact || hovered.
 */
export function AccessoryShell({
  id,
  label,
  expanded,
  onToggle,
  badge,
  action,
  children,
}: AccessoryShellProps) {
  const isCompact = useIsCompactFormFactor();
  const [hovered, setHovered] = useState(false);

  const handlePointerEnter = useCallback(() => setHovered(true), []);
  const handlePointerLeave = useCallback(() => setHovered(false), []);

  const actionVisible = isNative || isCompact || hovered;

  const headerContainerStyle = useMemo(
    () => [styles.headerContainer, expanded ? styles.headerDivider : undefined],
    [expanded],
  );

  const surfaceStyle = useMemo(
    () => [styles.surface, expanded ? styles.surfaceExpanded : undefined],
    [expanded],
  );

  const chevronIcon = expanded ? (
    <ThemedChevronDown size={12} uniProps={foregroundMutedColorMapping} />
  ) : (
    <ThemedChevronRight size={12} uniProps={foregroundMutedColorMapping} />
  );

  return (
    <View
      style={styles.outer}
      testID={`accessory-shell-${id}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <View style={surfaceStyle}>
        <View style={headerContainerStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={`accessory-shell-toggle-${id}`}
            onPress={onToggle}
            style={headerToggleStyle}
          >
            {chevronIcon}
            <Text style={styles.headerLabel} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
          {badge ? (
            <View style={styles.headerBadgeSlot}>
              <StatusBadge label={badge.label} variant={badge.variant} />
            </View>
          ) : null}
          {action ? (
            <View
              style={[
                styles.actionSlot,
                actionVisible ? styles.actionVisible : styles.actionHidden,
              ]}
              pointerEvents={actionVisible ? "auto" : "none"}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                testID={`accessory-shell-action-${id}`}
                onPress={action.onPress}
                style={headerActionButtonStyle}
                hitSlop={8}
              >
                {action.icon}
              </Pressable>
            </View>
          ) : null}
        </View>
        {expanded ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            testID={`accessory-shell-body-${id}`}
          >
            {children}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const headerToggleStyle = ({ hovered, pressed }: PressableStateCallbackType) => [
  styles.headerToggle,
  hovered || pressed ? styles.headerActive : undefined,
];

const headerActionButtonStyle = ({ hovered, pressed }: PressableStateCallbackType) => [
  styles.actionButton,
  hovered || pressed ? styles.actionButtonActive : undefined,
];

const styles = StyleSheet.create((theme) => ({
  outer: {
    width: "100%",
  },
  surface: {
    alignSelf: "stretch",
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.borderAccent,
    borderBottomWidth: 0,
    borderTopLeftRadius: theme.borderRadius["2xl"],
    borderTopRightRadius: theme.borderRadius["2xl"],
    overflow: "hidden",
  },
  surfaceExpanded: {
    paddingBottom: theme.spacing[4],
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerToggle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingLeft: theme.spacing[3],
    paddingRight: theme.spacing[1],
    paddingVertical: theme.spacing[2],
  },
  headerActive: {
    backgroundColor: theme.colors.surface2,
  },
  headerDivider: {
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
  },
  headerLabel: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.foregroundMuted,
  },
  headerBadgeSlot: {
    marginRight: theme.spacing[2],
  },
  actionSlot: {
    paddingRight: theme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
  },
  actionVisible: {
    opacity: 1,
  },
  actionHidden: {
    opacity: 0,
  },
  actionButton: {
    padding: theme.spacing[1],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.sm,
  },
  actionButtonActive: {
    backgroundColor: theme.colors.surface3,
  },
  scroll: {
    maxHeight: MAX_EXPANDED_HEIGHT,
  },
  scrollContent: {
    paddingVertical: theme.spacing[1],
  },
}));
