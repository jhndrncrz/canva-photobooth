/**
 * HomeScreen Component Unit Tests
 *
 * Tests for the main entry point of the Photo Booth app.
 * Verifies correct status display and navigation based on configuration state.
 *
 * @module components/screens/HomeScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { HomeScreen } from "../HomeScreen";
import type { PhotoBoothConfig, CaptureSession } from "../../../types";

/**
 * Wraps component in required test providers
 */
function renderInTestProvider(node: ReactNode): RenderResult {
  return render(
    <TestAppI18nProvider>
      <TestAppUiProvider>{node}</TestAppUiProvider>
    </TestAppI18nProvider>
  );
}

/**
 * Sample frame configuration for testing
 */
const sampleFrames = [
  {
    id: "frame-1",
    elementType: "image" as const,
    order: 1,
    width: 300,
    height: 200,
    top: 100,
    left: 100,
    rotation: 0,
    transparency: 1,
    elementIndex: 0,
  },
];

/**
 * Complete sample config for testing
 */
const sampleConfig: PhotoBoothConfig = {
  version: 1,
  templatePageId: "page-123",
  configPageId: "config-456",
  frames: sampleFrames,
  captureSettings: {
    countdownSeconds: 3,
    captureCount: 1,
    playShutterSound: true,
    playCountdownSound: true,
    showFlashEffect: true,
    facingMode: "user",
    captureMode: "manual",
  },
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

/**
 * Config without frames for testing incomplete state
 */
const incompleteConfig: PhotoBoothConfig = {
  ...sampleConfig,
  frames: [],
};

describe("HomeScreen", () => {
  // Mock navigation function
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe("Initial State Display", () => {
    it("should display app title and subtitle", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("Photo Booth")).toBeInTheDocument();
      expect(
        screen.getByText("Capture and place photos in your designs")
      ).toBeInTheDocument();
    });

    it("should show 'Setup required' status when no config exists", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("Setup required")).toBeInTheDocument();
    });

    it("should show 'Get Started' button when no config exists", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Get Started/i })
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Incomplete Configuration Tests
  // =========================================================================

  describe("Incomplete Configuration", () => {
    it("should show 'Setup incomplete' status when config has no frames", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={incompleteConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("Setup incomplete")).toBeInTheDocument();
    });

    it("should disable 'Start Capture' button when no frames configured", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={incompleteConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const captureButton = screen.getByRole("button", {
        name: /Start Capture/i,
      });
      // Canva UI Kit uses aria-disabled instead of native disabled
      expect(captureButton).toHaveAttribute("aria-disabled", "true");
    });

    it("should show warning about adding frames", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={incompleteConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByText(/Add at least one frame placeholder/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Ready State Tests
  // =========================================================================

  describe("Ready State", () => {
    it("should show 'Ready to capture' status when config is complete", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("Ready to capture")).toBeInTheDocument();
    });

    it("should enable 'Start Capture' button when ready", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const captureButton = screen.getByRole("button", {
        name: /Start Capture/i,
      });
      // Check that button is not disabled (no aria-disabled attribute or false)
      expect(captureButton).not.toHaveAttribute("aria-disabled", "true");
    });

    it("should display frame count in config summary", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/1 frame/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to setup-template when 'Get Started' is clicked", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const getStartedButton = screen.getByRole("button", {
        name: /Get Started/i,
      });
      fireEvent.click(getStartedButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("setup-template");
    });

    it("should navigate to capture when 'Start Capture' is clicked", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const captureButton = screen.getByRole("button", {
        name: /Start Capture/i,
      });
      fireEvent.click(captureButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("capture");
    });

    it("should navigate to setup-template when 'Edit Frames' is clicked", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const editButton = screen.getByRole("button", { name: /Edit Frames/i });
      fireEvent.click(editButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("setup-template");
    });

    it("should navigate to settings when 'Settings' is clicked", () => {
      renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const settingsButton = screen.getByRole("button", { name: /Settings/i });
      fireEvent.click(settingsButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("settings");
    });
  });

  // =========================================================================
  // Snapshot Test
  // =========================================================================

  describe("Snapshot", () => {
    it("should match snapshot when not configured", () => {
      const result = renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });

    it("should match snapshot when ready", () => {
      const result = renderInTestProvider(
        <HomeScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });
  });
});
