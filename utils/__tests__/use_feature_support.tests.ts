/**
 * useFeatureSupport Hook Unit Tests
 *
 * Tests for the feature support hook that tracks Canva feature availability.
 * Mocks @canva/platform features API.
 *
 * @module utils/__tests__/use_feature_support.tests
 */

import { renderHook, act } from "@testing-library/react";
import { useFeatureSupport } from "../use_feature_support";

// Mock @canva/platform module
jest.mock("@canva/platform", () => ({
  features: {
    isSupported: jest.fn(),
    registerOnSupportChange: jest.fn(),
  },
}));

import { features } from "@canva/platform";

const mockIsSupported = features.isSupported as jest.MockedFunction<
  typeof features.isSupported
>;
const mockRegisterOnSupportChange =
  features.registerOnSupportChange as jest.MockedFunction<
    typeof features.registerOnSupportChange
  >;

describe("useFeatureSupport", () => {
  let mockDisposer: jest.Mock;
  let onSupportChangeCallback: (() => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisposer = jest.fn();
    onSupportChangeCallback = null;

    // Default mock - all features supported
    mockIsSupported.mockReturnValue(true);

    // Capture the callback when registerOnSupportChange is called
    mockRegisterOnSupportChange.mockImplementation((callback) => {
      onSupportChangeCallback = callback;
      return mockDisposer;
    });
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe("Initial State", () => {
    it("should return isSupported function", () => {
      const { result } = renderHook(() => useFeatureSupport());

      expect(typeof result.current).toBe("function");
    });

    it("should register for support changes on mount", () => {
      renderHook(() => useFeatureSupport());

      expect(mockRegisterOnSupportChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  // =========================================================================
  // Feature Support Tests
  // =========================================================================

  describe("Feature Support Checking", () => {
    it("should call features.isSupported when checking a feature", () => {
      const { result } = renderHook(() => useFeatureSupport());

      // Use any to bypass strict Feature type checking in tests
      (result.current as any)("feature:data-provider:images");

      expect(mockIsSupported).toHaveBeenCalledWith(
        "feature:data-provider:images"
      );
    });

    it("should return true when feature is supported", () => {
      mockIsSupported.mockReturnValue(true);

      const { result } = renderHook(() => useFeatureSupport());

      const isSupported = (result.current as any)("feature:data-provider:images");

      expect(isSupported).toBe(true);
    });

    it("should return false when feature is not supported", () => {
      mockIsSupported.mockReturnValue(false);

      const { result } = renderHook(() => useFeatureSupport());

      const isSupported = (result.current as any)("feature:data-provider:images");

      expect(isSupported).toBe(false);
    });

    it("should support checking multiple features", () => {
      mockIsSupported.mockReturnValue(true);

      const { result } = renderHook(() => useFeatureSupport());

      (result.current as any)(
        "feature:data-provider:images",
        "feature:data-provider:videos"
      );

      expect(mockIsSupported).toHaveBeenCalledWith(
        "feature:data-provider:images",
        "feature:data-provider:videos"
      );
    });
  });

  // =========================================================================
  // Support Change Tests
  // =========================================================================

  describe("Support Changes", () => {
    it("should update isSupported function when support changes", () => {
      const { result } = renderHook(() => useFeatureSupport());

      // Get initial function reference
      const initialFn = result.current;

      // Simulate support change
      act(() => {
        if (onSupportChangeCallback) {
          onSupportChangeCallback();
        }
      });

      // Function reference should change to trigger re-render
      expect(result.current).not.toBe(initialFn);
    });

    it("should still work after support change", () => {
      mockIsSupported.mockReturnValue(true);

      const { result } = renderHook(() => useFeatureSupport());

      // Simulate support change
      act(() => {
        if (onSupportChangeCallback) {
          onSupportChangeCallback();
        }
      });

      // Should still be callable
      const isSupported = (result.current as any)("feature:data-provider:images");
      expect(isSupported).toBe(true);
    });
  });

  // =========================================================================
  // Cleanup Tests
  // =========================================================================

  describe("Cleanup", () => {
    it("should call disposer on unmount", () => {
      const { unmount } = renderHook(() => useFeatureSupport());

      expect(mockDisposer).not.toHaveBeenCalled();

      unmount();

      expect(mockDisposer).toHaveBeenCalled();
    });
  });
});
