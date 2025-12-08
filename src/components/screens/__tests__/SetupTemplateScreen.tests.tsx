/**
 * SetupTemplateScreen Component Unit Tests
 *
 * Tests for the template page selection screen.
 * Mocks Canva design APIs for page context and design operations.
 *
 * @module components/screens/SetupTemplateScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { SetupTemplateScreen } from "../SetupTemplateScreen";
import type { PhotoBoothConfig } from "../../../types";

// Mock @canva/design module
jest.mock("@canva/design", () => ({
  addPage: jest.fn(),
  getCurrentPageContext: jest.fn(),
  openDesign: jest.fn(),
}));

import { addPage, getCurrentPageContext, openDesign } from "@canva/design";

const mockAddPage = addPage as jest.MockedFunction<typeof addPage>;
const mockGetCurrentPageContext = getCurrentPageContext as jest.MockedFunction<
  typeof getCurrentPageContext
>;
const mockOpenDesign = openDesign as jest.MockedFunction<typeof openDesign>;

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

describe("SetupTemplateScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getCurrentPageContext
    mockGetCurrentPageContext.mockResolvedValue({
      dimensions: { width: 1920, height: 1080 },
    } as any);

    // Mock openDesign - simulate page with elements
    mockOpenDesign.mockImplementation(async (_opts, callback) => {
      await callback({
        page: {
          type: "absolute",
          elements: {
            toArray: () => [
              { type: "rect", id: "rect-1" },
              { type: "shape", id: "shape-1" },
              { type: "text", id: "text-1" },
            ],
          },
        },
      } as any);
    });

    // Mock addPage
    mockAddPage.mockResolvedValue({} as any);
  });

  // =========================================================================
  // Render Tests
  // =========================================================================

  describe("Rendering", () => {
    it("should display step title", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      expect(screen.getByText(/Step 1: Select Template/i)).toBeInTheDocument();
    });

    it("should display instructions section", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      expect(screen.getByText("Instructions")).toBeInTheDocument();
    });

    it("should display current page section", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      expect(screen.getByText("Current Page")).toBeInTheDocument();
    });

    it("should display page dimensions when loaded", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/1920 × 1080px/i)).toBeInTheDocument();
      });
    });

    it("should display element count", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/3 elements on page/i)).toBeInTheDocument();
      });
    });

    it("should show rect count as potential frames", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Found 2 element\(s\) that can be used as photo frames/i)
        ).toBeInTheDocument();
      });
    });

    it("should show warning when no image placeholders found", async () => {
      mockOpenDesign.mockImplementation(async (_opts, callback) => {
        await callback({
          page: {
            type: "absolute",
            elements: {
              toArray: () => [{ type: "text", id: "text-1" }],
            },
          },
        } as any);
      });

      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/No image placeholders found/i)
        ).toBeInTheDocument();
      });
    });

    it("should show existing template notice when configured", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Template page is already configured/i)
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Button Tests
  // =========================================================================

  describe("Buttons", () => {
    it("should have Use Current Page button", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Use Current Page as Template/i })
        ).toBeInTheDocument();
      });
    });

    it("should have Refresh button", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      expect(
        screen.getByRole("button", { name: /Refresh Page Info/i })
      ).toBeInTheDocument();
    });

    it("should have Back button", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      expect(screen.getByRole("button", { name: /← Back/i })).toBeInTheDocument();
    });

    it("should show Skip to Frame Setup when template configured", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Skip to Frame Setup/i })
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to home when Back is clicked", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      const backButton = screen.getByRole("button", { name: /← Back/i });
      fireEvent.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });

    it("should navigate to setup-frames when Skip is clicked", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const skipButton = screen.getByRole("button", {
          name: /Skip to Frame Setup/i,
        });
        fireEvent.click(skipButton);
      });

      expect(mockNavigateTo).toHaveBeenCalledWith("setup-frames");
    });
  });

  // =========================================================================
  // Use Current Page Tests
  // =========================================================================

  describe("Use Current Page", () => {
    it("should navigate to setup-frames after selecting template (no existing frames)", async () => {
      const configWithoutFrames = { ...sampleConfig, frames: [] };

      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={configWithoutFrames}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const usePageButton = screen.getByRole("button", {
          name: /Use Current Page as Template/i,
        });
        fireEvent.click(usePageButton);
      });

      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalled();
        expect(mockNavigateTo).toHaveBeenCalledWith("setup-frames");
      });
    });

    it("should show confirmation when existing frames exist", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const usePageButton = screen.getByRole("button", {
          name: /Use Current Page as Template/i,
        });
        fireEvent.click(usePageButton);
      });

      expect(
        screen.getByText(/You have 1 frame\(s\) configured/i)
      ).toBeInTheDocument();
    });

    it("should have Cancel button in confirmation dialog", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const usePageButton = screen.getByRole("button", {
          name: /Use Current Page as Template/i,
        });
        fireEvent.click(usePageButton);
      });

      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    it("should dismiss confirmation when Cancel is clicked", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const usePageButton = screen.getByRole("button", {
          name: /Use Current Page as Template/i,
        });
        fireEvent.click(usePageButton);
      });

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(
        screen.queryByText(/You have 1 frame\(s\) configured/i)
      ).not.toBeInTheDocument();
    });

    it("should create new config when none exists", async () => {
      await act(async () => {
        renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        const usePageButton = screen.getByRole("button", {
          name: /Use Current Page as Template/i,
        });
        fireEvent.click(usePageButton);
      });

      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            version: 1,
            frames: [],
          })
        );
      });
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshots", () => {
    it("should match snapshot without config", async () => {
      let result: RenderResult;

      await act(async () => {
        result = renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={null}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/1920 × 1080px/i)).toBeInTheDocument();
      });

      expect(result!.container).toMatchSnapshot();
    });

    it("should match snapshot with config", async () => {
      let result: RenderResult;

      await act(async () => {
        result = renderInTestProvider(
          <SetupTemplateScreen
            navigateTo={mockNavigateTo}
            config={sampleConfig}
            setConfig={mockSetConfig}
            session={null}
            setSession={mockSetSession}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/1920 × 1080px/i)).toBeInTheDocument();
      });

      expect(result!.container).toMatchSnapshot();
    });
  });
});
