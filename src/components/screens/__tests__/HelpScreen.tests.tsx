/**
 * HelpScreen Component Tests
 *
 * Tests for the help/how-to page that explains the Photo Booth workflow.
 *
 * @module components/screens/HelpScreen.tests
 */

import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { HelpScreen } from "../HelpScreen";

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

describe("HelpScreen", () => {
  const mockNavigateTo = jest.fn();
  const mockSetConfig = jest.fn();
  const mockSetSession = jest.fn();

  const defaultProps = {
    navigateTo: mockNavigateTo,
    config: null,
    setConfig: mockSetConfig,
    session: null,
    setSession: mockSetSession,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Rendering Tests
  // =========================================================================

  describe("Rendering", () => {
    it("should render the help screen title", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(screen.getByText("How It Works")).toBeInTheDocument();
    });

    it("should render the workflow section", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(screen.getByText("Workflow")).toBeInTheDocument();
    });

    it("should render all workflow steps", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(screen.getByText(/Design Your Template/i)).toBeInTheDocument();
      expect(screen.getByText(/Select Frame Placeholders/i)).toBeInTheDocument();
      // "Duplicate Your Template" appears in both step 3 and tips, so use getAllBy
      expect(screen.getAllByText(/Duplicate/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Capture Photos/i)).toBeInTheDocument();
      expect(screen.getByText(/Review & Place/i)).toBeInTheDocument();
    });

    it("should render the quick start section", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(screen.getByText("Quick Start")).toBeInTheDocument();
    });

    it("should render tips section", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(screen.getByText("Tips for Best Results")).toBeInTheDocument();
    });

    it("should render the important note about manual duplication", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(
        screen.getByText(/Important: Manual Page Duplication/i)
      ).toBeInTheDocument();
    });

    it("should render the back button", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Back to Home/i })
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  describe("Navigation", () => {
    it("should navigate to home when back button is clicked", () => {
      renderInTestProvider(<HelpScreen {...defaultProps} />);

      const backButton = screen.getByRole("button", { name: /Back to Home/i });
      fireEvent.click(backButton);

      expect(mockNavigateTo).toHaveBeenCalledWith("home");
    });
  });

  // =========================================================================
  // Snapshot Tests
  // =========================================================================

  describe("Snapshot", () => {
    it("should match snapshot", () => {
      const { container } = renderInTestProvider(
        <HelpScreen {...defaultProps} />
      );

      expect(container).toMatchSnapshot();
    });
  });
});
