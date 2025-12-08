/**
 * useOverlay Hook Unit Tests
 *
 * Tests for the overlay hook that manages overlay state in Canva.
 * Mocks @canva/design overlay and @canva/platform appProcess APIs.
 *
 * @module utils/__tests__/use_overlay_hook.tests
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useOverlay } from "../use_overlay_hook";

// Mock @canva/design module
jest.mock("@canva/design", () => ({
  overlay: {
    registerOnCanOpen: jest.fn(),
  },
}));

// Mock @canva/platform module
jest.mock("@canva/platform", () => ({
  appProcess: {
    registerOnStateChange: jest.fn(),
    requestClose: jest.fn(),
  },
}));

import { overlay as designOverlay } from "@canva/design";
import { appProcess } from "@canva/platform";

const mockRegisterOnCanOpen = designOverlay.registerOnCanOpen as jest.MockedFunction<
  typeof designOverlay.registerOnCanOpen
>;
const mockRegisterOnStateChange = appProcess.registerOnStateChange as jest.MockedFunction<
  typeof appProcess.registerOnStateChange
>;
const mockRequestClose = appProcess.requestClose as jest.MockedFunction<
  typeof appProcess.requestClose
>;

describe("useOverlay", () => {
  let mockCanOpenDisposer: jest.Mock;
  let onCanOpenCallback: ((event: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanOpenDisposer = jest.fn();
    onCanOpenCallback = null;

    // Capture the onCanOpen callback
    mockRegisterOnCanOpen.mockImplementation((opts) => {
      onCanOpenCallback = opts.onCanOpen;
      return mockCanOpenDisposer;
    });

    mockRegisterOnStateChange.mockImplementation(() => jest.fn());
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe("Initial State", () => {
    it("should return canOpen as false initially", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      expect(result.current.canOpen).toBe(false);
    });

    it("should return isOpen as false initially", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      expect(result.current.isOpen).toBe(false);
    });

    it("should return open function", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      expect(typeof result.current.open).toBe("function");
    });

    it("should return close function", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      expect(typeof result.current.close).toBe("function");
    });

    it("should register for canOpen changes on mount", () => {
      renderHook(() => useOverlay("image_selection"));

      expect(mockRegisterOnCanOpen).toHaveBeenCalledWith({
        target: "image_selection",
        onCanOpen: expect.any(Function),
      });
    });
  });

  // =========================================================================
  // canOpen State Tests
  // =========================================================================

  describe("canOpen State", () => {
    it("should update canOpen when event is received", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      expect(result.current.canOpen).toBe(false);

      // Simulate canOpen event
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: jest.fn(),
          });
        }
      });

      expect(result.current.canOpen).toBe(true);
    });

    it("should update canOpen to false when event indicates", () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      // First set to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: jest.fn(),
          });
        }
      });

      expect(result.current.canOpen).toBe(true);

      // Then set to false
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: false,
            reason: "Element not selected",
          });
        }
      });

      expect(result.current.canOpen).toBe(false);
    });
  });

  // =========================================================================
  // Open Function Tests
  // =========================================================================

  describe("Open Function", () => {
    it("should return undefined if canOpen is false", async () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      const overlayId = await result.current.open();

      expect(overlayId).toBeUndefined();
    });

    it("should call overlay.open when canOpen is true", async () => {
      const mockOpen = jest.fn().mockResolvedValue("overlay-123");

      const { result } = renderHook(() => useOverlay("image_selection"));

      // Set canOpen to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: mockOpen,
          });
        }
      });

      await act(async () => {
        await result.current.open();
      });

      expect(mockOpen).toHaveBeenCalled();
    });

    it("should pass launch parameters to open", async () => {
      const mockOpen = jest.fn().mockResolvedValue("overlay-123");

      const { result } = renderHook(() => useOverlay("image_selection"));

      // Set canOpen to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: mockOpen,
          });
        }
      });

      const launchParams = { data: "test" };

      await act(async () => {
        await result.current.open({ launchParameters: launchParams });
      });

      expect(mockOpen).toHaveBeenCalledWith({
        launchParameters: launchParams,
      });
    });

    it("should return overlay ID on success", async () => {
      const mockOpen = jest.fn().mockResolvedValue("overlay-123");

      const { result } = renderHook(() => useOverlay("image_selection"));

      // Set canOpen to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: mockOpen,
          });
        }
      });

      let overlayId: string | undefined;
      await act(async () => {
        overlayId = await result.current.open();
      });

      expect(overlayId).toBe("overlay-123");
    });
  });

  // =========================================================================
  // Close Function Tests
  // =========================================================================

  describe("Close Function", () => {
    it("should call requestClose with overlay ID", async () => {
      const mockOpen = jest.fn().mockResolvedValue("overlay-123");

      const { result } = renderHook(() => useOverlay("image_selection"));

      // Set canOpen to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: mockOpen,
          });
        }
      });

      // Open the overlay first
      await act(async () => {
        await result.current.open();
      });

      // Close it
      await act(async () => {
        await result.current.close({ reason: "completed" as any });
      });

      expect(mockRequestClose).toHaveBeenCalledWith("overlay-123", {
        reason: "completed",
      });
    });

    it("should not call requestClose if no overlay is open", async () => {
      const { result } = renderHook(() => useOverlay("image_selection"));

      await result.current.close({ reason: "completed" as any });

      expect(mockRequestClose).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // isOpen State Tests
  // =========================================================================

  describe("isOpen State", () => {
    it("should register for state changes when overlay is opened", async () => {
      const mockOpen = jest.fn().mockResolvedValue("overlay-123");

      const { result } = renderHook(() => useOverlay("image_selection"));

      // Set canOpen to true
      act(() => {
        if (onCanOpenCallback) {
          onCanOpenCallback({
            canOpen: true,
            open: mockOpen,
          });
        }
      });

      // Open the overlay
      await act(async () => {
        await result.current.open();
      });

      // Wait for state change registration
      await waitFor(() => {
        expect(mockRegisterOnStateChange).toHaveBeenCalledWith(
          "overlay-123",
          expect.any(Function)
        );
      });
    });
  });

  // =========================================================================
  // Cleanup Tests
  // =========================================================================

  describe("Cleanup", () => {
    it("should call disposer on unmount", () => {
      const { unmount } = renderHook(() => useOverlay("image_selection"));

      expect(mockCanOpenDisposer).not.toHaveBeenCalled();

      unmount();

      expect(mockCanOpenDisposer).toHaveBeenCalled();
    });
  });
});
