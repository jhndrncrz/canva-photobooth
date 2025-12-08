/**
 * Photo Booth App Constants
 */

import type { CaptureSettings } from "../types";

/**
 * Backend URL for the photo booth camera API
 * Uses the globally defined BACKEND_HOST from webpack
 */
export const BACKEND_URL = BACKEND_HOST;

/**
 * Page title for the config storage page
 * This page contains the App Element with photo booth configuration
 */
export const CONFIG_PAGE_TITLE = "PBApp - Config [DO NOT DELETE]";

/**
 * Page title for the template page
 * This page serves as the template for output generation
 */
export const TEMPLATE_PAGE_TITLE = "PBApp - Template [DO NOT DELETE]";

/**
 * Current config version for migration purposes
 */
export const CONFIG_VERSION = 1;

/**
 * App element type identifier
 */
export const APP_ELEMENT_TYPE = "photobooth_config" as const;

/**
 * Default capture settings
 */
export const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  countdownSeconds: 3,
  captureCount: 0, // Will be set based on frame count
  playShutterSound: true,
  playCountdownSound: true,
  showFlashEffect: true,
  facingMode: "user",
  captureMode: "manual",
};

/**
 * Minimum and maximum values for countdown
 */
export const COUNTDOWN_MIN = 1;
export const COUNTDOWN_MAX = 10;

/**
 * Minimum and maximum frames allowed
 */
export const FRAMES_MIN = 1;
export const FRAMES_MAX = 10;

/**
 * Webcam constraints
 */
export const WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

/**
 * Image capture settings
 */
export const CAPTURE_IMAGE_QUALITY = 0.92;
export const CAPTURE_IMAGE_FORMAT = "image/jpeg";

/**
 * Sound effect URLs (base64 or asset paths)
 * These will be replaced with actual assets later
 */
export const SOUNDS = {
  countdown: "/sounds/beep.mp3",
  shutter: "/sounds/shutter.mp3",
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATION = {
  flash: 150,
  countdown: 1000,
  transition: 300,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  WEBCAM_NOT_SUPPORTED: "Your browser does not support webcam access.",
  WEBCAM_PERMISSION_DENIED:
    "Camera permission was denied. Please allow camera access to use the photo booth.",
  WEBCAM_NOT_FOUND: "No camera was found on your device.",
  CONFIG_LOAD_FAILED: "Failed to load photo booth configuration.",
  CONFIG_SAVE_FAILED: "Failed to save photo booth configuration.",
  PAGE_CREATE_FAILED: "Failed to create output page.",
  IMAGE_UPLOAD_FAILED: "Failed to upload captured images.",
  NO_FRAMES_SELECTED: "Please select at least one frame placeholder.",
  NO_TEMPLATE_SELECTED: "Please select a template page first.",
  SESSION_ERROR: "An error occurred during the capture session.",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CONFIG_SAVED: "Photo booth configuration saved successfully.",
  OUTPUT_CREATED: "Photo booth output page created successfully!",
  PHOTOS_CAPTURED: "All photos captured successfully.",
} as const;

/**
 * UI Labels (to be replaced with intl messages later)
 */
export const LABELS = {
  APP_NAME: "Photo Booth",
  SETUP_BUTTON: "Setup Photo Booth",
  START_CAPTURE: "Start Capture",
  EDIT_SETTINGS: "Edit Settings",
  RETAKE_PHOTOS: "Retake Photos",
  GENERATE_OUTPUT: "Generate Output",
  BACK_TO_MENU: "Back to Menu",
  START_NEW_SESSION: "Start New Session",
  SELECT_TEMPLATE: "Select Template Page",
  SELECT_FRAMES: "Select Frame Placeholders",
  COUNTDOWN: "Get Ready!",
  PROCESSING: "Creating your photo booth output...",
  COMPLETE: "Photo Booth Complete!",
} as const;
