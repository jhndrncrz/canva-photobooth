/**
 * CompleteScreen Component Unit Tests
 *
 * Tests for the success screen shown after photo booth output is generated.
 * Verifies summary display, export functionality, and navigation options.
 *
 * @module components/screens/CompleteScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { CompleteScreen } from "../CompleteScreen";
import type { PhotoBoothConfig, CaptureSession } from "../../../types";

// Mock @canva/design module
jest.mock("@canva/design", () => ({
  requestExport: jest.fn(),
}));

import { requestExport } from "@canva/design";

const mockRequestExport = requestExport as jest.MockedFunction<typeof requestExport>;

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

/**
 * Sample session for testing
 */
const sampleSession: CaptureSession = {
  sessionId: "test-session-123",
  photos: [
    {
      id: "photo-1",
      dataUrl: "data:image/jpeg;base64,/9j/fake1",
      capturedAt: "2025-01-01T00:00:01.000Z",
      frameId: "frame-1",
    },
    {
      id: "photo-2",
      dataUrl: "data:image/jpeg;base64,/9j/fake2",
      capturedAt: "2025-01-01T00:00:02.000Z",
      frameId: "frame-2",
    },
  ],
  status: "complete",
  currentPhotoIndex: 2,
  startedAt: "2025-01-01T00:00:00.000Z",
};

describe("CompleteScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  const defaultProps = {
    navigateTo: mockNavigateTo,
    config: sampleConfig,
    setConfig: mockSetConfig,
    session: sampleSession,
    setSession: mockSetSession,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestExport.mockResolvedValue({ status: "completed" } as any);
  });

  // =========================================================================
  // Render Tests
  // =========================================================================

  describe("Rendering", () => {
    it("should display success title", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText(/Photo Booth Complete!/i)).toBeInTheDocument();
    });

    it("should display success checkmark", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should display success message", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(
        screen.getByText(/Your photos have been placed on the current page successfully/i)
      ).toBeInTheDocument();
    });

    it("should display session summary", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText(/Session Summary/i)).toBeInTheDocument();
    });

    it("should display photo count", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText(/Photos captured: 2/i)).toBeInTheDocument();
    });

    it("should display output page status", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText(/Photos placed on page: Yes/i)).toBeInTheDocument();
    });

    it("should display next steps section", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(screen.getByText(/Next Steps/i)).toBeInTheDocument();
      expect(screen.getByText(/Review and adjust photo positions/i)).toBeInTheDocument();
    });

    it("should handle session with no photos", () => {
      const emptySession: CaptureSession = {
        ...sampleSession,
        photos: [],
      };

      renderInTestProvider(
        <CompleteScreen {...defaultProps} session={emptySession} />
      );

      expect(screen.getByText(/Photos captured: 0/i)).toBeInTheDocument();
    });

    it("should handle null session", () => {
      renderInTestProvider(
        <CompleteScreen {...defaultProps} session={null} />
      );

      expect(screen.getByText(/Photos captured: 0/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Button Tests
  // =========================================================================

  describe("Buttons", () => {
    it("should have Export Design button", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Export Design/i })
      ).toBeInTheDocument();
    });

    it("should have Start New Session button", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Start New Session/i })
      ).toBeInTheDocument();
    });

    it("should have Back to Menu button", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Back to Menu/i })
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to capture and clear session when Start New Session is clicked", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      const newSessionButton = screen.getByRole("button", {
        name: /Start New Session/i,
      });
      fireEvent.click(newSessionButton);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockNavigateTo).toHaveBeenCalledWith("capture");
    });

    it("should navigate to home and clear session when Back to Menu is clicked", () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      const homeButton = screen.getByRole("button", {
        name: /Back to Menu/i,
      });
      fireEvent.click(homeButton);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });
  });

  // =========================================================================
  // Export Tests
  // =========================================================================

  describe("Export Functionality", () => {
    it("should call requestExport when Export Design is clicked", async () => {
      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /Export Design/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockRequestExport).toHaveBeenCalledWith({
          acceptedFileTypes: ["png", "jpg", "pdf_standard"],
        });
      });
    });

    it("should show error when export fails", async () => {
      mockRequestExport.mockRejectedValueOnce(new Error("Export error"));

      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /Export Design/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText("Export error")).toBeInTheDocument();
      });
    });

    it("should disable export button while exporting", async () => {
      // Make the export take longer
      mockRequestExport.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: "completed" } as any), 1000))
      );

      renderInTestProvider(<CompleteScreen {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /Export Design/i });
      fireEvent.click(exportButton);

      // Button should show loading state - check aria-disabled
      await waitFor(() => {
        expect(exportButton).toHaveAttribute("aria-disabled", "true");
      });
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshots", () => {
    it("should match snapshot with session", () => {
      const result = renderInTestProvider(<CompleteScreen {...defaultProps} />);

      expect(result.container).toMatchSnapshot();
    });

    it("should match snapshot without session", () => {
      const result = renderInTestProvider(
        <CompleteScreen {...defaultProps} session={null} />
      );

      expect(result.container).toMatchSnapshot();
    });
  });
});
