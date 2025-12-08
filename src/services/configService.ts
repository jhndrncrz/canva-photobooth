/**
 * Config Service
 *
 * Manages the Photo Booth configuration using App Elements.
 * The config is stored as data on an App Element placed on a dedicated config page.
 */

import { initAppElement, type AppElementOptions } from "@canva/design";
import type { PhotoBoothConfig } from "../types";
import {
  CONFIG_VERSION,
  DEFAULT_CAPTURE_SETTINGS,
} from "../constants";

/**
 * App Element data structure
 * Must have index signature for Canva's AppElementData constraint
 */
interface ConfigAppElementData {
  [key: string]: string | number | boolean | undefined;
  type: "photobooth_config";
  configJson: string; // JSON stringified PhotoBoothConfig
}

/**
 * Initialize the app element client for config storage
 * This renders a minimal visual indicator on the config page
 */
const configAppElement = initAppElement<ConfigAppElementData>({
  render: (data) => {
    // Render a small indicator that shows this is the config storage
    // The actual config is stored in the data, not visualized
    return [
      {
        type: "text",
        children: ["📷 Photo Booth Config"],
        top: 0,
        left: 0,
        width: 200,
      },
    ];
  },
});

/**
 * Current state of the app element
 */
interface ConfigElementState {
  data: ConfigAppElementData | null;
  update?: (opts: AppElementOptions<ConfigAppElementData>) => Promise<void>;
}

let currentState: ConfigElementState = {
  data: null,
};

let onChangeCallback: ((config: PhotoBoothConfig | null) => void) | null = null;

/**
 * Initialize the config service and register for element changes
 */
export function initConfigService(): void {
  configAppElement.registerOnElementChange((element) => {
    if (element) {
      currentState = {
        data: element.data,
        update: element.update,
      };

      // Parse and notify listeners
      if (onChangeCallback && element.data.configJson) {
        try {
          const config = JSON.parse(
            element.data.configJson
          ) as PhotoBoothConfig;
          onChangeCallback(config);
        } catch (e) {
          console.error("Failed to parse config:", e);
          onChangeCallback(null);
        }
      }
    } else {
      currentState = { data: null };
      if (onChangeCallback) {
        onChangeCallback(null);
      }
    }
  });
}

/**
 * Register a callback for config changes
 */
export function onConfigChange(
  callback: (config: PhotoBoothConfig | null) => void
): void {
  onChangeCallback = callback;
}

/**
 * Get the currently loaded config from the app element state
 */
export function getCurrentConfig(): PhotoBoothConfig | null {
  if (!currentState.data?.configJson) {
    return null;
  }

  try {
    return JSON.parse(currentState.data.configJson) as PhotoBoothConfig;
  } catch (e) {
    console.error("Failed to parse config:", e);
    return null;
  }
}

/**
 * Check if we have an update function (meaning a config element is selected)
 */
export function hasSelectedConfigElement(): boolean {
  return currentState.update !== undefined;
}

/**
 * Create a new config with default values
 */
export function createDefaultConfig(
  templatePageId: string,
  configPageId: string
): PhotoBoothConfig {
  const now = new Date().toISOString();
  return {
    version: CONFIG_VERSION,
    templatePageId,
    configPageId,
    frames: [],
    captureSettings: { ...DEFAULT_CAPTURE_SETTINGS },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Save or update the config
 * If a config element is selected, updates it. Otherwise creates new.
 */
export async function saveConfig(config: PhotoBoothConfig): Promise<void> {
  const updatedConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  const appElementData: ConfigAppElementData = {
    type: "photobooth_config",
    configJson: JSON.stringify(updatedConfig),
  };

  if (currentState.update) {
    // Update existing element
    await currentState.update({
      data: appElementData,
    });
  } else {
    // Create new element
    await configAppElement.addElement({
      data: appElementData,
      placement: {
        top: 50,
        left: 50,
        width: 200,
        height: 50,
      },
    });
  }
}

/**
 * Update specific fields of the config
 */
export async function updateConfig(
  updates: Partial<PhotoBoothConfig>
): Promise<void> {
  const currentConfig = getCurrentConfig();
  if (!currentConfig) {
    throw new Error("No config to update");
  }

  const updatedConfig: PhotoBoothConfig = {
    ...currentConfig,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveConfig(updatedConfig);
}

/**
 * Validate a config object
 */
export function validateConfig(config: PhotoBoothConfig): string[] {
  const errors: string[] = [];

  if (!config.templatePageId) {
    errors.push("Template page not selected");
  }

  if (config.frames.length === 0) {
    errors.push("No frames defined");
  }

  if (
    config.captureSettings.countdownSeconds < 1 ||
    config.captureSettings.countdownSeconds > 10
  ) {
    errors.push("Countdown must be between 1 and 10 seconds");
  }

  return errors;
}

/**
 * Export the config app element client for direct access if needed
 */
export { configAppElement };
