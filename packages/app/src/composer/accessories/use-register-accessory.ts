import { useEffect, useRef } from "react";
import type { ComposerAccessoryRegistration } from "./types";
import { useComposerAccessoryStore } from "./store";

/**
 * Register a composer accessory for the lifetime of the calling component.
 *
 * Registration is automatically cleaned up when the component unmounts.
 * If another accessory with the same `id` is already registered, this
 * registration replaces it.
 *
 * The returned `isExpanded` / `onExpand` / `onCollapse` values come from
 * `useComposerAccessory` and should be passed to `AccessoryShell`.
 *
 * ```tsx
 * function MyCustomTrack({ rows }: { rows: MyRow[] }) {
 *   const reg = useMemo(() => ({
 *     id: "my-custom",
 *     priority: 100,
 *     label: `Custom (${rows.length})`,
 *     content: MyCustomContent,
 *   }), [rows.length]);
 *
 *   useRegisterComposerAccessory(reg);
 *
 *   // ... render with AccessoryShell
 * }
 * ```
 */
export function useRegisterComposerAccessory(
  registration: ComposerAccessoryRegistration | null,
): void {
  const register = useComposerAccessoryStore((s) => s.register);
  const unregisterRef = useRef<(() => void) | null>(null);

  // Re-register whenever the registration object changes.
  useEffect(() => {
    if (registration) {
      // Unregister the previous registration (if any) before replacing.
      unregisterRef.current?.();
      unregisterRef.current = register(registration);
    } else {
      unregisterRef.current?.();
      unregisterRef.current = null;
    }

    return () => {
      unregisterRef.current?.();
      unregisterRef.current = null;
    };
  }, [registration, register]);
}
