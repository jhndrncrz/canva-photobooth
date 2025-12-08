/**
 * Audio Service
 *
 * Provides audio playback functionality for the Photo Booth app.
 * Uses Web Audio API for reliable sound playback during capture sessions.
 */

// Audio context singleton
let audioContext: AudioContext | null = null;

/**
 * Get or create the AudioContext singleton
 * AudioContext must be created after user interaction
 */
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Resume audio context if suspended
 * Needed due to browser autoplay policies
 */
export const ensureAudioReady = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
};

/**
 * Generate a beep sound using oscillator
 * @param frequency - Frequency in Hz
 * @param duration - Duration in seconds
 * @param volume - Volume from 0 to 1
 */
const playBeep = (
  frequency: number,
  duration: number,
  volume: number = 0.5
): void => {
  const ctx = getAudioContext();

  // Create oscillator for tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Envelope for smooth sound
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

/**
 * Play countdown tick sound
 * A short beep for each countdown second
 */
export const playCountdownTick = (): void => {
  try {
    // Lower pitched beep for countdown
    playBeep(440, 0.15, 0.3); // A4 note, 150ms
  } catch (error) {
    console.warn("Failed to play countdown tick:", error);
  }
};

/**
 * Play final countdown beep (higher pitched)
 * Used for the last second before capture
 */
export const playCountdownFinal = (): void => {
  try {
    // Higher pitched beep for final countdown
    playBeep(880, 0.2, 0.4); // A5 note, 200ms
  } catch (error) {
    console.warn("Failed to play countdown final:", error);
  }
};

/**
 * Play shutter/capture sound
 * A mechanical shutter-like sound effect
 */
export const playShutterSound = (): void => {
  try {
    const ctx = getAudioContext();

    // Create noise for shutter click effect
    const bufferSize = ctx.sampleRate * 0.1; // 100ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise for mechanical click
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Noise with exponential decay
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // High-pass filter for click sound
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(2000, ctx.currentTime);

    // Gain envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    source.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();

    // Also add a subtle click tone
    playBeep(1200, 0.05, 0.2);
  } catch (error) {
    console.warn("Failed to play shutter sound:", error);
  }
};

/**
 * Play success/complete sound
 * Used when capture is complete
 */
export const playSuccessSound = (): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play ascending chord
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now);

      const startTime = now + i * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (error) {
    console.warn("Failed to play success sound:", error);
  }
};

/**
 * Play error sound
 * Used when something goes wrong
 */
export const playErrorSound = (): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play descending tones
    [400, 300].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now + i * 0.15);

      const startTime = now + i * 0.15;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  } catch (error) {
    console.warn("Failed to play error sound:", error);
  }
};

/**
 * Clean up audio resources
 */
export const cleanupAudio = (): void => {
  if (audioContext) {
    audioContext.close().catch(console.warn);
    audioContext = null;
  }
};

export default {
  ensureAudioReady,
  playCountdownTick,
  playCountdownFinal,
  playShutterSound,
  playSuccessSound,
  playErrorSound,
  cleanupAudio,
};
