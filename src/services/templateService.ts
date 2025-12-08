/**
 * Template Serialization Service
 *
 * Provides utilities for extracting elements from a Canva page via openDesign API
 * and converting them to a format that can be recreated with addPage API.
 *
 * Key mappings:
 * - openDesign "rect" with fill.mediaContainer.image → addPage "image"
 * - openDesign "rect" with fill.colorContainer → addPage "shape" (rectangle)
 * - openDesign "shape" → addPage "shape"
 * - openDesign "text" → addPage "richtext" or "text"
 * - openDesign "embed" → addPage "embed"
 */

import { openDesign, createRichtextRange } from "@canva/design";
import type {
  SerializedTemplate,
  SerializedTemplateElement,
  SerializedRectElement,
  SerializedShapeElement,
  SerializedTextElement,
  SerializedEmbedElement,
  SerializedImageElement,
  SerializedFill,
  SerializedPath,
  SerializedTextRegion,
} from "../types";
import type {
  ImageRef,
  ImageElementAtPoint,
  TextElementAtPoint,
  ShapeElementAtPoint,
  EmbedElementAtPoint,
  RichtextElementAtPoint,
  ElementAtPoint,
} from "@canva/design";

// Value clamping utilities
const MIN_POSITION = -32768;
const MAX_POSITION = 32767;
const MIN_DIMENSION = 0;
const MAX_DIMENSION = 32767;
const MIN_ROTATION = -180;
const MAX_ROTATION = 180;

/**
 * Clamps a position value to valid Canva range
 */
const clampPosition = (value: number): number => {
  return Math.max(MIN_POSITION, Math.min(MAX_POSITION, Math.round(value)));
};

/**
 * Clamps a dimension value to valid Canva range
 */
const clampDimension = (value: number): number => {
  return Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, Math.round(value)));
};

/**
 * Normalizes rotation to -180 to 180 range
 */
const normalizeRotation = (rotation: number): number => {
  let normalized = rotation % 360;
  if (normalized > MAX_ROTATION) {
    normalized -= 360;
  } else if (normalized < MIN_ROTATION) {
    normalized += 360;
  }
  return normalized;
};

/**
 * Converts RGB 0-255 values to hex color string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Converts hex color string to RGB object
 * @param hex Color string like "#ff0099"
 * @returns RGB object or null if invalid
 */
const hexToRgb = (hex: string): { red: number; green: number; blue: number } | null => {
  // Handle hex strings like "#ff0099" or "ff0099"
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleanHex.length !== 6) return null;
  
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  
  return { red: r, green: g, blue: b };
};

/**
 * Extracts template data from the current page using openDesign API
 * @returns Promise with serialized template data
 */
export async function extractTemplateFromCurrentPage(): Promise<SerializedTemplate | null> {
  try {
    let templateData: SerializedTemplate | null = null;

    await openDesign({ type: "current_page" }, async (session) => {
      if (session.page.type !== "absolute") {
        console.warn("Page is not an absolute page type");
        return;
      }

      const allElements = session.page.elements.toArray();
      const serializedElements: SerializedTemplateElement[] = [];

      console.log(
        `[TemplateService] Extracting ${allElements.length} elements from page`
      );

      for (const element of allElements) {
        try {
          const serialized = await serializeElement(element);
          if (serialized) {
            serializedElements.push(serialized);
            console.log(
              `[TemplateService] Serialized ${element.type} element`
            );
          } else {
            console.log(
              `[TemplateService] Skipped unsupported element type: ${element.type}`
            );
          }
        } catch (e) {
          console.error(
            `[TemplateService] Error serializing element:`,
            e
          );
        }
      }

      // Get page dimensions from the session if available
      const pageWidth = 800; // Default, will be updated from context
      const pageHeight = 600; // Default

      templateData = {
        elements: serializedElements,
        pageWidth,
        pageHeight,
      };

      console.log(
        `[TemplateService] Extracted ${serializedElements.length} elements`
      );
    });

    return templateData;
  } catch (e) {
    console.error("[TemplateService] Error extracting template:", e);
    return null;
  }
}

/**
 * Serializes a single element from openDesign to our storable format
 */
async function serializeElement(
  element: unknown
): Promise<SerializedTemplateElement | null> {
  const el = element as {
    type: string;
    width: number;
    height: number;
    top: number;
    left: number;
    rotation: number;
    transparency?: number;
    locked?: boolean;
    fill?: unknown;
    stroke?: unknown;
    viewBox?: unknown;
    paths?: unknown;
    text?: unknown;
    url?: string;
  };

  const baseProps = {
    width: el.width,
    height: el.height,
    top: el.top,
    left: el.left,
    rotation: el.rotation,
    transparency: el.transparency ?? 0,
    locked: el.locked ?? false,
  };

  switch (el.type) {
    case "rect":
      return serializeRect(el, baseProps);
    case "shape":
      return serializeShape(el, baseProps);
    case "text":
      return await serializeText(el, baseProps);
    case "embed":
      return serializeEmbed(el, baseProps);
    case "group":
      // Groups are complex - for now skip them
      console.log("[TemplateService] Groups are not yet supported");
      return null;
    case "unsupported":
      console.log("[TemplateService] Element type is unsupported by Canva");
      return null;
    default:
      console.log(`[TemplateService] Unknown element type: ${el.type}`);
      return null;
  }
}

/**
 * Serializes a rect element
 * 
 * According to Canva API docs, the Fill type has:
 * - fill.colorContainer.ref = { type: "solid", color: "#ff0099" } (hex string!)
 * - fill.mediaContainer.ref = { type: "image", imageRef: ImageRef } or { type: "video", videoRef: VideoRef }
 */
function serializeRect(
  el: { fill?: unknown; stroke?: unknown },
  baseProps: {
    width: number;
    height: number;
    top: number;
    left: number;
    rotation: number;
    transparency: number;
    locked: boolean;
  }
): SerializedRectElement | SerializedImageElement | null {
  const fill = el.fill as {
    colorContainer?: { 
      ref?: { type: string; color: string } | null;  // color is a hex string like "#ff0099"
    };
    mediaContainer?: {
      ref?: { type: string; imageRef?: string; videoRef?: string } | null;
    };
  } | undefined;

  // Check if this is an image (rect with media fill)
  if (fill?.mediaContainer?.ref?.type === "image" && fill?.mediaContainer?.ref?.imageRef) {
    const imageElement: SerializedImageElement = {
      type: "image",
      ...baseProps,
      ref: fill.mediaContainer.ref.imageRef,
    };
    return imageElement;
  }

  // It's a regular rect with color fill
  const rectElement: SerializedRectElement = {
    type: "rect",
    ...baseProps,
  };

  // colorContainer.ref.color is already a hex string like "#ff0099"
  if (fill?.colorContainer?.ref?.type === "solid" && fill?.colorContainer?.ref?.color) {
    const hexColor = fill.colorContainer.ref.color;
    // Parse hex color to RGB for our serialized format
    const rgb = hexToRgb(hexColor);
    if (rgb) {
      rectElement.fill = {
        type: "solid",
        color: rgb,
      };
    }
  }

  return rectElement;
}

/**
 * Serializes a shape element
 * 
 * According to Canva API docs for Path type:
 * - path.fill.colorContainer.ref = { type: "solid", color: "#ff0099" }
 * - path.fill.mediaContainer.ref = { type: "image", imageRef: ImageRef } or { type: "video", videoRef: VideoRef }
 */
function serializeShape(
  el: { viewBox?: unknown; paths?: unknown; fill?: unknown },
  baseProps: {
    width: number;
    height: number;
    top: number;
    left: number;
    rotation: number;
    transparency: number;
    locked: boolean;
  }
): SerializedShapeElement | null {
  const viewBox = el.viewBox as {
    top: number;
    left: number;
    width: number;
    height: number;
  } | undefined;

  if (!viewBox) {
    console.warn("[TemplateService] Shape missing viewBox");
    return null;
  }

  // In openDesign, paths is a ReadableList, need to convert with toArray()
  const pathsList = el.paths as {
    toArray?: () => Array<{
      d: string;
      fill?: {
        colorContainer?: { 
          ref?: { type: string; color: string } | null;
        };
        mediaContainer?: {
          ref?: { type: string; imageRef?: string; videoRef?: string } | null;
        };
      };
      stroke?: unknown;
    }>;
  } | undefined;

  let pathsArray: Array<{
    d: string;
    fill?: {
      colorContainer?: { 
        ref?: { type: string; color: string } | null;
      };
      mediaContainer?: {
        ref?: { type: string; imageRef?: string; videoRef?: string } | null;
      };
    };
    stroke?: unknown;
  }> = [];

  // Try to convert ReadableList to array
  if (pathsList?.toArray) {
    try {
      pathsArray = pathsList.toArray();
    } catch (e) {
      console.warn("[TemplateService] Could not convert paths to array:", e);
    }
  } else if (Array.isArray(pathsList)) {
    pathsArray = pathsList;
  }

  const serializedPaths: SerializedPath[] = [];
  for (const path of pathsArray) {
    const serializedPath: SerializedPath = {
      d: path.d,
    };
    
    // Read color from path.fill.colorContainer.ref.color (hex string)
    if (path.fill?.colorContainer?.ref?.type === "solid" && path.fill?.colorContainer?.ref?.color) {
      const hexColor = path.fill.colorContainer.ref.color;
      const rgb = hexToRgb(hexColor);
      if (rgb) {
        serializedPath.fill = {
          type: "solid",
          color: rgb,
        };
      }
    }
    serializedPaths.push(serializedPath);
  }

  return {
    type: "shape",
    ...baseProps,
    viewBox: {
      top: viewBox.top,
      left: viewBox.left,
      width: viewBox.width,
      height: viewBox.height,
    },
    paths: serializedPaths,
  };
}

/**
 * Serializes a text element
 */
async function serializeText(
  el: { text?: unknown },
  baseProps: {
    width: number;
    height: number;
    top: number;
    left: number;
    rotation: number;
    transparency: number;
    locked: boolean;
  }
): Promise<SerializedTextElement | null> {
  const textRange = el.text as {
    readPlaintext?: () => string;
    readTextRegions?: () => Array<{
      text: string;
      formatting?: {
        color?: string;
        fontWeight?: string;
        fontStyle?: string;
        fontSize?: number;
        decoration?: string;
        strikethrough?: string;
        textAlign?: string;
        fontRef?: string;
      };
    }>;
  } | undefined;

  if (!textRange || !textRange.readPlaintext) {
    console.warn("[TemplateService] Text element missing text range");
    return null;
  }

  const plainText = textRange.readPlaintext();
  const regions: SerializedTextRegion[] = [];

  if (textRange.readTextRegions) {
    try {
      const textRegions = textRange.readTextRegions();
      for (const region of textRegions) {
        regions.push({
          text: region.text,
          color: region.formatting?.color, // hex string like "#ff0099"
          fontWeight: region.formatting?.fontWeight,
          fontStyle: region.formatting?.fontStyle,
          fontSize: region.formatting?.fontSize,
          textDecoration: region.formatting?.decoration,
          strikethrough: region.formatting?.strikethrough === "strikethrough",
          textAlign: region.formatting?.textAlign,
        });
      }
    } catch (e) {
      console.warn("[TemplateService] Could not read text regions:", e);
    }
  }

  return {
    type: "text",
    ...baseProps,
    plainText,
    regions: regions.length > 0 ? regions : [{ text: plainText }],
  };
}

/**
 * Serializes an embed element
 */
function serializeEmbed(
  el: { url?: string },
  baseProps: {
    width: number;
    height: number;
    top: number;
    left: number;
    rotation: number;
    transparency: number;
    locked: boolean;
  }
): SerializedEmbedElement | null {
  if (!el.url) {
    console.warn("[TemplateService] Embed element missing URL");
    return null;
  }

  return {
    type: "embed",
    ...baseProps,
    url: el.url,
  };
}

/**
 * Converts serialized template elements to addPage-compatible format
 * @param template The serialized template
 * @param excludeFrameRefs Array of image refs that are frame placeholders (should be excluded)
 * @returns Array of elements compatible with addPage API
 */
export function convertTemplateToPageElements(
  template: SerializedTemplate,
  excludeFrameRefs: string[] = []
): ElementAtPoint[] {
  const elements: ElementAtPoint[] = [];

  for (const el of template.elements) {
    // Skip frame placeholder images
    if (el.type === "image" && excludeFrameRefs.includes(el.ref)) {
      console.log(
        "[TemplateService] Skipping frame placeholder image"
      );
      continue;
    }

    const pageElement = convertElementToPageFormat(el);
    if (pageElement) {
      elements.push(pageElement);
    }
  }

  return elements;
}

/**
 * Converts a single serialized element to addPage format
 */
function convertElementToPageFormat(
  el: SerializedTemplateElement
): ElementAtPoint | null {
  const basePosition = {
    top: clampPosition(el.top),
    left: clampPosition(el.left),
    width: clampDimension(el.width),
    height: clampDimension(el.height),
    rotation: normalizeRotation(el.rotation),
  };

  switch (el.type) {
    case "image":
      return convertImageElement(el, basePosition);
    case "rect":
      return convertRectElement(el, basePosition);
    case "shape":
      return convertShapeElement(el, basePosition);
    case "text":
      return convertTextElement(el, basePosition);
    case "embed":
      return convertEmbedElement(el, basePosition);
    default:
      console.warn(
        `[TemplateService] Unknown element type for conversion: ${(el as { type: string }).type}`
      );
      return null;
  }
}

/**
 * Converts a serialized image element to addPage format
 */
function convertImageElement(
  el: SerializedImageElement,
  pos: { top: number; left: number; width: number; height: number; rotation: number }
): ImageElementAtPoint {
  return {
    type: "image",
    ref: el.ref as ImageRef,
    altText: undefined,
    top: pos.top,
    left: pos.left,
    width: pos.width,
    height: pos.height,
    rotation: pos.rotation,
  };
}

/**
 * Converts a serialized rect element to addPage shape format
 * (Canva addPage doesn't have "rect", we use "shape" with rectangle path)
 */
function convertRectElement(
  el: SerializedRectElement,
  pos: { top: number; left: number; width: number; height: number; rotation: number }
): ShapeElementAtPoint {
  // Create a rectangle path
  const w = el.width;
  const h = el.height;
  const rectPath = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;

  // Get fill color
  let fillColor = "#808080"; // Default gray
  if (el.fill?.type === "solid") {
    fillColor = rgbToHex(el.fill.color.red, el.fill.color.green, el.fill.color.blue);
  }

  return {
    type: "shape",
    viewBox: {
      top: 0,
      left: 0,
      width: w,
      height: h,
    },
    paths: [
      {
        d: rectPath,
        fill: {
          color: fillColor,
          dropTarget: false,
        },
      },
    ],
    top: pos.top,
    left: pos.left,
    width: pos.width,
    height: pos.height,
    rotation: pos.rotation,
  };
}

/**
 * Converts a serialized shape element to addPage format
 */
function convertShapeElement(
  el: SerializedShapeElement,
  pos: { top: number; left: number; width: number; height: number; rotation: number }
): ShapeElementAtPoint {
  const paths = el.paths.map((path) => {
    let fillColor = "#808080";
    if (path.fill?.type === "solid") {
      fillColor = rgbToHex(
        path.fill.color.red,
        path.fill.color.green,
        path.fill.color.blue
      );
    }
    return {
      d: path.d,
      fill: {
        color: fillColor,
        dropTarget: false,
      },
    };
  });

  // Ensure at least one path
  if (paths.length === 0) {
    const w = el.viewBox.width;
    const h = el.viewBox.height;
    paths.push({
      d: `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
      fill: { color: "#808080", dropTarget: false },
    });
  }

  return {
    type: "shape",
    viewBox: {
      top: el.viewBox.top,
      left: el.viewBox.left,
      width: el.viewBox.width,
      height: el.viewBox.height,
    },
    paths,
    top: pos.top,
    left: pos.left,
    width: pos.width,
    height: pos.height,
    rotation: pos.rotation,
  };
}

/**
 * Converts a serialized text element to addPage format
 * Uses simple text format for basic text, richtext for complex formatting
 */
function convertTextElement(
  el: SerializedTextElement,
  pos: { top: number; left: number; width: number; height: number; rotation: number }
): TextElementAtPoint | RichtextElementAtPoint {
  // For simple text (single region, no complex formatting), use text element
  if (el.regions.length <= 1) {
    const region = el.regions[0];
    const textElement: TextElementAtPoint = {
      type: "text",
      children: [el.plainText],
      top: pos.top,
      left: pos.left,
      width: pos.width,
      rotation: pos.rotation,
    };

    if (region?.fontSize) {
      textElement.fontSize = Math.min(100, Math.max(1, region.fontSize));
    }
    if (region?.fontWeight) {
      textElement.fontWeight = region.fontWeight as TextElementAtPoint["fontWeight"];
    }
    if (region?.fontStyle) {
      textElement.fontStyle = region.fontStyle as TextElementAtPoint["fontStyle"];
    }
    if (region?.color) {
      textElement.color = region.color;
    }
    if (region?.textAlign) {
      textElement.textAlign = region.textAlign as TextElementAtPoint["textAlign"];
    }

    return textElement;
  }

  // For complex text with multiple regions, use richtext
  const range = createRichtextRange();
  for (const region of el.regions) {
    const formatting: Record<string, unknown> = {};
    if (region.color) formatting.color = region.color;
    if (region.fontWeight) formatting.fontWeight = region.fontWeight;
    if (region.fontStyle) formatting.fontStyle = region.fontStyle;
    if (region.fontSize) formatting.fontSize = region.fontSize;
    if (region.textDecoration) formatting.decoration = region.textDecoration;
    if (region.strikethrough) formatting.strikethrough = "strikethrough";

    range.appendText(region.text, formatting as Parameters<typeof range.appendText>[1]);
  }

  return {
    type: "richtext",
    range,
    top: pos.top,
    left: pos.left,
    width: pos.width,
    rotation: pos.rotation,
  };
}

/**
 * Converts a serialized embed element to addPage format
 */
function convertEmbedElement(
  el: SerializedEmbedElement,
  pos: { top: number; left: number; width: number; height: number; rotation: number }
): EmbedElementAtPoint {
  return {
    type: "embed",
    url: el.url,
    top: pos.top,
    left: pos.left,
    width: pos.width,
    height: pos.height,
    rotation: pos.rotation,
  };
}
