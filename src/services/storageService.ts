/**
 * Storage Service
 *
 * Simple localStorage-based persistence for Photo Booth configuration.
 * This provides persistence across page navigations within the same Canva session.
 */

import type { PhotoBoothConfig, FrameConfig } from "../types";

const CONFIG_STORAGE_KEY = "photobooth_config";

/**
 * Generate a hash from frame configurations for change detection
 * This helps detect if the template has been modified
 */
export function generateTemplateHash(frames: FrameConfig[]): string {
  const frameData = frames.map(f => ({
    id: f.id,
    top: Math.round(f.top),
    left: Math.round(f.left),
    width: Math.round(f.width),
    height: Math.round(f.height),
    order: f.order,
  }));
  
  // Simple hash based on JSON string
  const str = JSON.stringify(frameData);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Save config to localStorage
 */
export function saveConfigToStorage(config: PhotoBoothConfig): void {
  try {
    // Generate template hash before saving
    const configWithHash = {
      ...config,
      templateHash: generateTemplateHash(config.frames),
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configWithHash));
  } catch (e) {
    console.error("Failed to save config to storage:", e);
  }
}

/**
 * Load config from localStorage
 */
export function loadConfigFromStorage(): PhotoBoothConfig | null {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PhotoBoothConfig;
    }
  } catch (e) {
    console.error("Failed to load config from storage:", e);
  }
  return null;
}

/**
 * Clear config from localStorage
 */
export function clearConfigFromStorage(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear config from storage:", e);
  }
}

/**
 * Check if config exists in storage
 */
export function hasStoredConfig(): boolean {
  try {
    return localStorage.getItem(CONFIG_STORAGE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Check if frames have changed compared to stored template hash
 */
export function hasTemplateChanged(
  config: PhotoBoothConfig,
  currentFrames: FrameConfig[]
): boolean {
  if (!config.templateHash) {
    return false; // No hash stored, can't detect changes
  }
  
  const currentHash = generateTemplateHash(currentFrames);
  return config.templateHash !== currentHash;
}

/**
 * Update the template hash in the stored config
 */
export function updateTemplateHash(config: PhotoBoothConfig): PhotoBoothConfig {
  return {
    ...config,
    templateHash: generateTemplateHash(config.frames),
    updatedAt: new Date().toISOString(),
  };
}
