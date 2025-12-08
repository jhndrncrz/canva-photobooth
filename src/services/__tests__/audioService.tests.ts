/**
 * Audio Service Unit Tests
 *
 * Tests for the Web Audio API-based sound playback functionality.
 * These tests mock the AudioContext to verify sound generation logic.
 *
 * @module services/audioService.tests
 */

import {
  ensureAudioReady,
  playCountdownTick,
  playCountdownFinal,
  playShutterSound,
  playSuccessSound,
  playErrorSound,
  cleanupAudio,
} from "../audioService";

// ============================================================================
// Mock Web Audio API
// ============================================================================

/**
 * Creates a mock GainNode
 */
const createMockGainNode = () => ({
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
});

/**
 * Creates a mock OscillatorNode
 */
const createMockOscillator = () => ({
  type: "sine",
  frequency: {
    setValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
});

/**
 * Creates a mock BiquadFilterNode
 */
const createMockBiquadFilter = () => ({
  type: "lowpass",
  frequency: {
    setValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
});

/**
 * Creates a mock AudioBuffer
 */
const createMockBuffer = () => ({
  getChannelData: jest.fn(() => new Float32Array(4410)), // 0.1s at 44100Hz
});

/**
 * Creates a mock AudioBufferSourceNode
 */
const createMockBufferSource = () => ({
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
});

/**
 * Mock AudioContext implementation
 */
class MockAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = {};

  createOscillator = jest.fn(() => createMockOscillator());
  createGain = jest.fn(() => createMockGainNode());
  createBiquadFilter = jest.fn(() => createMockBiquadFilter());
  createBuffer = jest.fn(() => createMockBuffer());
  createBufferSource = jest.fn(() => createMockBufferSource());
  resume = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
}

// Install mock
const mockAudioContext = new MockAudioContext();
(global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
  jest.fn(() => mockAudioContext) as unknown as typeof MockAudioContext;

describe("Audio Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioContext.state = "running";
  });

  afterEach(() => {
    // Clean up audio context between tests
    cleanupAudio();
  });

  // =========================================================================
  // Audio Context Initialization Tests
  // =========================================================================

  describe("ensureAudioReady", () => {
    it("should create AudioContext if not exists", async () => {
      await ensureAudioReady();

      // AudioContext constructor should be called
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it("should resume suspended AudioContext", async () => {
      mockAudioContext.state = "suspended";

      await ensureAudioReady();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it("should not resume running AudioContext", async () => {
      mockAudioContext.state = "running";

      await ensureAudioReady();

      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Countdown Sound Tests
  // =========================================================================

  describe("playCountdownTick", () => {
    it("should create an oscillator for the tick sound", () => {
      playCountdownTick();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("should not throw errors", () => {
      expect(() => playCountdownTick()).not.toThrow();
    });

    it("should connect oscillator to gain node", () => {
      playCountdownTick();

      const oscillator = mockAudioContext.createOscillator.mock.results[0]?.value;
      expect(oscillator.connect).toHaveBeenCalled();
    });
  });

  describe("playCountdownFinal", () => {
    it("should create an oscillator for the final beep", () => {
      playCountdownFinal();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("should not throw errors", () => {
      expect(() => playCountdownFinal()).not.toThrow();
    });
  });

  // =========================================================================
  // Shutter Sound Tests
  // =========================================================================

  describe("playShutterSound", () => {
    it("should create noise buffer for shutter click", () => {
      playShutterSound();

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it("should create a highpass filter for mechanical click effect", () => {
      playShutterSound();

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it("should not throw errors", () => {
      expect(() => playShutterSound()).not.toThrow();
    });
  });

  // =========================================================================
  // Success/Error Sound Tests
  // =========================================================================

  describe("playSuccessSound", () => {
    it("should create multiple oscillators for chord", () => {
      playSuccessSound();

      // Should create 3 oscillators for the chord (C, E, G)
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("should not throw errors", () => {
      expect(() => playSuccessSound()).not.toThrow();
    });
  });

  describe("playErrorSound", () => {
    it("should create oscillators for descending tones", () => {
      playErrorSound();

      // Should create 2 oscillators for descending tones
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it("should not throw errors", () => {
      expect(() => playErrorSound()).not.toThrow();
    });
  });

  // =========================================================================
  // Cleanup Tests
  // =========================================================================

  describe("cleanupAudio", () => {
    it("should close AudioContext when cleaning up", async () => {
      // First ensure context is created
      await ensureAudioReady();

      cleanupAudio();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("should not throw when called multiple times", () => {
      expect(() => {
        cleanupAudio();
        cleanupAudio();
      }).not.toThrow();
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe("Error handling", () => {
    it("should handle AudioContext creation failure gracefully", () => {
      // Mock AudioContext to throw
      const originalAudioContext = global.AudioContext;
      (global as unknown as { AudioContext: () => never }).AudioContext = () => {
        throw new Error("Audio not supported");
      };

      // Should not throw, just warn
      expect(() => playCountdownTick()).not.toThrow();

      // Restore
      (global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
        originalAudioContext as unknown as typeof MockAudioContext;
    });

    it("should handle oscillator errors gracefully", () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error("Oscillator failed");
      });

      // Should not throw, just warn
      expect(() => playCountdownTick()).not.toThrow();
    });
  });
});
