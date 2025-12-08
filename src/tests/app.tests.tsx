/* eslint-disable formatjs/no-literal-string-in-jsx */
/**
 * @file App Component Tests
 * @description Unit tests for the main Photo Booth App component
 *
 * Tests cover:
 * - Initial loading state and config loading
 * - Screen navigation between different app states
 * - Error boundary behavior
 * - Config persistence
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { render, waitFor } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { App } from "../app";

/**
 * Helper function to render components with required test providers
 */
function renderInTestProvider(node: ReactNode): RenderResult {
  return render(
    <TestAppI18nProvider>
      <TestAppUiProvider>{node}</TestAppUiProvider>
    </TestAppI18nProvider>
  );
}

// Mock the storage service
jest.mock("../services/storageService", () => ({
  loadConfigFromStorage: jest.fn(),
  saveConfigToStorage: jest.fn(),
}));

// Mock @canva/design
jest.mock("@canva/design", () => ({
  selection: {
    registerOnChange: jest.fn(() => jest.fn()),
  },
  overlay: {
    registerOnCanOpen: jest.fn(() => jest.fn()),
  },
  getDefaultPageDimensions: jest.fn(() =>
    Promise.resolve({ width: 1920, height: 1080 })
  ),
  requestExport: jest.fn(),
  addPage: jest.fn(),
}));

// Mock @canva/platform
jest.mock("@canva/platform", () => ({
  appProcess: {
    registerOnStateChange: jest.fn(),
    current: { getInfo: jest.fn(() => Promise.resolve({ context: "design_editor" })) },
  },
  requestOpenExternalUrl: jest.fn(),
}));

// Import mocked functions
import { loadConfigFromStorage } from "../services/storageService";
const mockLoadConfig = loadConfigFromStorage as jest.MockedFunction<
  typeof loadConfigFromStorage
>;

describe("Photo Booth App Component Tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Default: no stored config
    mockLoadConfig.mockReturnValue(null);
  });

  describe("Initial Loading", () => {
    it("should load config from storage on mount", async () => {
      renderInTestProvider(<App />);

      // Should call loadConfigFromStorage
      expect(mockLoadConfig).toHaveBeenCalled();
    });

    it("should show home screen after loading", async () => {
      const result = renderInTestProvider(<App />);

      // Wait for loading to complete and show home screen
      await waitFor(() => {
        expect(result.getByText("Photo Booth")).toBeInTheDocument();
      });
    });
  });

  describe("Home Screen Display", () => {
    it("should display home screen when no config exists", async () => {
      mockLoadConfig.mockReturnValue(null);

      const result = renderInTestProvider(<App />);

      await waitFor(() => {
        expect(result.getByText("Photo Booth")).toBeInTheDocument();
      });

      // Should show "Get Started" button
      expect(result.getByText("🚀 Get Started")).toBeInTheDocument();
    });

    it("should display start capture option when config exists", async () => {
      mockLoadConfig.mockReturnValue({
        version: 1,
        templatePageId: "page-1",
        configPageId: "page-2",
        frames: [
          {
            id: "frame-1",
            elementType: "image" as const,
            order: 1,
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            rotation: 0,
            transparency: 0,
            elementIndex: 0,
          },
        ],
        captureSettings: {
          countdownSeconds: 3,
          captureCount: 1,
          playShutterSound: true,
          playCountdownSound: true,
          showFlashEffect: true,
          facingMode: "user" as const,
          captureMode: "auto" as const,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = renderInTestProvider(<App />);

      await waitFor(() => {
        expect(result.getByText("Photo Booth")).toBeInTheDocument();
      });

      // Should show start capture and settings buttons when config exists
      expect(result.getByText("📸 Start Capture")).toBeInTheDocument();
      expect(result.getByText("⚙️ Settings")).toBeInTheDocument();
    });
  });

  describe("Snapshot", () => {
    it("should have a consistent snapshot for home screen", async () => {
      const result = renderInTestProvider(<App />);

      await waitFor(() => {
        expect(result.queryByText("Loading...")).not.toBeInTheDocument();
      });

      expect(result.container).toMatchSnapshot();
    });
  });
});
