/**
 * SetupFramesScreen Component Unit Tests
 *
 * Tests for the frame selection and ordering screen.
 * Mocks Canva design APIs and selection hook.
 *
 * @module components/screens/SetupFramesScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { SetupFramesScreen } from "../SetupFramesScreen";
import type { PhotoBoothConfig } from "../../../types";

// Mock @canva/design module
jest.mock("@canva/design", () => ({
  openDesign: jest.fn(),
}));

// Mock the selection hook
jest.mock("utils/use_selection_hook", () => ({
  useSelection: jest.fn(),
}));

import { openDesign } from "@canva/design";
import { useSelection } from "utils/use_selection_hook";

const mockOpenDesign = openDesign as jest.MockedFunction<typeof openDesign>;
const mockUseSelection = useSelection as jest.MockedFunction<typeof useSelection>;

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
      imageRef: "image-ref-1",
      order: 1,
      width: 300,
      height: 200,
      top: 100,
      left: 100,
      rotation: 0,
      transparency: 1,
      elementIndex: 0,
    },
    {
      id: "frame-2",
      elementType: "image",
      imageRef: "image-ref-2",
      order: 2,
      width: 300,
      height: 200,
      top: 100,
      left: 450,
      rotation: 0,
      transparency: 1,
      elementIndex: 1,
    },
  ],
  captureSettings: {
    countdownSeconds: 3,
    captureCount: 2,
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
 * Config without frames
 */
const configWithoutFrames: PhotoBoothConfig = {
  ...sampleConfig,
  frames: [],
  captureSettings: {
    ...sampleConfig.captureSettings,
    captureCount: 0,
  },
};

/**
 * Mock selection hook return value
 */
const mockSelectionHook = {
  count: 0,
  read: jest.fn(),
};

describe("SetupFramesScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useSelection - no selection
    mockUseSelection.mockReturnValue(mockSelectionHook as any);
    mockSelectionHook.count = 0;
    mockSelectionHook.read.mockResolvedValue({ contents: [] });

    // Mock openDesign
    mockOpenDesign.mockImplementation(async (_opts, callback) => {
      await callback({
        page: {
          type: "absolute",
          elements: {
            forEach: jest.fn(),
          },
        },
      } as any);
    });
  });

  // =========================================================================
  // Render Tests
  // =========================================================================

  describe("Rendering", () => {
    it("should display step title", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Step 2: Define Frame Placeholders/i)).toBeInTheDocument();
    });

    it("should display instructions", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByText(/Select image placeholders for captured photos/i)
      ).toBeInTheDocument();
    });

    it("should display selection status when no images selected", () => {
      mockSelectionHook.count = 0;

      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByText(/0 images selected/i)
      ).toBeInTheDocument();
    });

    it("should display selection count when images are selected", () => {
      mockUseSelection.mockReturnValue({
        count: 3,
        read: jest.fn().mockResolvedValue({ contents: [] }),
      } as any);

      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/3 images selected/i)).toBeInTheDocument();
    });

    it("should display existing frames", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText(/Frame 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Frame 2/i)).toBeInTheDocument();
    });

    it("should display empty state when no frames added", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByText(/No frames added yet/i)
      ).toBeInTheDocument();
    });

    it("should show frame count badge", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Button Tests
  // =========================================================================

  describe("Buttons", () => {
    it("should have Select Images to Add as Frames button", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Select Images to Add as Frames/i })
      ).toBeInTheDocument();
    });

    it("should have Clear All button when frames exist", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Clear All/i })
      ).toBeInTheDocument();
    });

    it("should have Back button", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /← Back/i })
      ).toBeInTheDocument();
    });

    it("should have Save & Continue button", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(
        screen.getByRole("button", { name: /Save & Continue/i })
      ).toBeInTheDocument();
    });

    it("should disable Save & Continue when no frames", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const continueButton = screen.getByRole("button", {
        name: /Save & Continue/i,
      });
      expect(continueButton).toHaveAttribute("aria-disabled", "true");
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to setup-template when Back is clicked", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const backButton = screen.getByRole("button", { name: /← Back/i });
      fireEvent.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("setup-template");
    });

    it("should navigate to home when Save & Continue is clicked", async () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const continueButton = screen.getByRole("button", {
        name: /Save & Continue/i,
      });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalled();
        expect(mockNavigateTo).toHaveBeenCalledWith("home");
      });
    });
  });

  // =========================================================================
  // Add Frame Tests
  // =========================================================================

  describe("Adding Frames", () => {
    it("should disable add button when no images are selected", () => {
      mockUseSelection.mockReturnValue({
        count: 0,
        read: jest.fn().mockResolvedValue({ contents: [] }),
      } as any);

      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const addButton = screen.getByRole("button", {
        name: /Select Images to Add as Frames/i,
      });

      // Button should be disabled when no selection
      expect(addButton).toHaveAttribute("aria-disabled", "true");
    });
  });

  // =========================================================================
  // Remove Frame Tests
  // =========================================================================

  describe("Removing Frames", () => {
    it("should have remove button for each frame", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      // There should be remove buttons (one for each frame) with ✕ text
      const removeButtons = screen.getAllByRole("button", { name: /✕/i });
      expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // Clear Frames Tests
  // =========================================================================

  describe("Clearing Frames", () => {
    it("should clear all frames when Clear All is clicked", async () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      const clearButton = screen.getByRole("button", { name: /Clear All/i });
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(screen.getByText(/No frames added yet/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe("Error Handling", () => {
    it("should render with empty state when config is null", () => {
      renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={null}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      // Should show empty frame state
      expect(
        screen.getByText(/No frames added yet/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshots", () => {
    it("should match snapshot with frames", () => {
      const result = renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={sampleConfig}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });

    it("should match snapshot without frames", () => {
      const result = renderInTestProvider(
        <SetupFramesScreen
          navigateTo={mockNavigateTo}
          config={configWithoutFrames}
          setConfig={mockSetConfig}
          session={null}
          setSession={mockSetSession}
        />
      );

      expect(result.container).toMatchSnapshot();
    });

    it("should match snapshot with null config", () => {
      const result = renderInTestProvider(
        <SetupFramesScreen
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
