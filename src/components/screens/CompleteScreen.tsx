/**
 * CompleteScreen Component
 *
 * Success screen shown after output page is generated.
 */

import React, { useCallback, useState } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import { requestExport } from "@canva/design";
import type { ScreenProps } from "../../types";
import * as styles from "styles/components.css";

export const CompleteScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  session,
  setSession,
}) => {
  const intl = useIntl();
  const photoCount = session?.photos.length || 0;
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Start a new capture session
   */
  const handleStartNew = useCallback(() => {
    setSession(null);
    navigateTo("capture");
  }, [setSession, navigateTo]);

  /**
   * Go back to home
   */
  const handleGoHome = useCallback(() => {
    setSession(null);
    navigateTo("home");
  }, [setSession, navigateTo]);

  /**
   * Export the design (user can navigate to the output page first)
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const result = await requestExport({
        acceptedFileTypes: ["png", "jpg", "pdf_standard"],
      });
      
      if (result.status === "completed") {
        console.log("[PhotoBooth] Export completed:", result.exportBlobs);
      }
    } catch (e) {
      console.error("Export failed:", e);
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        {/* Success icon and message */}
        <Box paddingTop="4u" paddingBottom="2u">
          <Rows spacing="2u" align="center">
            {/* Success checkmark */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "#00c853",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "white",
                fontSize: "40px",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <Title size="large">
              <FormattedMessage
                defaultMessage="Photo Booth Complete!"
                description="Success title"
              />
            </Title>

            <Text alignment="center" tone="tertiary">
              <FormattedMessage
                defaultMessage="Your photos have been placed on the current page successfully."
                description="Success message"
              />
            </Text>
          </Rows>
        </Box>

        {/* Summary */}
        <Box
          padding="2u"
          background="neutralLow"
          borderRadius="large"
        >
          <Rows spacing="1u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Session Summary"
                description="Summary header"
              />
            </Title>
            <Text size="small">
              <FormattedMessage
                defaultMessage="Photos captured: {count}"
                description="Photo count"
                values={{ count: photoCount }}
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="Photos placed on page: Yes"
                description="Output status"
              />
            </Text>
            <Text size="small" tone="tertiary">
              <FormattedMessage
                defaultMessage="Your captured photos have been placed at the frame positions on the current page."
                description="Output description"
              />
            </Text>
          </Rows>
        </Box>

        {/* Tips */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Next Steps"
                description="Tips header"
              />
            </Title>
            <Text size="small">
              <FormattedMessage
                defaultMessage="• Review and adjust photo positions if needed"
                description="Tip 1"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="• Delete the placeholder images beneath the photos"
                description="Tip 2"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="• Duplicate your template page again for more sessions"
                description="Tip 3"
              />
            </Text>
          </Rows>
        </Box>

        {/* Export error */}
        {exportError && (
          <Alert tone="critical">
            <Text>{exportError}</Text>
          </Alert>
        )}

        {/* Action buttons */}
        <Rows spacing="2u">
          <Button 
            variant="primary" 
            onClick={handleExport} 
            stretch
            disabled={isExporting}
            loading={isExporting}
          >
            {intl.formatMessage({
              defaultMessage: "Export Design",
              description: "Export button",
            })}
          </Button>

          <Button variant="secondary" onClick={handleStartNew} stretch>
            {intl.formatMessage({
              defaultMessage: "Start New Session",
              description: "New session button",
            })}
          </Button>

          <Button variant="tertiary" onClick={handleGoHome} stretch>
            {intl.formatMessage({
              defaultMessage: "Back to Menu",
              description: "Home button",
            })}
          </Button>
        </Rows>
      </Rows>
    </div>
  );
};

export default CompleteScreen;
