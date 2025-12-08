/**
 * ReviewScreen Component
 *
 * Shows captured photos for review before placing them on the current page.
 * Uses addElementAtPoint to add photos at frame positions on the user's
 * manually duplicated template page.
 *
 * Important: The user must manually duplicate their template page in Canva
 * and navigate to that duplicated page before generating output. This is
 * because Canva's API does not support automatic page duplication with
 * full element fidelity.
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
import { addElementAtPoint } from "@canva/design";
import { upload, type ImageRef } from "@canva/asset";
import type { ScreenProps } from "../../types";
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
   * Place photos on the current page at frame positions.
   * Uses addElementAtPoint to add each photo to the user's manually duplicated page.
   *
   * Important: User must be on their duplicated template page when this runs.
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
          console.log(
            `Uploading photo ${i + 1}, dataUrl length: ${photo.dataUrl.length}`
          );

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

      setProgressMessage("Placing photos on current page...");
      setProgress(80);

      // Step 2: Add each photo to the current page at frame positions
      // Photos are added to whatever page the user currently has selected
      let photosPlaced = 0;

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

          console.log(`Adding photo ${i + 1} at position:`, {
            top: element.top,
            left: element.left,
            width: element.width,
            height: element.height,
            rotation: element.rotation,
          });

          try {
            // Add photo to current page at specified position
            await addElementAtPoint(element);
            photosPlaced++;
            console.log(`Photo ${i + 1} placed successfully`);
          } catch (placeError) {
            console.error(`Failed to place photo ${i + 1}:`, placeError);
            throw new Error(
              `Failed to place photo ${i + 1}. Please try again.`
            );
          }
        }
      }

      setProgress(100);
      setProgressMessage(
        `Placed ${photosPlaced} photo${photosPlaced !== 1 ? "s" : ""} on the current page!`
      );

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

        {/* Important instruction about page selection */}
        <Alert tone="info">
          <Rows spacing="1u">
            <Text size="small" variant="bold">
              <FormattedMessage
                defaultMessage="Before placing photos:"
                description="Pre-action instruction heading"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="Navigate to the page where you want to place the photos. If using a template, first duplicate the template page in Canva (right-click → Duplicate page), then select that duplicated page."
                description="Page selection instruction"
              />
            </Text>
          </Rows>
        </Alert>

        {/* Action buttons */}
        <Rows spacing="2u">
          <Button
            variant="primary"
            onClick={handleGenerateOutput}
            stretch
            disabled={photos.length === 0}
          >
            {intl.formatMessage({
              defaultMessage: "Place Photos on Current Page",
              description: "Place photos button",
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
