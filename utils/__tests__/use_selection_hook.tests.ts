/**
 * useSelection Hook Unit Tests
 *
 * Tests for the selection hook that tracks user selections in Canva.
 * Mocks @canva/design selection API.
 *
 * @module utils/__tests__/use_selection_hook.tests
 */

import { renderHook, act } from "@testing-library/react";
import { useSelection } from "../use_selection_hook";

// Mock @canva/design module
jest.mock("@canva/design", () => ({
  selection: {
    registerOnChange: jest.fn(),
  },
}));

import { selection as designSelection } from "@canva/design";

const mockRegisterOnChange = designSelection.registerOnChange as jest.MockedFunction<
  typeof designSelection.registerOnChange
>;

describe("useSelection", () => {
  let mockDisposer: jest.Mock;
  let onChangeCallback: ((event: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisposer = jest.fn();
    onChangeCallback = null;

    // Capture the onChange callback when registerOnChange is called
    mockRegisterOnChange.mockImplementation((opts) => {
      onChangeCallback = opts.onChange;
      return mockDisposer;
    });
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe("Initial State", () => {
    it("should return initial selection state with count 0", () => {
      const { result } = renderHook(() => useSelection("image"));

      expect(result.current.scope).toBe("image");
      expect(result.current.count).toBe(0);
    });

    it("should have a read function", () => {
      const { result } = renderHook(() => useSelection("image"));

      expect(typeof result.current.read).toBe("function");
    });

    it("should register for selection changes on mount", () => {
      renderHook(() => useSelection("image"));

      expect(mockRegisterOnChange).toHaveBeenCalledWith({
        scope: "image",
        onChange: expect.any(Function),
      });
    });
  });

  // =========================================================================
  // Scope Tests
  // =========================================================================

  describe("Scope Handling", () => {
    it("should register with correct scope for image", () => {
      renderHook(() => useSelection("image"));

      expect(mockRegisterOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "image" })
      );
    });

    it("should register with correct scope for richtext", () => {
      renderHook(() => useSelection("richtext"));

      expect(mockRegisterOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "richtext" })
      );
    });

    it("should register with correct scope for video", () => {
      renderHook(() => useSelection("video"));

      expect(mockRegisterOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "video" })
      );
    });
  });

  // =========================================================================
  // Read Function Tests
  // =========================================================================

  describe("Read Function", () => {
    it("should return empty contents from initial read", async () => {
      const { result } = renderHook(() => useSelection("image"));

      const readResult = await result.current.read();

      expect(readResult.contents).toEqual([]);
      expect(Object.isFrozen(readResult.contents)).toBe(true);
    });

    it("should have a save function in read result", async () => {
      const { result } = renderHook(() => useSelection("image"));

      const readResult = await result.current.read();

      expect(typeof readResult.save).toBe("function");
    });

    it("should resolve save without error", async () => {
      const { result } = renderHook(() => useSelection("image"));

      const readResult = await result.current.read();

      await expect(readResult.save()).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // Selection Change Tests
  // =========================================================================

  describe("Selection Changes", () => {
    it("should update count when selection changes", () => {
      const { result } = renderHook(() => useSelection("image"));

      expect(result.current.count).toBe(0);

      // Simulate selection change
      act(() => {
        if (onChangeCallback) {
          onChangeCallback({
            scope: "image",
            count: 3,
            read: jest.fn().mockResolvedValue({
              contents: [{ id: "1" }, { id: "2" }, { id: "3" }],
              save: jest.fn(),
            }),
          });
        }
      });

      expect(result.current.count).toBe(3);
    });

    it("should update read function when selection changes", async () => {
      const { result } = renderHook(() => useSelection("image"));

      const mockContents = [
        { id: "img-1", ref: "ref-1" },
        { id: "img-2", ref: "ref-2" },
      ];

      // Simulate selection change
      act(() => {
        if (onChangeCallback) {
          onChangeCallback({
            scope: "image",
            count: 2,
            read: jest.fn().mockResolvedValue({
              contents: mockContents,
              save: jest.fn(),
            }),
          });
        }
      });

      const readResult = await result.current.read();
      expect(readResult.contents).toEqual(mockContents);
    });
  });

  // =========================================================================
  // Cleanup Tests
  // =========================================================================

  describe("Cleanup", () => {
    it("should call disposer on unmount", () => {
      const { unmount } = renderHook(() => useSelection("image"));

      expect(mockDisposer).not.toHaveBeenCalled();

      unmount();

      expect(mockDisposer).toHaveBeenCalled();
    });

    it("should re-register when scope changes", () => {
      const { rerender } = renderHook(
        ({ scope }) => useSelection(scope as any),
        { initialProps: { scope: "image" } }
      );

      expect(mockRegisterOnChange).toHaveBeenCalledTimes(1);

      rerender({ scope: "plaintext" });

      // Should have called disposer and registered again
      expect(mockDisposer).toHaveBeenCalled();
      expect(mockRegisterOnChange).toHaveBeenCalledTimes(2);
    });
  });
});
