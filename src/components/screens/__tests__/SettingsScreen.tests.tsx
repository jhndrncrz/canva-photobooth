/**
 * SettingsScreen Component Unit Tests
 *
 * Tests for the capture settings configuration screen.
 * Verifies settings display, modification, and persistence.
 *
 * @module components/screens/SettingsScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsScreen } from "../SettingsScreen";
import type { PhotoBoothConfig } from "../../../types";

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
 * Sample configuration for testing
 */
const sampleConfig: PhotoBoothConfig = {
  version: 1,
  templatePageId: "page-123",
  configPageId: "config-456",
  frames: [
    {
      id: "frame-1",
      elementType: "image",
      order: 1,
      width: 300,
      height: 200,
      top: 100,
      left: 100,
      rotation: 0,
      transparency: 1,
      elementIndex: 0,
    },
  ],
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

describe("SettingsScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Render Tests
  // =========================================================================

  describe("Rendering", () => {
    it("should display settings title", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Capture Settings/i)).toBeInTheDocument();
    });

    it("should show error when no config exists", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/No configuration found/i)).toBeInTheDocument();
    });

    it("should display countdown setting", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Countdown Duration/i)).toBeInTheDocument();
    });

    it("should display capture mode setting", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Capture Mode/i)).toBeInTheDocument();
    });

    it("should display camera setting", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("Camera")).toBeInTheDocument();
    });

    it("should display sound effect settings", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Sound Effects/i)).toBeInTheDocument();
      expect(screen.getByText(/Shutter Sound/i)).toBeInTheDocument();
      expect(screen.getByText(/Countdown Sound/i)).toBeInTheDocument();
    });

    it("should display flash effect setting", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Flash Effect/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Button Tests
  // =========================================================================

  describe("Buttons", () => {
    it("should have Save Settings button", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Save Settings/i })
      ).toBeInTheDocument();
    });

    it("should have Reset Defaults button", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Reset Defaults/i })
      ).toBeInTheDocument();
    });

    it("should have Back button", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to home when Back is clicked", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const backButton = screen.getByRole("button", { name: /Back/i });
      fireEvent.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });

    it("should navigate to home when no config and Back to Home is clicked", () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const backButton = screen.getByRole("button", { name: /Back to Home/i });
      fireEvent.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });
  });

  // =========================================================================
  // Save Settings Tests
  // =========================================================================

  describe("Saving Settings", () => {
    it("should call setConfig when Save Settings is clicked", async () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Settings/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalled();
      });
    });

    it("should show success message after saving", async () => {
      renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Settings/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Settings saved successfully/i)
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshots", () => {
    it("should match snapshot with config", () => {
      const result = renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });

    it("should match snapshot without config", () => {
      const result = renderInTestProvider(
        <SettingsScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });
  });
});
