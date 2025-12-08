/**
 * @file useSelection Hook
 * @description React hook for listening to Canva canvas element selection changes.
 * 
 * This hook integrates with the Canva Design SDK to provide real-time updates
 * when users select elements on the canvas. It's commonly used to:
 * - Detect when image elements are selected for frame configuration
 * - Read properties of selected elements
 * - Enable/disable UI based on current selection
 * 
 * @example
 * ```tsx
 * const imageSelection = useSelection("image");
 * 
 * // Check if images are selected
 * if (imageSelection.count > 0) {
 *   // Read the selected images
 *   const { contents } = await imageSelection.read();
 *   console.log("Selected images:", contents);
 * }
 * ```
 * 
 * @see https://www.canva.dev/docs/apps/reading-elements/
 */

import { selection as designSelection } from "@canva/design";
import type { SelectionEvent, SelectionScope } from "@canva/design";
import { useEffect, useState } from "react";

/**
 * Hook for monitoring canvas element selection changes.
 * 
 * Returns a selection event object that updates reactively when the user
 * selects or deselects elements of the specified type on the canvas.
 * 
 * @template S - The selection scope type (e.g., "image", "richtext", "plaintext")
 * @param scope - The type of content to listen for selection changes on.
 *                Valid scopes include "image", "richtext", "plaintext", etc.
 * @returns A SelectionEvent object containing:
 *          - `scope`: The selection scope type
 *          - `count`: Number of currently selected elements
 *          - `read()`: Async function to read the selected content
 * 
 * @example
 * ```tsx
 * function FrameSelector() {
 *   const selection = useSelection("image");
 *   
 *   return (
 *     <div>
 *       <Text>{selection.count} images selected</Text>
 *       <Button 
 *         disabled={selection.count === 0}
 *         onClick={async () => {
 *           const { contents } = await selection.read();
 *           // Process selected images...
 *         }}
 *       >
 *         Add Selected as Frames
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSelection<S extends SelectionScope>(
  scope: S,
): SelectionEvent<S> {
  const [selection, setSelection] = useState<SelectionEvent<S>>({
    scope,
    count: 0,
    read() {
      return Promise.resolve({
        contents: Object.freeze([]),
        save() {
          return Promise.resolve();
        },
      });
    },
  });

  useEffect(() => {
    const disposer = designSelection.registerOnChange({
      scope,
      onChange: setSelection,
    });
    return disposer;
  }, [scope]);

  return selection;
}
