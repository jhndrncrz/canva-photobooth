/**
 * SetupTemplateScreen Component
 *
 * Screen for selecting the template page from the current design.
 * Shows a preview of the current page and allows the user to use it as a template.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  LoadingIndicator,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import {
  addPage,
  getCurrentPageContext,
  openDesign,
} from "@canva/design";
import type { ScreenProps } from "../../types";
import { TEMPLATE_PAGE_TITLE } from "../../constants";
import * as styles from "styles/components.css";

export const SetupTemplateScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  setConfig,
}) => {
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("Untitled Page");
  const [elementCount, setElementCount] = useState<number>(0);
  const [rectCount, setRectCount] = useState<number>(0);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Check if user already has frames configured
  const hasExistingFrames = config?.frames && config.frames.length > 0;

  const handleBack = () => {
    navigateTo("home");
  };

  /**
   * Load current page info (without preview to avoid export UI)
   */
  const loadPageInfo = useCallback(async () => {
    setIsLoadingPreview(true);
    setError(null);

    try {
      // Get page dimensions
      const pageContext = await getCurrentPageContext();
      if (pageContext.dimensions) {
        setPageDimensions({
          width: pageContext.dimensions.width,
          height: pageContext.dimensions.height,
        });
      }

      // Count elements on the page and get page title
      await openDesign({ type: "current_page" }, async (session) => {
        if (session.page.type === "absolute") {
          const allElements = session.page.elements.toArray();
          setElementCount(allElements.length);

          // Count rect/shape elements specifically
          const rects = allElements.filter(
            (el) => el.type === "rect" || el.type === "shape"
          );
          setRectCount(rects.length);

          // Get page title from title property if available
          // Note: title may not be available on all page types
          setPageTitle("Current Page");
        }
      });

      // Note: We don't call requestExport here to avoid showing export UI
      // The page preview feature was removed to prevent premature export dialog
    } catch (e) {
      console.error("Error loading page info:", e);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Load page info on mount
  useEffect(() => {
    loadPageInfo();
  }, [loadPageInfo]);

  /**
   * Show confirmation if frames exist, otherwise proceed
   */
  const handleUseCurrentPageClick = useCallback(() => {
    if (hasExistingFrames) {
      setShowConfirmReset(true);
    } else {
      handleUseCurrentPage();
    }
  }, [hasExistingFrames]);

  /**
   * Cancel confirmation
   */
  const handleCancelReset = useCallback(() => {
    setShowConfirmReset(false);
  }, []);

  /**
   * Confirm reset and proceed
   */
  const handleConfirmReset = useCallback(() => {
    setShowConfirmReset(false);
    handleUseCurrentPage();
  }, []);

  /**
   * Use the current page as the template
   */
  const handleUseCurrentPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique template identifier
      const templateId = `template_${Date.now()}`;

      // Reset frames when changing template
      if (config) {
        const updatedConfig = {
          ...config,
          templatePageId: templateId,
          frames: [], // Reset frames
          captureSettings: {
            ...config.captureSettings,
            captureCount: 0,
          },
          updatedAt: new Date().toISOString(),
        };
        setConfig(updatedConfig);
      } else {
        const newConfig = {
          version: 1,
          templatePageId: templateId,
          configPageId: "",
          frames: [],
          captureSettings: {
            countdownSeconds: 3,
            captureCount: 0,
            playShutterSound: true,
            playCountdownSound: true,
            showFlashEffect: true,
            facingMode: "user" as const,
            captureMode: "manual" as const,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConfig(newConfig);
      }

      // Navigate to frame setup
      navigateTo("setup-frames");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to select template page";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [config, setConfig, navigateTo]);

  /**
   * Create a new page to use as template
   */
  const handleCreateNewTemplate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Add a new page with a title
      await addPage({
        title: TEMPLATE_PAGE_TITLE,
      });

      // Generate a unique template identifier
      const templateId = `template_${Date.now()}`;

      // Update or create config
      if (config) {
        const updatedConfig = {
          ...config,
          templatePageId: templateId,
          updatedAt: new Date().toISOString(),
        };
        setConfig(updatedConfig);
      } else {
        const newConfig = {
          version: 1,
          templatePageId: templateId,
          configPageId: "",
          frames: [],
          captureSettings: {
            countdownSeconds: 3,
            captureCount: 0,
            playShutterSound: true,
            playCountdownSound: true,
            showFlashEffect: true,
            facingMode: "user" as const,
            captureMode: "manual" as const,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConfig(newConfig);
      }

      // Navigate to frame setup
      navigateTo("setup-frames");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create template page";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [config, setConfig, navigateTo]);

  if (isLoading) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Box padding="4u">
            <Rows spacing="2u" align="center">
              <LoadingIndicator size="medium" />
              <Text alignment="center">
                <FormattedMessage
                  defaultMessage="Setting up template..."
                  description="Loading message"
                />
              </Text>
            </Rows>
          </Box>
        </Rows>
      </div>
    );
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        {/* Header */}
        <Box>
          <Rows spacing="1u">
            <Title size="medium">
              <FormattedMessage
                defaultMessage="Step 1: Select Template"
                description="Setup step title"
              />
            </Title>
            <Text tone="tertiary">
              <FormattedMessage
                defaultMessage="Choose a page to use as your photo booth template"
                description="Setup step description"
              />
            </Text>
          </Rows>
        </Box>

        {/* Instructions */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Instructions"
                description="Instructions header"
              />
            </Title>

            <Text size="small">
              <FormattedMessage
                defaultMessage="1. Add image placeholders where you want photos to appear"
                description="Instruction 1"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="2. Position and size the images as placeholders"
                description="Instruction 2"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="3. Add decorations, text, and backgrounds around the frames"
                description="Instruction 3"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="4. Select the page you want to use as template"
                description="Instruction 4"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="5. Click 'Use Current Page as Template'"
                description="Instruction 5"
              />
            </Text>
          </Rows>
        </Box>

        {/* Error display */}
        {error && (
          <Alert tone="critical">
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Current Page Preview */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Current Page"
                description="Current page section"
              />
            </Title>

            {isLoadingPreview ? (
              <Box padding="3u">
                <Rows spacing="1u" align="center">
                  <LoadingIndicator size="medium" />
                  <Text size="small" tone="tertiary" alignment="center">
                    <FormattedMessage
                      defaultMessage="Loading page info..."
                      description="Loading preview"
                    />
                  </Text>
                </Rows>
              </Box>
            ) : (
              <Rows spacing="1.5u">
                {/* Page dimensions */}
                {pageDimensions && (
                  <Box padding="1.5u" background="neutralLow" borderRadius="standard">
                    <Rows spacing="0.5u">
                      <Text size="small">
                        <FormattedMessage
                          defaultMessage="Page Size: {width} × {height}px"
                          description="Page dimensions"
                          values={{
                            width: Math.round(pageDimensions.width),
                            height: Math.round(pageDimensions.height),
                          }}
                        />
                      </Text>
                      <Text size="small" tone="tertiary">
                        <FormattedMessage
                          defaultMessage="{count} elements on page"
                          description="Element count"
                          values={{
                            count: elementCount,
                          }}
                        />
                      </Text>
                    </Rows>
                  </Box>
                )}

                {/* Rectangle status */}
                {rectCount === 0 ? (
                  <Alert tone="warn">
                    <FormattedMessage
                      defaultMessage="No image placeholders found on this page. Add image placeholders to use as photo frames."
                      description="No image placeholders warning"
                    />
                  </Alert>
                ) : (
                  <Alert tone="positive">
                    <FormattedMessage
                      defaultMessage="Found {count} element(s) that can be used as photo frames!"
                      description="Placeholders found"
                      values={{ count: rectCount }}
                    />
                  </Alert>
                )}
              </Rows>
            )}
          </Rows>
        </Box>

        {/* Current page info */}
        {config?.templatePageId && (
          <Alert tone="positive">
            <FormattedMessage
              defaultMessage="Template page is already configured. You can update it or proceed to frame setup."
              description="Existing template notice"
            />
          </Alert>
        )}

        {/* Confirmation dialog for resetting frames */}
        {showConfirmReset && (
          <Box padding="3u" borderRadius="large">
            <Alert tone="warn">
              <Rows spacing="2u">
                <Text>
                  <FormattedMessage
                    defaultMessage="⚠️ You have {count} frame(s) configured. Changing the template will reset all frames. Are you sure?"
                    description="Confirm reset message"
                    values={{ count: config?.frames?.length || 0 }}
                  />
                </Text>
                <Rows spacing="1u">
                  <Button variant="primary" onClick={handleConfirmReset} stretch>
                    {intl.formatMessage({
                      defaultMessage: "Yes, Reset Frames & Continue",
                      description: "Confirm reset button",
                    })}
                  </Button>
                  <Button variant="tertiary" onClick={handleCancelReset} stretch>
                    {intl.formatMessage({
                      defaultMessage: "Cancel",
                      description: "Cancel reset button",
                    })}
                  </Button>
                </Rows>
              </Rows>
            </Alert>
          </Box>
        )}

        {/* Action buttons */}
        {!showConfirmReset && (
          <Rows spacing="2u">
            <Button variant="primary" onClick={handleUseCurrentPageClick} stretch>
              {intl.formatMessage({
                defaultMessage: "Use Current Page as Template",
                description: "Button to use current page",
              })}
            </Button>

            {/* <Button
              variant="secondary"
              onClick={handleCreateNewTemplate}
              stretch
            >
              {intl.formatMessage({
                defaultMessage: "Create New Template Page",
                description: "Button to create new page",
              })}
            </Button> */}
          </Rows>
        )}

        {/* Skip to frames if template already set */}
        {config?.templatePageId && (
          <Button
            variant="tertiary"
            onClick={() => navigateTo("setup-frames")}
            stretch
          >
            {intl.formatMessage({
              defaultMessage: "Skip to Frame Setup",
              description: "Button to skip to frames",
            })}
          </Button>
        )}

        {/* Refresh button */}
        <Button variant="tertiary" onClick={loadPageInfo} stretch>
          {intl.formatMessage({
            defaultMessage: "↻ Refresh Page Info",
            description: "Button to refresh page info",
          })}
        </Button>

        {/* Back button */}
        <Button variant="tertiary" onClick={handleBack}>
          {intl.formatMessage({
            defaultMessage: "← Back",
            description: "Back button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

export default SetupTemplateScreen;
