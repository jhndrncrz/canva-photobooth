/**
 * @file useFeatureSupport Hook
 * @description React hook for detecting Canva SDK feature availability.
 * 
 * Different Canva contexts (editor, docs, whiteboard) support different SDK features.
 * This hook provides a reactive way to check feature support and re-render
 * components when the support state changes (e.g., when navigating between contexts).
 * 
 * @example
 * ```tsx
 * const isSupported = useFeatureSupport();
 * 
 * // Check if image selection is supported
 * if (isSupported("selection:read:image")) {
 *   // Show image selection UI
 * }
 * 
 * // Check multiple features at once
 * if (isSupported("addPage", "getDefaultPageDimensions")) {
 *   // Show multi-page features
 * }
 * ```
 * 
 * @see https://www.canva.dev/docs/apps/feature-support/
 */

import { features } from "@canva/platform";
import type { Feature } from "@canva/platform";
import { useEffect, useState } from "react";

/**
 * Hook for checking Canva SDK feature support reactively.
 * 
 * Returns a function that can be called with one or more feature names
 * to check if they are supported in the current Canva context.
 * The component will re-render if feature support changes.
 * 
 * @returns A function that accepts Feature names and returns true if all
 *          specified features are supported in the current context.
 * 
 * @example
 * ```tsx
 * function AdvancedFeatures() {
 *   const isSupported = useFeatureSupport();
 *   
 *   const canUseOverlays = isSupported("overlay:open");
 *   const canExport = isSupported("requestExport");
 *   
 *   return (
 *     <Rows spacing="2u">
 *       {canUseOverlays && <Button>Open Overlay</Button>}
 *       {canExport && <Button>Export Design</Button>}
 *       {!canUseOverlays && !canExport && (
 *         <Alert tone="info">
 *           Advanced features not available in this context.
 *         </Alert>
 *       )}
 *     </Rows>
 *   );
 * }
 * ```
 */
export function useFeatureSupport() {
  // Store a wrapped function that checks feature support
  const [isSupported, setIsSupported] = useState(() => {
    return (...args: Feature[]) => features.isSupported(...args);
  });

  useEffect(() => {
    // create new function ref when feature support changes to trigger
    // re-render
    return features.registerOnSupportChange(() => {
      setIsSupported(() => {
        return (...args: Feature[]) => features.isSupported(...args);
      });
    });
  }, []);

  return isSupported;
}
