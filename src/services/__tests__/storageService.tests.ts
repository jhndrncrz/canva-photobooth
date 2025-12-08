/**
 * Storage Service Unit Tests
 *
 * Tests for the localStorage-based configuration persistence.
 * These tests verify config saving, loading, hash generation, and change detection.
 *
 * @module services/storageService.tests
 */

import {
  generateTemplateHash,
  saveConfigToStorage,
  loadConfigFromStorage,
  clearConfigFromStorage,
  hasStoredConfig,
  hasTemplateChanged,
  updateTemplateHash,
} from "../storageService";
import type { PhotoBoothConfig, FrameConfig } from "../../types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Storage Service", () => {
  /**
   * Sample frame configurations for testing
   */
  const sampleFrames: FrameConfig[] = [
    {
      id: "frame-1",
      elementType: "image",
      order: 1,
      width: 300,
      height: 200,
      top: 100,
      left: 100,
      rotation: 0,
      transparency: 1,
      elementIndex: 0,
    },
    {
      id: "frame-2",
      elementType: "image",
      order: 2,
      width: 300,
      height: 200,
      top: 100,
      left: 450,
      rotation: 0,
      transparency: 1,
      elementIndex: 1,
    },
  ];

  /**
   * Sample config for testing
   */
  const sampleConfig: PhotoBoothConfig = {
    version: 1,
    templatePageId: "page-123",
    configPageId: "config-456",
    frames: sampleFrames,
    captureSettings: {
      countdownSeconds: 3,
      captureCount: 2,
      playShutterSound: true,
      playCountdownSound: true,
      showFlashEffect: true,
      facingMode: "user",
      captureMode: "manual",
    },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    // Clear all mocks and storage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // =========================================================================
  // Template Hash Generation Tests
  // =========================================================================

  describe("generateTemplateHash", () => {
    it("should generate a consistent hash for the same frames", () => {
      const hash1 = generateTemplateHash(sampleFrames);
      const hash2 = generateTemplateHash(sampleFrames);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for different frame positions", () => {
      const frame0 = sampleFrames[0]!;
      const frame1 = sampleFrames[1]!;
      const modifiedFrames: FrameConfig[] = [
        { ...frame0, top: 200 }, // Changed position
        frame1,
      ];

      const hash1 = generateTemplateHash(sampleFrames);
      const hash2 = generateTemplateHash(modifiedFrames);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate different hashes for different frame sizes", () => {
      const frame0 = sampleFrames[0]!;
      const frame1 = sampleFrames[1]!;
      const modifiedFrames: FrameConfig[] = [
        { ...frame0, width: 400 }, // Changed size
        frame1,
      ];

      const hash1 = generateTemplateHash(sampleFrames);
      const hash2 = generateTemplateHash(modifiedFrames);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate a hash for empty frames array", () => {
      const hash = generateTemplateHash([]);

      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should handle frames with decimal positions by rounding", () => {
      const frame0 = sampleFrames[0]!;
      const framesWithDecimals: FrameConfig[] = [
        { ...frame0, top: 100.4, left: 100.6 },
      ];
      const framesRounded: FrameConfig[] = [
        { ...frame0, top: 100, left: 101 },
      ];

      const hash1 = generateTemplateHash(framesWithDecimals);
      const hash2 = generateTemplateHash(framesRounded);

      expect(hash1).toBe(hash2);
    });
  });

  // =========================================================================
  // Config Storage Tests
  // =========================================================================

  describe("saveConfigToStorage", () => {
    it("should save config to localStorage", () => {
      saveConfigToStorage(sampleConfig);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "photobooth_config",
        expect.any(String)
      );
    });

    it("should include template hash when saving", () => {
      saveConfigToStorage(sampleConfig);

      const savedValue = localStorageMock.setItem.mock.calls[0]?.[1] as string;
      const savedData = JSON.parse(savedValue);
      expect(savedData.templateHash).toBeDefined();
      expect(typeof savedData.templateHash).toBe("string");
    });

    it("should preserve all config properties when saving", () => {
      saveConfigToStorage(sampleConfig);

      const savedValue = localStorageMock.setItem.mock.calls[0]?.[1] as string;
      const savedData = JSON.parse(savedValue);
      expect(savedData.version).toBe(sampleConfig.version);
      expect(savedData.templatePageId).toBe(sampleConfig.templatePageId);
      expect(savedData.frames).toEqual(sampleConfig.frames);
      expect(savedData.captureSettings).toEqual(sampleConfig.captureSettings);
    });
  });

  describe("loadConfigFromStorage", () => {
    it("should return null when no config is stored", () => {
      const config = loadConfigFromStorage();

      expect(config).toBeNull();
    });

    it("should load and parse stored config", () => {
      // First save a config
      saveConfigToStorage(sampleConfig);

      // Mock getItem to return the saved value
      const savedValue = localStorageMock.setItem.mock.calls[0]?.[1] as string;
      localStorageMock.getItem.mockReturnValueOnce(savedValue);

      const loadedConfig = loadConfigFromStorage();

      expect(loadedConfig).not.toBeNull();
      expect(loadedConfig?.version).toBe(sampleConfig.version);
      expect(loadedConfig?.templatePageId).toBe(sampleConfig.templatePageId);
    });

    it("should return null for invalid JSON", () => {
      localStorageMock.getItem.mockReturnValueOnce("invalid json {{{");

      const config = loadConfigFromStorage();

      expect(config).toBeNull();
    });
  });

  describe("clearConfigFromStorage", () => {
    it("should remove config from localStorage", () => {
      saveConfigToStorage(sampleConfig);
      clearConfigFromStorage();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "photobooth_config"
      );
    });
  });

  describe("hasStoredConfig", () => {
    it("should return false when no config is stored", () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      expect(hasStoredConfig()).toBe(false);
    });

    it("should return true when config is stored", () => {
      localStorageMock.getItem.mockReturnValueOnce("{}");

      expect(hasStoredConfig()).toBe(true);
    });
  });

  // =========================================================================
  // Template Change Detection Tests
  // =========================================================================

  describe("hasTemplateChanged", () => {
    it("should return false when no hash is stored", () => {
      const configWithoutHash: PhotoBoothConfig = {
        ...sampleConfig,
        templateHash: undefined,
      };

      const changed = hasTemplateChanged(configWithoutHash, sampleFrames);

      expect(changed).toBe(false);
    });

    it("should return false when frames match stored hash", () => {
      const hash = generateTemplateHash(sampleFrames);
      const configWithHash: PhotoBoothConfig = {
        ...sampleConfig,
        templateHash: hash,
      };

      const changed = hasTemplateChanged(configWithHash, sampleFrames);

      expect(changed).toBe(false);
    });

    it("should return true when frames differ from stored hash", () => {
      const hash = generateTemplateHash(sampleFrames);
      const configWithHash: PhotoBoothConfig = {
        ...sampleConfig,
        templateHash: hash,
      };

      const frame0 = sampleFrames[0]!;
      const frame1 = sampleFrames[1]!;
      const modifiedFrames: FrameConfig[] = [
        { ...frame0, top: 500 }, // Changed position
        frame1,
      ];

      const changed = hasTemplateChanged(configWithHash, modifiedFrames);

      expect(changed).toBe(true);
    });
  });

  describe("updateTemplateHash", () => {
    it("should update the template hash", () => {
      const updatedConfig = updateTemplateHash(sampleConfig);

      expect(updatedConfig.templateHash).toBeDefined();
      expect(updatedConfig.templateHash).toBe(
        generateTemplateHash(sampleConfig.frames)
      );
    });

    it("should update the updatedAt timestamp", () => {
      const originalUpdatedAt = sampleConfig.updatedAt;
      const updatedConfig = updateTemplateHash(sampleConfig);

      expect(updatedConfig.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should not mutate the original config", () => {
      const originalHash = sampleConfig.templateHash;
      updateTemplateHash(sampleConfig);

      expect(sampleConfig.templateHash).toBe(originalHash);
    });
  });
});
