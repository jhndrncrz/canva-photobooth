/**
 * usePhotoBoothConfig Hook
 *
 * React hook for managing the Photo Booth configuration.
 * Provides loading, saving, and updating of config through the config service.
 */

import { useState, useEffect, useCallback } from "react";
import type { PhotoBoothConfig, CaptureSettings, FrameConfig } from "../types";
import {
  initConfigService,
  onConfigChange,
  getCurrentConfig,
  saveConfig,
  updateConfig,
  createDefaultConfig,
  validateConfig,
  hasSelectedConfigElement,
} from "../services/configService";

export interface UsePhotoBoothConfigReturn {
  /** Current configuration (null if not set up) */
  config: PhotoBoothConfig | null;
  /** Whether the hook is initializing */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Whether a config element is currently selected */
  isConfigSelected: boolean;
  /** Create a new config with default values */
  createConfig: (templatePageId: string, configPageId: string) => Promise<void>;
  /** Save or update the entire config */
  save: (config: PhotoBoothConfig) => Promise<void>;
  /** Update specific config fields */
  update: (updates: Partial<PhotoBoothConfig>) => Promise<void>;
  /** Update capture settings */
  updateCaptureSettings: (settings: Partial<CaptureSettings>) => Promise<void>;
  /** Set the template page ID */
  setTemplatePage: (pageId: string) => Promise<void>;
  /** Set the frame configurations */
  setFrames: (frames: FrameConfig[]) => Promise<void>;
  /** Add a single frame */
  addFrame: (frame: FrameConfig) => Promise<void>;
  /** Remove a frame by ID */
  removeFrame: (frameId: string) => Promise<void>;
  /** Update frame order */
  updateFrameOrder: (frameId: string, newOrder: number) => Promise<void>;
  /** Validate the current config */
  validate: () => string[];
  /** Clear any error */
  clearError: () => void;
  /** Reload config from app element */
  reload: () => void;
}

/**
 * Hook for managing Photo Booth configuration
 */
export function usePhotoBoothConfig(): UsePhotoBoothConfigReturn {
  const [config, setConfig] = useState<PhotoBoothConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigSelected, setIsConfigSelected] = useState(false);

  // Initialize the config service on mount
  useEffect(() => {
    initConfigService();

    // Register for config changes
    onConfigChange((newConfig) => {
      setConfig(newConfig);
      setIsConfigSelected(hasSelectedConfigElement());
      setIsLoading(false);
    });

    // Check for existing config
    const existingConfig = getCurrentConfig();
    if (existingConfig) {
      setConfig(existingConfig);
      setIsConfigSelected(hasSelectedConfigElement());
    }
    setIsLoading(false);
  }, []);

  // Create new config
  const createConfig = useCallback(
    async (templatePageId: string, configPageId: string) => {
      setError(null);
      try {
        const newConfig = createDefaultConfig(templatePageId, configPageId);
        await saveConfig(newConfig);
        setConfig(newConfig);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to create config";
        setError(message);
        throw e;
      }
    },
    []
  );

  // Save config
  const save = useCallback(async (configToSave: PhotoBoothConfig) => {
    setError(null);
    try {
      await saveConfig(configToSave);
      setConfig(configToSave);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save config";
      setError(message);
      throw e;
    }
  }, []);

  // Update config
  const update = useCallback(
    async (updates: Partial<PhotoBoothConfig>) => {
      setError(null);
      try {
        await updateConfig(updates);
        if (config) {
          setConfig({ ...config, ...updates });
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to update config";
        setError(message);
        throw e;
      }
    },
    [config]
  );

  // Update capture settings
  const updateCaptureSettings = useCallback(
    async (settings: Partial<CaptureSettings>) => {
      if (!config) {
        setError("No config to update");
        return;
      }

      const newSettings: CaptureSettings = {
        ...config.captureSettings,
        ...settings,
      };

      await update({ captureSettings: newSettings });
    },
    [config, update]
  );

  // Set template page
  const setTemplatePage = useCallback(
    async (pageId: string) => {
      await update({ templatePageId: pageId });
    },
    [update]
  );

  // Set frames
  const setFrames = useCallback(
    async (frames: FrameConfig[]) => {
      if (!config) {
        setError("No config to update");
        return;
      }

      // Update capture count to match frame count
      const newSettings: CaptureSettings = {
        ...config.captureSettings,
        captureCount: frames.length,
      };

      await update({ frames, captureSettings: newSettings });
    },
    [config, update]
  );

  // Add a frame
  const addFrame = useCallback(
    async (frame: FrameConfig) => {
      if (!config) {
        setError("No config to update");
        return;
      }

      const newFrames = [...config.frames, frame];
      await setFrames(newFrames);
    },
    [config, setFrames]
  );

  // Remove a frame
  const removeFrame = useCallback(
    async (frameId: string) => {
      if (!config) {
        setError("No config to update");
        return;
      }

      const newFrames = config.frames.filter((f) => f.id !== frameId);
      // Re-order remaining frames
      const reorderedFrames = newFrames.map((f, index) => ({
        ...f,
        order: index + 1,
      }));
      await setFrames(reorderedFrames);
    },
    [config, setFrames]
  );

  // Update frame order
  const updateFrameOrder = useCallback(
    async (frameId: string, newOrder: number) => {
      if (!config) {
        setError("No config to update");
        return;
      }

      const newFrames = config.frames.map((f) =>
        f.id === frameId ? { ...f, order: newOrder } : f
      );

      // Sort by order and fix any gaps
      const sortedFrames = [...newFrames]
        .sort((a, b) => a.order - b.order)
        .map((f, index) => ({
          ...f,
          order: index + 1,
        }));

      await setFrames(sortedFrames);
    },
    [config, setFrames]
  );

  // Validate config
  const validate = useCallback((): string[] => {
    if (!config) {
      return ["No configuration found"];
    }
    return validateConfig(config);
  }, [config]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reload config
  const reload = useCallback(() => {
    const existingConfig = getCurrentConfig();
    setConfig(existingConfig);
    setIsConfigSelected(hasSelectedConfigElement());
  }, []);

  return {
    config,
    isLoading,
    error,
    isConfigSelected,
    createConfig,
    save,
    update,
    updateCaptureSettings,
    setTemplatePage,
    setFrames,
    addFrame,
    removeFrame,
    updateFrameOrder,
    validate,
    clearError,
    reload,
  };
}
