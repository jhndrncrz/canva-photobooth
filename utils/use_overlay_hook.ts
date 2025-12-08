/**
 * @file useOverlay Hook
 * @description React hook for managing Canva app overlays.
 * 
 * Overlays are UI panels that can be opened on top of the Canva editor,
 * useful for multi-step workflows, image selection, or configuration screens.
 * This hook handles overlay lifecycle, state tracking, and cleanup.
 * 
 * @example
 * ```tsx
 * const overlay = useOverlay("image_selection");
 * 
 * // Check if we can open the overlay
 * if (overlay.canOpen) {
 *   // Open the overlay
 *   await overlay.open({ launchParameters: { mode: "select" } });
 * }
 * 
 * // Check if overlay is currently open
 * if (overlay.isOpen) {
 *   // Close the overlay
 *   await overlay.close({ reason: "completed" });
 * }
 * ```
 * 
 * @see https://www.canva.dev/docs/apps/overlays/
 */

import type {
  AppProcessId,
  OverlayOpenableEvent,
  OverlayTarget,
} from "@canva/design";
import { overlay as designOverlay } from "@canva/design";
import type { CloseParams } from "@canva/platform";
import { appProcess } from "@canva/platform";
import { useEffect, useState } from "react";

/** Initial state when no overlay is open */
const initialOverlayEvent: OverlayOpenableEvent<OverlayTarget> = {
  canOpen: false,
  reason: "",
};

/**
 * Hook for managing Canva app overlays.
 * 
 * Provides a complete interface for opening, closing, and tracking
 * overlay state. Automatically handles cleanup when the component unmounts.
 * 
 * @template T - The overlay target type (e.g., "image_selection")
 * @template C - The close params type (defaults to CloseParams)
 * @param target - The overlay target to register for. Determines what type
 *                 of overlay can be opened and what data it can access.
 * @returns An object containing:
 *          - `canOpen`: Whether the overlay can be opened (depends on context)
 *          - `isOpen`: Whether the overlay is currently open
 *          - `open(opts?)`: Async function to open the overlay
 *          - `close(opts)`: Async function to close the overlay
 * 
 * @example
 * ```tsx
 * function ImagePicker() {
 *   const { canOpen, isOpen, open, close } = useOverlay("image_selection");
 *   
 *   return (
 *     <Button 
 *       disabled={!canOpen}
 *       onClick={() => open({ launchParameters: { maxImages: 5 } })}
 *     >
 *       {isOpen ? "Selecting..." : "Select Images"}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useOverlay<
  T extends OverlayTarget,
  C extends CloseParams = CloseParams,
>(
  target: T,
): {
  canOpen: boolean;
  isOpen: boolean;
  open: (opts?: {
    launchParameters?: unknown;
  }) => Promise<AppProcessId | undefined>;
  close: (opts: C) => Promise<void>;
} {
  const [overlay, setOverlay] =
    useState<OverlayOpenableEvent<T>>(initialOverlayEvent);
  const [overlayId, setOverlayId] = useState<AppProcessId>();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    return designOverlay.registerOnCanOpen({
      target,
      onCanOpen: setOverlay,
    });
  }, []);

  useEffect(() => {
    if (overlayId) {
      appProcess.registerOnStateChange(overlayId, ({ state }) =>
        setIsOpen(state === "open"),
      );
    }
  }, [overlayId]);

  const open = async (
    opts: { launchParameters?: unknown } = {},
  ): Promise<AppProcessId | undefined> => {
    if (!overlay || !overlay.canOpen) {
      return undefined;
    }

    const overlayId = await overlay.open(opts);
    setOverlayId(overlayId);
    return overlayId;
  };

  const close = async (opts: C) => {
    if (overlayId) {
      appProcess.requestClose<C>(overlayId, opts);
    }
  };

  return { canOpen: overlay.canOpen, isOpen, open, close };
}
