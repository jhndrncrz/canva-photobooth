/**
 * Photo Booth App Type Definitions
 */

/**
 * Element type that can be used as a frame placeholder
 * Using images since Canva Selection API supports image selection
 */
export type FrameElementType = "image";

/**
 * Configuration for a single frame placeholder on the template
 * Frames are image elements that will be replaced with captured photos
 */
export interface FrameConfig {
  /** Unique identifier for this frame */
  id: string;
  /** Type of element (image) */
  elementType: FrameElementType;
  /** Reference to the image for identification */
  imageRef?: string;
  /** Order in which photos will be placed (1-based) */
  order: number;
  /** Width of the frame in pixels */
  width: number;
  /** Height of the frame in pixels */
  height: number;
  /** Top position relative to page */
  top: number;
  /** Left position relative to page */
  left: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Transparency of the element (0-1) */
  transparency: number;
  /** Original element index in the page elements list for identification */
  elementIndex: number;
}

/**
 * Settings for the capture session
 */
export interface CaptureSettings {
  /** Seconds to count down before each capture (default: 3) */
  countdownSeconds: number;
  /** Number of photos to capture (matches frame count) */
  captureCount: number;
  /** Whether to play shutter sound on capture */
  playShutterSound: boolean;
  /** Whether to play countdown sounds */
  playCountdownSound: boolean;
  /** Whether to show flash effect on capture */
  showFlashEffect: boolean;
  /** Which camera to use: front (user) or back (environment) */
  facingMode: "user" | "environment";
  /** Capture mode: auto captures all photos automatically, manual requires click for each */
  captureMode: "auto" | "manual";
}

/**
 * Main configuration for the Photo Booth app
 * Stored as App Element data on the config page
 */
export interface PhotoBoothConfig {
  /** Version number for config migration */
  version: number;
  /** Page ID of the template page */
  templatePageId: string;
  /** Page ID of the config storage page */
  configPageId: string;
  /** Hash of template frame positions for change detection */
  templateHash?: string;
  /** Array of frame configurations */
  frames: FrameConfig[];
  /** Capture session settings */
  captureSettings: CaptureSettings;
  /** ISO timestamp when config was created */
  createdAt: string;
  /** ISO timestamp when config was last updated */
  updatedAt: string;
}

/**
 * A single captured photo in a session
 */
export interface CapturedPhoto {
  /** Unique identifier for this photo */
  id: string;
  /** Base64 data URL of the captured image */
  dataUrl: string;
  /** ISO timestamp when photo was captured */
  capturedAt: string;
  /** ID of the frame this photo is mapped to */
  frameId: string;
}

/**
 * Status of a capture session
 */
export type CaptureSessionStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "reviewing"
  | "processing"
  | "complete"
  | "error";

/**
 * Represents an active capture session
 */
export interface CaptureSession {
  /** Unique identifier for this session */
  sessionId: string;
  /** Array of captured photos */
  photos: CapturedPhoto[];
  /** Current status of the session */
  status: CaptureSessionStatus;
  /** Index of the photo currently being captured (0-based) */
  currentPhotoIndex: number;
  /** ISO timestamp when session started */
  startedAt: string;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Available screens in the app
 */
export type AppScreen =
  | "home"
  | "setup-template"
  | "setup-frames"
  | "settings"
  | "capture"
  | "review"
  | "processing"
  | "complete"
  | "error";

/**
 * Global application state
 */
export interface AppState {
  /** Currently displayed screen */
  currentScreen: AppScreen;
  /** Loaded configuration (null if not configured) */
  config: PhotoBoothConfig | null;
  /** Active capture session (null if not in session) */
  session: CaptureSession | null;
  /** Whether the app is loading */
  isLoading: boolean;
  /** Error message for display */
  error: string | null;
}

/**
 * App Element data structure for persistence
 */
export interface PhotoBoothAppElementData {
  /** Type identifier for the app element */
  type: "photobooth_config";
  /** The serialized config */
  config: PhotoBoothConfig;
}

/**
 * Element information from a page for recreation
 */
export interface PageElementInfo {
  /** Element type (image, text, shape, etc.) */
  type: string;
  /** Position and size */
  top: number;
  left: number;
  width: number;
  height: number;
  rotation: number;
  /** Additional element-specific properties */
  properties: Record<string, unknown>;
}

/**
 * Result of uploading an image to Canva
 */
export interface UploadedImageRef {
  /** The uploaded asset reference */
  ref: string;
  /** Original photo ID */
  photoId: string;
  /** Frame ID this image is for */
  frameId: string;
}

/**
 * Webcam stream state
 */
export interface WebcamState {
  /** Whether webcam is initialized */
  isInitialized: boolean;
  /** Whether webcam stream is active */
  isActive: boolean;
  /** The media stream (if active) */
  stream: MediaStream | null;
  /** Error message if initialization failed */
  error: string | null;
  /** Available video devices */
  devices: MediaDeviceInfo[];
  /** Currently selected device ID */
  selectedDeviceId: string | null;
}

/**
 * Props for screen components
 */
export interface ScreenProps {
  /** Function to navigate to a different screen */
  navigateTo: (screen: AppScreen) => void;
  /** Current app config (may be null) */
  config: PhotoBoothConfig | null;
  /** Function to update config */
  setConfig: (config: PhotoBoothConfig | null) => void;
  /** Current capture session (may be null) */
  session: CaptureSession | null;
  /** Function to update session */
  setSession: (session: CaptureSession | null) => void;
}
