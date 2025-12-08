# Canva Photo Booth App - Implementation Plan

## Overview

This document outlines the implementation plan for a Canva Photo Booth app that enables users to:
1. Select a template page from their design
2. Define frame placeholders where captured photos will be placed
3. Capture photos using the webcam with countdown
4. Generate a new output page with captured photos placed in the defined frames

## Technical Constraints

### SDK Limitations Identified
- **No Page Duplication API**: Must manually recreate all elements when generating output
- **No Page Hiding API**: Use descriptive page titles to indicate special pages
- **No Real-time Audio in SDK**: Use Web Audio API for shutter/countdown sounds

### Required Canva APIs
- `@canva/design`: `openDesign()`, `addPage()`, `initAppElement()`
- `@canva/asset`: `upload()`, `getTemporaryUrl()`
- `@canva/app-hooks`: `useSelection("image")`

### Required Browser APIs
- `navigator.mediaDevices.getUserMedia()` - Webcam access
- `Web Audio API` - Sound effects

---

## Configuration Details

### Page Naming Convention
- **Config Page**: `"PBApp - Config [DO NOT DELETE]"`
- **Template Page**: `"PBApp - Template [DO NOT DELETE]"`

### Config Storage
- Stored as App Element data on the config page
- JSON-serialized `PhotoBoothConfig` object

---

## Type Definitions

```typescript
// src/types/index.ts

export interface FrameConfig {
  id: string;
  elementRef: string; // Reference to the image element on template
  order: number; // Order in which photos will be placed
  width: number;
  height: number;
  top: number;
  left: number;
  rotation: number;
}

export interface CaptureSettings {
  countdownSeconds: number; // Default: 3
  captureCount: number; // Number of photos (matches frame count)
  playShutterSound: boolean;
  playCountdownSound: boolean;
  showFlashEffect: boolean;
  facingMode: 'user' | 'environment'; // Front or back camera
}

export interface PhotoBoothConfig {
  version: number; // For migration purposes
  templatePageId: string;
  configPageId: string;
  frames: FrameConfig[];
  captureSettings: CaptureSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CaptureSession {
  sessionId: string;
  photos: CapturedPhoto[];
  status: 'capturing' | 'reviewing' | 'processing' | 'complete' | 'error';
  currentPhotoIndex: number;
  startedAt: string;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string; // Base64 data URL
  capturedAt: string;
  frameId: string; // Mapped to which frame
}

export type AppScreen =
  | 'home'
  | 'setup-template'
  | 'setup-frames'
  | 'capture'
  | 'review'
  | 'processing'
  | 'complete'
  | 'error';

export interface AppState {
  currentScreen: AppScreen;
  config: PhotoBoothConfig | null;
  session: CaptureSession | null;
  isLoading: boolean;
  error: string | null;
}
```

---

## Constants

```typescript
// src/constants/index.ts

export const CONFIG_PAGE_TITLE = "PBApp - Config [DO NOT DELETE]";
export const TEMPLATE_PAGE_TITLE = "PBApp - Template [DO NOT DELETE]";

export const CONFIG_VERSION = 1;

export const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  countdownSeconds: 3,
  captureCount: 0, // Will be set based on frame count
  playShutterSound: true,
  playCountdownSound: true,
  showFlashEffect: true,
  facingMode: 'user',
};

export const APP_ELEMENT_TYPE = "photobooth_config";
```

---

## Phase 1: Foundation & Config Management

### Files to Create
1. `src/types/index.ts` - All TypeScript interfaces
2. `src/constants/index.ts` - Constants and defaults
3. `src/services/configService.ts` - App Element config CRUD operations
4. `src/hooks/usePhotoBoothConfig.ts` - React hook for config management
5. `src/components/screens/HomeScreen.tsx` - Main menu
6. `src/components/screens/SetupScreen.tsx` - Template & frame setup
7. Update `src/app.tsx` - Screen navigation logic

### configService.ts

```typescript
// Core functions:
- initializeConfig(): Promise<void> - Initialize app element
- loadConfig(): Promise<PhotoBoothConfig | null> - Find and load existing config
- saveConfig(config: PhotoBoothConfig): Promise<void> - Save config to app element
- deleteConfig(): Promise<void> - Remove config (reset app)
- findConfigPage(): Promise<string | null> - Find config page by title
- createConfigPage(): Promise<string> - Create new config page with app element
```

---

## Phase 2: Template & Frame Setup

### Files to Create
1. `src/services/pageService.ts` - Page creation and element reading
2. `src/hooks/useTemplateManager.ts` - Template page management
3. `src/components/screens/TemplateSelectScreen.tsx` - Template selection UI
4. `src/components/screens/FrameSetupScreen.tsx` - Frame definition UI

### Key Features
- List all pages in design for template selection
- Use `useSelection("image")` to allow frame selection
- Store frame positions, sizes, and order
- Visual preview of selected frames

---

## Phase 3: Capture Implementation

### Files to Create
1. `src/services/webcamService.ts` - Webcam access and control
2. `src/services/audioService.ts` - Sound effects via Web Audio API
3. `src/hooks/useWebcam.ts` - Webcam hook
4. `src/hooks/useCapture.ts` - Capture session management
5. `src/components/screens/CaptureScreen.tsx` - Capture UI with countdown
6. `src/components/CapturePreview.tsx` - Live preview component
7. `src/components/Countdown.tsx` - Countdown overlay

### Capture Flow
1. Initialize webcam stream
2. Show live preview
3. User clicks "Start Capture"
4. For each photo:
   - Display countdown (3, 2, 1)
   - Play countdown sound if enabled
   - Flash effect
   - Capture frame from video stream
   - Play shutter sound if enabled
   - Store captured image data
5. Proceed to Review screen

---

## Phase 4: Image Processing & Output Generation

### Files to Create
1. `src/services/imageService.ts` - Image upload and processing
2. `src/hooks/useImageProcessor.ts` - Image processing hook
3. `src/services/outputService.ts` - Output page generation
4. `src/components/screens/ReviewScreen.tsx` - Photo review before output
5. `src/components/screens/ProcessingScreen.tsx` - Processing indicator
6. `src/components/screens/CompleteScreen.tsx` - Success screen

### Output Generation Flow
1. Create new page with template dimensions
2. For each element on template page:
   - If it's a frame placeholder: Upload & place captured photo
   - Otherwise: Recreate element on new page
3. Crop photos to cover/fill frame dimensions
4. Navigate to complete screen

---

## Phase 5: Polish & Error Handling

### Enhancements
1. Error boundaries for graceful failure
2. Loading states throughout
3. Webcam permission handling
4. Config validation
5. Session recovery (if app closes during capture)
6. Accessibility improvements

---

## File Structure

```
src/
├── types/
│   └── index.ts
├── constants/
│   └── index.ts
├── services/
│   ├── configService.ts
│   ├── pageService.ts
│   ├── imageService.ts
│   ├── audioService.ts
│   ├── webcamService.ts
│   └── outputService.ts
├── hooks/
│   ├── usePhotoBoothConfig.ts
│   ├── useTemplateManager.ts
│   ├── useWebcam.ts
│   ├── useCapture.ts
│   └── useImageProcessor.ts
├── components/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── TemplateSelectScreen.tsx
│   │   ├── FrameSetupScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   └── CompleteScreen.tsx
│   ├── CapturePreview.tsx
│   ├── Countdown.tsx
│   └── FrameOrderEditor.tsx
├── app.tsx
└── index.tsx
```

---

## Session Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          HOME SCREEN                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ No Config Found      │  │ Config Found                     │ │
│  │                      │  │                                  │ │
│  │ [Setup Photo Booth]  │  │ [Start Capture]  [Edit Settings] │ │
│  └──────────┬───────────┘  └─────────┬──────────────┬─────────┘ │
└─────────────┼────────────────────────┼──────────────┼───────────┘
              │                        │              │
              ▼                        │              ▼
┌─────────────────────────┐            │   ┌─────────────────────┐
│  TEMPLATE SELECT SCREEN │            │   │    SETUP SCREEN     │
│                         │            │   │  (Edit existing)    │
│  Select which page is   │            │   └──────────┬──────────┘
│  the template           │            │              │
└───────────┬─────────────┘            │              │
            │                          │              │
            ▼                          │              │
┌─────────────────────────┐            │              │
│   FRAME SETUP SCREEN    │◄───────────┼──────────────┘
│                         │            │
│  Select image elements  │            │
│  to use as frame        │            │
│  placeholders           │            │
└───────────┬─────────────┘            │
            │                          │
            │ (Save Config)            │
            ▼                          │
┌─────────────────────────┐            │
│      HOME SCREEN        │◄───────────┘
│   (Config now exists)   │
└───────────┬─────────────┘
            │
            │ [Start Capture]
            ▼
┌─────────────────────────┐
│    CAPTURE SCREEN       │
│                         │
│  ┌─────────────────┐    │
│  │  Webcam Preview │    │
│  │                 │    │
│  │   Countdown     │    │
│  │   3... 2... 1   │    │
│  │   *FLASH*       │    │
│  └─────────────────┘    │
│                         │
│  Photo 1/4 captured     │
└───────────┬─────────────┘
            │
            │ (All photos captured)
            ▼
┌─────────────────────────┐
│     REVIEW SCREEN       │
│                         │
│  Preview all captured   │
│  photos with frames     │
│                         │
│  [Retake] [Generate]    │
└───────────┬─────────────┘
            │
            │ [Generate]
            ▼
┌─────────────────────────┐
│   PROCESSING SCREEN     │
│                         │
│  Uploading images...    │
│  Creating output page...│
│  ████████░░░░ 67%       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    COMPLETE SCREEN      │
│                         │
│  ✓ Photo booth output   │
│    created successfully!│
│                         │
│  [View Output]          │
│  [Start New Session]    │
│  [Back to Menu]         │
└─────────────────────────┘
```

---

## Implementation Order

1. **Phase 1** (Foundation): Types, constants, config service, basic navigation
2. **Phase 2** (Setup): Template selection, frame setup
3. **Phase 3** (Capture): Webcam, countdown, capture flow
4. **Phase 4** (Output): Image processing, page generation
5. **Phase 5** (Polish): Error handling, accessibility, optimization
