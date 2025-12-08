/**
 * CaptureScreen Component Unit Tests
 *
 * Tests for the photo capture session management screen.
 * Mocks fetch API for backend communication and clipboard API.
 *
 * @module components/screens/CaptureScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { CaptureScreen } from "../CaptureScreen";
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
    {
      id: "frame-2",
      elementType: "image",
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
 * Mock session response from backend
 */
const mockSessionResponse = {
  sessionId: "test-session-123",
  cameraUrl: "/camera/test-session-123",
};

/**
 * Mock session status response - waiting state
 */
const mockStatusWaiting = {
  sessionId: "test-session-123",
  status: "waiting" as const,
  frameCount: 2,
  capturedCount: 0,
  photos: [],
};

/**
 * Mock session status response - capturing state
 */
const mockStatusCapturing = {
  sessionId: "test-session-123",
  status: "capturing" as const,
  frameCount: 2,
  capturedCount: 1,
  photos: [
    {
      id: "photo-1",
      dataUrl: "data:image/jpeg;base64,/9j/fake",
      capturedAt: "2025-01-01T00:00:01.000Z",
      frameIndex: 0,
    },
  ],
};

/**
 * Mock session status response - complete state
 */
const mockStatusComplete = {
  sessionId: "test-session-123",
  status: "complete" as const,
  frameCount: 2,
  capturedCount: 2,
  photos: [
    {
      id: "photo-1",
      dataUrl: "data:image/jpeg;base64,/9j/fake1",
      capturedAt: "2025-01-01T00:00:01.000Z",
      frameIndex: 0,
    },
    {
      id: "photo-2",
      dataUrl: "data:image/jpeg;base64,/9j/fake2",
      capturedAt: "2025-01-01T00:00:02.000Z",
      frameIndex: 1,
    },
  ],
};

describe("CaptureScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  // Store original fetch and clipboard
  const originalFetch = global.fetch;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Mock fetch - default to successful session creation
    global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
      // POST to create session
      if (url.includes("/api/photobooth/session") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSessionResponse),
        } as Response);
      }

      // GET to check session status
      if (url.includes("/api/photobooth/session/test-session-123") && (!options || options.method === "GET" || options.method === undefined)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatusWaiting),
        } as Response);
      }

      // DELETE to cancel session
      if (url.includes("/api/photobooth/session/") && options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
    });
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================

  describe("Initial State", () => {
    it("should display capture session UI after loading", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      // After session creation, should show active session
      await waitFor(() => {
        expect(screen.getByText(/Capture Session Active/i)).toBeInTheDocument();
      });
    });

    it("should call fetch to create session on mount", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/photobooth/session"),
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
      });
    });
  });

  // =========================================================================
  // Successful Session Creation Tests
  // =========================================================================

  describe("Successful Session Creation", () => {
    it("should display capture session title after creation", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Capture Session Active/i)).toBeInTheDocument();
      });
    });

    it("should show link copied notification", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Camera link copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it("should copy URL to clipboard on creation", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it("should display QR code", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const qrCode = screen.getByAltText(/QR Code/i);
        expect(qrCode).toBeInTheDocument();
        expect(qrCode).toHaveAttribute("src", expect.stringContaining("qrserver.com"));
      });
    });

    it("should display progress bar", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Capture Progress/i)).toBeInTheDocument();
        expect(screen.getByText(/0 of 2 photos captured/i)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe("Error Handling", () => {
    it("should show error when config is null", async () => {
      // Don't use fake timers for this test - let effects run naturally
      jest.useRealTimers();

      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Configuration not found/i)).toBeInTheDocument();
      });

      // Restore fake timers for other tests
      jest.useFakeTimers();
    });

    it("should show error when session creation fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to create capture session/i)).toBeInTheDocument();
      });
    });

    it("should show Try Again button on error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it("should show Back to Menu button on error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Back to Menu/i })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to home when cancel is clicked", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Capture Session Active/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel Session/i });
      
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });

    it("should navigate to home when Back to Menu is clicked on error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const backButton = screen.getByRole("button", { name: /Back to Menu/i });
        fireEvent.click(backButton);
      });

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });
  });

  // =========================================================================
  // Copy Link Tests
  // =========================================================================

  describe("Copy Link", () => {
    it("should have Copy Camera Link button", async () => {
      await act(async () => {
        renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        // After auto-copy, button shows "Link Copied!" then reverts
        expect(screen.getByRole("button", { name: /Link Copied|Copy Camera Link/i })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshots", () => {
    it("should match snapshot in loading state", async () => {
      let result: RenderResult;
      
      await act(async () => {
        result = renderInTestProvider(
          <CaptureScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      // Snapshot while loading
      expect(result!.container).toMatchSnapshot();
    });
  });
});
