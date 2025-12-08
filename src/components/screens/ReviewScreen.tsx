/**
 * ReviewScreen Component
 *
 * Shows captured photos for review before generating the output.
 * Creates a NEW page with captured photos placed at frame positions.
 */

import React, { useState, useCallback } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  LoadingIndicator,
  Grid,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import { addPage } from "@canva/design";
import { upload, type ImageRef } from "@canva/asset";
import type { ScreenProps, CapturedPhoto } from "../../types";
import { convertTemplateToPageElements } from "../../services/templateService";
import * as styles from "styles/components.css";

export const ReviewScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  session,
  setSession,
}) => {
  const intl = useIntl();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const photos = session?.photos || [];
  const frames = config?.frames || [];

  /**
   * Generate the output by creating a NEW page with captured photos
   * Uses addPage to create a fresh page with images at frame positions
   */
  const handleGenerateOutput = useCallback(async () => {
    if (!config || photos.length === 0) {
      setError("No photos or configuration available");
      return;
    }

    if (frames.length === 0) {
      setError("No frame placeholders configured");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProgressMessage("Uploading photos...");

    try {
      // Sort frames by order to match photos correctly
      const sortedFrames = [...frames].sort((a, b) => a.order - b.order);
      
      /**
       * Normalize rotation to be within -180 to 180 range (Canva API requirement)
       */
      const normalizeRotation = (rotation: number): number => {
        let normalized = rotation % 360;
        if (normalized > 180) normalized -= 360;
        if (normalized < -180) normalized += 360;
        return Math.round(normalized);
      };
      
      /**
       * Clamp a value to be within a valid range for Canva API
       * Positions: -32768 to 32767
       * Dimensions: 0 to 32767
       */
      const clampPosition = (value: number): number => {
        return Math.round(Math.max(-32768, Math.min(32767, value)));
      };
      
      const clampDimension = (value: number): number => {
        return Math.round(Math.max(1, Math.min(32767, value)));
      };

      // Step 1: Upload all photos to Canva and wait for each to complete
      const uploadedRefs: ImageRef[] = [];

      for (let i = 0; i < photos.length; i++) {
        const progressPercent = Math.round(((i + 1) / photos.length) * 70);
        setProgress(progressPercent);
        setProgressMessage(`Uploading photo ${i + 1} of ${photos.length}...`);

        const photo = photos[i];
        if (!photo || !photo.dataUrl) {
          console.warn(`Photo ${i + 1} has no dataUrl, skipping`);
          continue;
        }

        try {
          console.log(`Uploading photo ${i + 1}, dataUrl length: ${photo.dataUrl.length}`);
          
          const result = await upload({
            type: "image",
            url: photo.dataUrl,
            mimeType: "image/jpeg",
            thumbnailUrl: photo.dataUrl,
            aiDisclosure: "none",
          });

          // Wait for the upload to complete before using the ref
          console.log(`Waiting for photo ${i + 1} upload to complete...`);
          await result.whenUploaded();
          console.log(`Photo ${i + 1} upload complete`);

          uploadedRefs.push(result.ref);
        } catch (uploadError) {
          console.error(`Failed to upload photo ${i + 1}:`, uploadError);
          throw new Error(`Failed to upload photo ${i + 1}. Please try again.`);
        }
      }

      if (uploadedRefs.length === 0) {
        throw new Error("No photos were uploaded successfully");
      }

      setProgressMessage("Creating output page...");
      setProgress(80);

      // Step 2: Get template elements (excluding frame placeholders)
      // Frame placeholders are the images that will be replaced by captured photos
      const frameImageRefs = frames
        .filter((f) => f.imageRef)
        .map((f) => f.imageRef as string);

      let templateElements: ReturnType<typeof convertTemplateToPageElements> = [];
      if (config.templateData) {
        console.log(
          `Converting ${config.templateData.elements.length} template elements...`
        );
        templateElements = convertTemplateToPageElements(
          config.templateData,
          frameImageRefs
        );
        console.log(
          `Got ${templateElements.length} template elements (after excluding frame placeholders)`
        );
      } else {
        console.log("No template data stored, only adding photos");
      }

      // Step 3: Build photo elements array for the new page
      const photoElements: Array<{
        type: "image";
        ref: ImageRef;
        altText: { text: string; decorative: boolean };
        top: number;
        left: number;
        width: number;
        height: number;
        rotation: number;
      }> = [];

      for (let i = 0; i < sortedFrames.length && i < uploadedRefs.length; i++) {
        const frame = sortedFrames[i];
        const photoRef = uploadedRefs[i];
        
        if (frame && photoRef) {
          const element = {
            type: "image" as const,
            ref: photoRef,
            altText: { text: `Photo ${i + 1}`, decorative: false },
            top: clampPosition(frame.top),
            left: clampPosition(frame.left),
            width: clampDimension(frame.width),
            height: clampDimension(frame.height),
            rotation: normalizeRotation(frame.rotation || 0),
          };
          
          console.log(`Photo element ${i + 1}:`, {
            top: element.top,
            left: element.left,
            width: element.width,
            height: element.height,
            rotation: element.rotation,
          });
          
          photoElements.push(element);
        }
      }

      setProgress(90);
      
      // Step 4: Combine template elements with photo elements
      // Template elements go first (background, decorations), photos on top
      const allElements = [...templateElements, ...photoElements];
      
      console.log(
        `Creating page with ${allElements.length} elements ` +
        `(${templateElements.length} template + ${photoElements.length} photos)...`
      );
      
      // Step 5: Create a new page with all elements
      try {
        await addPage({
          title: `Photo Booth - ${new Date().toLocaleString()}`,
          elements: allElements,
        });
        console.log("addPage completed successfully");
      } catch (addPageError) {
        console.error("Failed to create output page:", addPageError);
        throw new Error("Failed to create the output page. Please try again.");
      }

      setProgress(100);
      setProgressMessage(`Created output page with ${photoElements.length} photo${photoElements.length !== 1 ? "s" : ""}!`);

      // Update session status
      if (session) {
        setSession({
          ...session,
          status: "complete",
        });
      }

      // Navigate to complete screen after a short delay
      setTimeout(() => {
        navigateTo("complete");
      }, 1000);
    } catch (e) {
      console.error("Failed to generate output:", e);
      const message =
        e instanceof Error ? e.message : "Failed to generate output";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [config, photos, frames, session, setSession, navigateTo]);

  /**
   * Go back to capture for retakes
   */
  const handleRetake = useCallback(() => {
    // Clear session to start fresh
    setSession(null);
    navigateTo("capture");
  }, [setSession, navigateTo]);

  /**
   * Cancel and go home
   */
  const handleCancel = useCallback(() => {
    setSession(null);
    navigateTo("home");
  }, [setSession, navigateTo]);

  // Processing state
  if (isProcessing) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Box padding="4u">
            <Rows spacing="2u" align="center">
              <LoadingIndicator size="medium" />
              <Title size="small">
                <FormattedMessage
                  defaultMessage="Generating Output"
                  description="Processing title"
                />
              </Title>
              <Text alignment="center" tone="tertiary">
                {progressMessage}
              </Text>
              <Box padding="2u">
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: "#8b3dff",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </Box>
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
                defaultMessage="Review Photos"
                description="Screen title"
              />
            </Title>
            <Text tone="tertiary">
              <FormattedMessage
                defaultMessage="Review your captured photos before generating the output"
                description="Screen description"
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

        {/* Photo grid */}
        {photos.length > 0 ? (
          <Box>
            <Rows spacing="2u">
              <Title size="xsmall">
                <FormattedMessage
                  defaultMessage="Captured Photos ({count})"
                  description="Photo section header"
                  values={{ count: photos.length }}
                />
              </Title>
              <Grid columns={2} spacing="1u">
                {photos.map((photo, index) => (
                  <Box
                    key={photo.id}
                    borderRadius="standard"
                  >
                    <div
                      style={{
                        position: "relative",
                        paddingTop: "75%",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "#f0f0f0",
                      }}
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Captured photo ${index + 1}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "4px",
                          left: "4px",
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  </Box>
                ))}
              </Grid>
            </Rows>
          </Box>
        ) : (
          <Alert tone="warn">
            <FormattedMessage
              defaultMessage="No photos captured. Please go back and capture some photos."
              description="No photos warning"
            />
          </Alert>
        )}

        {/* Frame mapping info */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Frame Mapping"
                description="Frame mapping header"
              />
            </Title>
            {frames.map((frame, index) => (
              <Text key={frame.id} size="small" tone="tertiary">
                <FormattedMessage
                  defaultMessage="Frame {frameNum} → Photo {photoNum}"
                  description="Frame to photo mapping"
                  values={{
                    frameNum: frame.order,
                    photoNum: index < photos.length ? index + 1 : "—",
                  }}
                />
              </Text>
            ))}
          </Rows>
        </Box>

        {/* Action buttons */}
        <Rows spacing="2u">
          <Button
            variant="primary"
            onClick={handleGenerateOutput}
            stretch
            disabled={photos.length === 0}
          >
            {intl.formatMessage({
              defaultMessage: "Generate Output Page",
              description: "Generate button",
            })}
          </Button>

          <Button variant="secondary" onClick={handleRetake} stretch>
            {intl.formatMessage({
              defaultMessage: "Retake All Photos",
              description: "Retake button",
            })}
          </Button>

          <Button variant="tertiary" onClick={handleCancel}>
            {intl.formatMessage({
              defaultMessage: "Cancel",
              description: "Cancel button",
            })}
          </Button>
        </Rows>
      </Rows>
    </div>
  );
};

export default ReviewScreen;
