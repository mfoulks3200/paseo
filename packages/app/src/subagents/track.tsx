import { useCallback, useMemo, useState, type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Archive, Unlink } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { getProviderIcon } from "@/components/provider-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsCompactFormFactor } from "@/constants/layout";
import { isNative } from "@/constants/platform";
import {
  WorkspaceTabIcon,
  type WorkspaceTabPresentation,
} from "@/screens/workspace/workspace-tab-presentation";
import type { Theme } from "@/styles/theme";
import { useRegisterComposerAccessory } from "@/composer/accessories/use-register-accessory";
import type {
  ComposerAccessoryRegistration,
  ComposerAccessoryContentProps,
} from "@/composer/accessories/types";
import type { SubagentRow } from "./select";
import {
  buildSubagentRowPresentationData,
  countFinishedSubagents,
  formatHeaderLabel,
} from "./track-presentation";

const ThemedArchive = withUnistyles(Archive);
const ThemedUnlink = withUnistyles(Unlink);

const foregroundColorMapping = (theme: Theme) => ({ color: theme.colors.foreground });
const foregroundMutedColorMapping = (theme: Theme) => ({
  color: theme.colors.foregroundMuted,
});

export interface SubagentsTrackProps {
  rows: SubagentRow[];
  onOpenSubagent: (id: string) => void;
  onOpenProviderSubagent: (parentAgentId: string, subagentId: string) => void;
  onArchiveSubagent: (id: string) => void;
  onArchiveFinished?: () => void;
  onDetachSubagent?: (id: string) => void;
}

function buildRowPresentation(row: SubagentRow): WorkspaceTabPresentation {
  const data = buildSubagentRowPresentationData(row);
  return {
    ...data,
    tooltip: data.label,
    modified: false,
    icon: getProviderIcon(row.provider),
  };
}

/**
 * SubagentsTrack registers its content into the global composer accessory
 * store so it renders through the unified AccessoriesTrack. The component
 * itself returns null — all visible rendering is done by AccessoriesTrack.
 */
export function SubagentsTrack({
  rows,
  onOpenSubagent,
  onOpenProviderSubagent,
  onArchiveSubagent,
  onArchiveFinished,
  onDetachSubagent,
}: SubagentsTrackProps): ReactElement | null {
  const { t } = useTranslation();

  const registration = useMemo((): ComposerAccessoryRegistration | null => {
    if (rows.length === 0) return null;

    const finished = countFinishedSubagents(rows);
    const action =
      finished > 0 && onArchiveFinished
        ? {
            label: t("subagents.archiveFinishedAction"),
            icon: <ThemedArchive size={14} uniProps={foregroundColorMapping} />,
            onPress: onArchiveFinished,
          }
        : undefined;

    const Content = (_props: ComposerAccessoryContentProps) => (
      <>
        {rows.map((row) => (
          <SubagentsTrackRow
            key={row.id}
            row={row}
            onOpenSubagent={onOpenSubagent}
            onOpenProviderSubagent={onOpenProviderSubagent}
            onArchiveSubagent={onArchiveSubagent}
            onDetachSubagent={onDetachSubagent}
          />
        ))}
      </>
    );
    Content.displayName = "SubagentsTrackContent";

    return {
      id: "subagents",
      priority: 10,
      label: formatHeaderLabel(rows),
      content: Content,
      action,
    };
  }, [
    rows,
    onOpenSubagent,
    onOpenProviderSubagent,
    onArchiveSubagent,
    onDetachSubagent,
    onArchiveFinished,
    t,
  ]);

  useRegisterComposerAccessory(registration);
  return null;
}

interface SubagentsTrackRowProps {
  row: SubagentRow;
  onOpenSubagent: (id: string) => void;
  onOpenProviderSubagent: (parentAgentId: string, subagentId: string) => void;
  onArchiveSubagent: (id: string) => void;
  onDetachSubagent?: (id: string) => void;
}

function SubagentsTrackRow({
  row,
  onOpenSubagent,
  onOpenProviderSubagent,
  onArchiveSubagent,
  onDetachSubagent,
}: SubagentsTrackRowProps): ReactElement {
  const { t } = useTranslation();
  const isCompact = useIsCompactFormFactor();
  const [hovered, setHovered] = useState(false);
  const presentation = useMemo(() => buildRowPresentation(row), [row]);
  const displayLabel =
    presentation.titleState === "loading" ? t("common.states.loading") : presentation.label;
  const handlePress = useCallback(() => {
    if (row.kind === "provider") {
      onOpenProviderSubagent(row.parentAgentId, row.id);
    } else {
      onOpenSubagent(row.id);
    }
  }, [onOpenProviderSubagent, onOpenSubagent, row]);
  const handleArchivePress = useCallback(() => {
    onArchiveSubagent(row.id);
  }, [onArchiveSubagent, row.id]);
  const handleDetachPress = useCallback(() => {
    onDetachSubagent?.(row.id);
  }, [onDetachSubagent, row.id]);
  const handlePointerEnter = useCallback(() => setHovered(true), []);
  const handlePointerLeave = useCallback(() => setHovered(false), []);
  const actionsAlwaysVisible = isNative || isCompact;
  const actionsVisible = actionsAlwaysVisible || hovered;

  return (
    // Wrapper View handles hover so moving the pointer between the row and
    // the archive button doesn't drop the hover state — the same pattern
    // used by sidebar workspace rows.
    <View onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={displayLabel}
        testID={`subagents-track-row-${row.id}`}
        onPress={handlePress}
      >
        {({ pressed }) => (
          <View style={hovered || pressed ? styles.rowActive : styles.row}>
            <WorkspaceTabIcon presentation={presentation} />
            <Text style={styles.rowLabel} numberOfLines={1}>
              {displayLabel}
            </Text>
            {row.kind === "paseo" ? (
              <SubagentRowActions
                rowId={row.id}
                displayLabel={displayLabel}
                visible={actionsVisible}
                onDetachPress={onDetachSubagent ? handleDetachPress : undefined}
                onArchivePress={handleArchivePress}
              />
            ) : null}
          </View>
        )}
      </Pressable>
    </View>
  );
}

function SubagentRowActions({
  rowId,
  displayLabel,
  visible,
  onDetachPress,
  onArchivePress,
}: {
  rowId: string;
  displayLabel: string;
  visible: boolean;
  onDetachPress?: () => void;
  onArchivePress: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      style={visible ? styles.actionClusterVisible : styles.actionClusterHidden}
      pointerEvents={visible ? "auto" : "none"}
    >
      {onDetachPress ? (
        <SubagentActionButton
          accessibilityLabel={t("subagents.detachAction", { label: displayLabel })}
          testID={`subagents-track-detach-${rowId}`}
          tooltipLabel={t("subagents.detachTooltip")}
          icon="detach"
          visible={visible}
          onPress={onDetachPress}
        />
      ) : null}
      <SubagentActionButton
        accessibilityLabel={t("subagents.archiveAction", { label: displayLabel })}
        testID={`subagents-track-archive-${rowId}`}
        tooltipLabel={t("subagents.archiveTooltip")}
        icon="archive"
        visible={visible}
        onPress={onArchivePress}
      />
    </View>
  );
}

type SubagentActionIcon = "archive" | "detach";

function renderSubagentActionIcon(icon: SubagentActionIcon, isActive: boolean): ReactElement {
  const uniProps = isActive ? foregroundColorMapping : foregroundMutedColorMapping;
  if (icon === "detach") {
    return <ThemedUnlink size={14} uniProps={uniProps} />;
  }
  return <ThemedArchive size={14} uniProps={uniProps} />;
}

function SubagentActionButton({
  accessibilityLabel,
  testID,
  tooltipLabel,
  icon,
  visible,
  onPress,
}: {
  accessibilityLabel: string;
  testID: string;
  tooltipLabel: string;
  icon: SubagentActionIcon;
  visible: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Tooltip delayDuration={0} enabledOnDesktop enabledOnMobile={false}>
      <TooltipTrigger asChild disabled={!visible}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          onPress={onPress}
          style={styles.actionButton}
          hitSlop={8}
        >
          {({ hovered, pressed }) => renderSubagentActionIcon(icon, hovered || pressed)}
        </Pressable>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" offset={8}>
        <Text style={styles.tooltipText}>{tooltipLabel}</Text>
      </TooltipContent>
    </Tooltip>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  rowActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.surface2,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  actionClusterVisible: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    opacity: 1,
  },
  actionClusterHidden: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    opacity: 0,
  },
  actionButton: {
    padding: theme.spacing[1],
    alignItems: "center",
    justifyContent: "center",
  },
  tooltipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
  },
}));
