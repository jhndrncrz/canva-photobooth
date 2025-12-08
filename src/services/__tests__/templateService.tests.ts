/**
 * TemplateService Unit Tests
 *
 * Tests for template element extraction and conversion functionality.
 */

import {
  extractTemplateFromCurrentPage,
  convertTemplateToPageElements,
} from "../templateService";
import type {
  SerializedTemplate,
  SerializedRectElement,
  SerializedShapeElement,
  SerializedTextElement,
  SerializedEmbedElement,
  SerializedImageElement,
} from "../../types";

// Mock @canva/design
jest.mock("@canva/design", () => ({
  openDesign: jest.fn(),
  createRichtextRange: jest.fn(() => ({
    appendText: jest.fn(),
    formatParagraph: jest.fn(),
    formatText: jest.fn(),
  })),
}));

describe("templateService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("convertTemplateToPageElements", () => {
    it("should convert an empty template to empty array", () => {
      const template: SerializedTemplate = {
        elements: [],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toEqual([]);
    });

    it("should convert a rect element with solid fill to shape", () => {
      const rectElement: SerializedRectElement = {
        type: "rect",
        width: 200,
        height: 100,
        top: 50,
        left: 100,
        rotation: 0,
        transparency: 0,
        locked: false,
        fill: {
          type: "solid",
          color: { red: 255, green: 0, blue: 0 },
        },
      };

      const template: SerializedTemplate = {
        elements: [rectElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0]!;
      expect(converted.type).toBe("shape");
      expect(converted.top).toBe(50);
      expect(converted.left).toBe(100);
      expect(converted.width).toBe(200);
      expect((converted as { height: number }).height).toBe(100);
    });

    it("should convert an image element", () => {
      const imageElement: SerializedImageElement = {
        type: "image",
        width: 300,
        height: 200,
        top: 100,
        left: 150,
        rotation: 45,
        transparency: 0,
        locked: false,
        ref: "test-image-ref",
      };

      const template: SerializedTemplate = {
        elements: [imageElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0]!;
      expect(converted.type).toBe("image");
      expect(converted.top).toBe(100);
      expect(converted.left).toBe(150);
      expect(converted.rotation).toBe(45);
    });

    it("should exclude frame placeholder images", () => {
      const imageElement: SerializedImageElement = {
        type: "image",
        width: 300,
        height: 200,
        top: 100,
        left: 150,
        rotation: 0,
        transparency: 0,
        locked: false,
        ref: "frame-placeholder-ref",
      };

      const template: SerializedTemplate = {
        elements: [imageElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template, ["frame-placeholder-ref"]);
      expect(result).toHaveLength(0);
    });

    it("should convert a shape element", () => {
      const shapeElement: SerializedShapeElement = {
        type: "shape",
        width: 100,
        height: 100,
        top: 200,
        left: 200,
        rotation: 0,
        transparency: 0,
        locked: false,
        viewBox: { top: 0, left: 0, width: 100, height: 100 },
        paths: [
          {
            d: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
            fill: {
              type: "solid",
              color: { red: 0, green: 255, blue: 0 },
            },
          },
        ],
      };

      const template: SerializedTemplate = {
        elements: [shapeElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0] as { type: string; paths: unknown[] };
      expect(converted.type).toBe("shape");
      expect(converted.paths).toBeDefined();
    });

    it("should convert a text element to text format", () => {
      const textElement: SerializedTextElement = {
        type: "text",
        width: 200,
        height: 50,
        top: 300,
        left: 100,
        rotation: 0,
        transparency: 0,
        locked: false,
        plainText: "Hello World",
        regions: [{ text: "Hello World" }],
      };

      const template: SerializedTemplate = {
        elements: [textElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0] as { type: string; children: string[] };
      expect(converted.type).toBe("text");
      expect(converted.children).toEqual(["Hello World"]);
    });

    it("should convert an embed element", () => {
      const embedElement: SerializedEmbedElement = {
        type: "embed",
        width: 640,
        height: 360,
        top: 100,
        left: 100,
        rotation: 0,
        transparency: 0,
        locked: false,
        url: "https://example.com/video",
      };

      const template: SerializedTemplate = {
        elements: [embedElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0] as { type: string; url: string };
      expect(converted.type).toBe("embed");
      expect(converted.url).toBe("https://example.com/video");
    });

    it("should clamp position values", () => {
      const rectElement: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: -50000, // Out of range
        left: 50000, // Out of range
        rotation: 0,
        transparency: 0,
        locked: false,
      };

      const template: SerializedTemplate = {
        elements: [rectElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0]!;
      expect(converted.top).toBe(-32768); // Clamped
      expect(converted.left).toBe(32767); // Clamped
    });

    it("should normalize rotation to -180 to 180 range", () => {
      const rectElement: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 270, // Should become -90
        transparency: 0,
        locked: false,
      };

      const template: SerializedTemplate = {
        elements: [rectElement],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(1);

      const converted = result[0]!;
      expect(converted.rotation).toBe(-90);
    });

    it("should convert multiple elements preserving order", () => {
      const rect: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 0,
        transparency: 0,
        locked: false,
        fill: { type: "solid", color: { red: 255, green: 0, blue: 0 } },
      };

      const text: SerializedTextElement = {
        type: "text",
        width: 200,
        height: 50,
        top: 100,
        left: 100,
        rotation: 0,
        transparency: 0,
        locked: false,
        plainText: "Test",
        regions: [{ text: "Test" }],
      };

      const template: SerializedTemplate = {
        elements: [rect, text],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      expect(result).toHaveLength(2);
      expect(result[0]!.type).toBe("shape"); // rect becomes shape
      expect(result[1]!.type).toBe("text");
    });
  });

  describe("extractTemplateFromCurrentPage", () => {
    it("should return null when openDesign fails", async () => {
      const { openDesign } = require("@canva/design");
      openDesign.mockRejectedValue(new Error("API error"));

      const result = await extractTemplateFromCurrentPage();
      expect(result).toBeNull();
    });

    it("should extract elements from absolute page", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "rect",
          width: 200,
          height: 100,
          top: 0,
          left: 0,
          rotation: 0,
          transparency: 0,
          locked: false,
          fill: {
            colorContainer: {
              ref: { type: "solid", color: "#ff0000" },
            },
          },
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(1);
    });

    it("should handle non-absolute page type", async () => {
      const { openDesign } = require("@canva/design");

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: { page: { type: string } }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "relative",
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).toBeNull();
    });

    it("should serialize rect with image fill as image element", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "rect",
          width: 300,
          height: 200,
          top: 50,
          left: 100,
          rotation: 0,
          transparency: 0,
          locked: false,
          fill: {
            mediaContainer: {
              ref: { type: "image", imageRef: "image-ref-123" },
            },
          },
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(1);
      expect(result!.elements[0]!.type).toBe("image");
      expect((result!.elements[0]! as SerializedImageElement).ref).toBe(
        "image-ref-123"
      );
    });

    it("should serialize text element with regions", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "text",
          width: 200,
          height: 50,
          top: 100,
          left: 100,
          rotation: 0,
          transparency: 0,
          locked: false,
          text: {
            readPlaintext: () => "Hello World",
            readTextRegions: () => [
              {
                text: "Hello ",
                formatting: { fontWeight: "bold" },
              },
              {
                text: "World",
                formatting: { color: "#FF0000" },
              },
            ],
          },
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(1);
      expect(result!.elements[0]!.type).toBe("text");

      const textEl = result!.elements[0]! as SerializedTextElement;
      expect(textEl.plainText).toBe("Hello World");
      expect(textEl.regions).toHaveLength(2);
    });

    it("should serialize embed element", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "embed",
          width: 640,
          height: 360,
          top: 100,
          left: 100,
          rotation: 0,
          transparency: 0,
          locked: false,
          url: "https://youtube.com/watch?v=123",
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(1);
      expect(result!.elements[0]!.type).toBe("embed");
      expect((result!.elements[0]! as SerializedEmbedElement).url).toBe(
        "https://youtube.com/watch?v=123"
      );
    });

    it("should skip unsupported element types", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "unsupported",
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          rotation: 0,
        },
        {
          type: "group",
          width: 200,
          height: 200,
          top: 100,
          left: 100,
          rotation: 0,
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(0);
    });

    it("should serialize shape element with paths", async () => {
      const { openDesign } = require("@canva/design");

      const mockElements = [
        {
          type: "shape",
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          rotation: 0,
          transparency: 0,
          locked: false,
          viewBox: { top: 0, left: 0, width: 100, height: 100 },
          paths: {
            toArray: () => [
              {
                d: "M 0 0 L 100 0 L 100 100 Z",
                fill: {
                  colorContainer: {
                    ref: { type: "solid", color: "#0080ff" },
                  },
                },
              },
            ],
          },
        },
      ];

      openDesign.mockImplementation(
        async (
          _options: unknown,
          callback: (session: {
            page: { type: string; elements: { toArray: () => unknown[] } };
          }) => Promise<void>
        ) => {
          await callback({
            page: {
              type: "absolute",
              elements: {
                toArray: () => mockElements,
              },
            },
          });
        }
      );

      const result = await extractTemplateFromCurrentPage();
      expect(result).not.toBeNull();
      expect(result?.elements).toHaveLength(1);
      expect(result!.elements[0]!.type).toBe("shape");

      const shapeEl = result!.elements[0]! as SerializedShapeElement;
      expect(shapeEl.viewBox).toBeDefined();
      expect(shapeEl.paths).toHaveLength(1);
    });
  });

  describe("color conversion", () => {
    it("should convert RGB values to hex color", () => {
      // Test via rect conversion
      const rect: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 0,
        transparency: 0,
        locked: false,
        fill: {
          type: "solid",
          color: { red: 255, green: 128, blue: 0 }, // Orange
        },
      };

      const template: SerializedTemplate = {
        elements: [rect],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      const shape = result[0] as {
        paths: Array<{ fill: { color: string } }>;
      };
      expect(shape.paths[0]!.fill.color).toBe("#ff8000");
    });

    it("should clamp RGB values to 0-255 range", () => {
      const rect: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 0,
        transparency: 0,
        locked: false,
        fill: {
          type: "solid",
          color: { red: 300, green: -10, blue: 127.5 }, // Out of range
        },
      };

      const template: SerializedTemplate = {
        elements: [rect],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      const shape = result[0] as {
        paths: Array<{ fill: { color: string } }>;
      };
      // Should clamp to valid hex
      expect(shape.paths[0]!.fill.color).toBe("#ff0080");
    });
  });

  describe("default values", () => {
    it("should use default gray color for rect without fill", () => {
      const rect: SerializedRectElement = {
        type: "rect",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 0,
        transparency: 0,
        locked: false,
        // No fill specified
      };

      const template: SerializedTemplate = {
        elements: [rect],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      const shape = result[0] as {
        paths: Array<{ fill: { color: string } }>;
      };
      expect(shape.paths[0]!.fill.color).toBe("#808080"); // Default gray
    });

    it("should add default path for shape with empty paths", () => {
      const shape: SerializedShapeElement = {
        type: "shape",
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotation: 0,
        transparency: 0,
        locked: false,
        viewBox: { top: 0, left: 0, width: 100, height: 100 },
        paths: [], // Empty paths
      };

      const template: SerializedTemplate = {
        elements: [shape],
        pageWidth: 800,
        pageHeight: 600,
      };

      const result = convertTemplateToPageElements(template);
      const converted = result[0] as { paths: unknown[] };
      expect(converted.paths).toHaveLength(1); // Default rectangle path added
    });
  });
});
