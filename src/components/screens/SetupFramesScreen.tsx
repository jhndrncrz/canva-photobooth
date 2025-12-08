/**
 * SetupFramesScreen Component
 *
 * Screen for selecting image elements as frame placeholders.
 * Users select image elements in Canva, then click "Add Selected as Frame"
 * to add them. Supports drag-and-drop reordering.
 * 
 * Uses Selection API to get selected image refs, then openDesign API
 * to find matching elements and get their positions.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  LoadingIndicator,
  Badge,
  Columns,
  Column,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import { openDesign, type DesignEditing } from "@canva/design";
import type { ScreenProps, FrameConfig } from "../../types";
import { useSelection } from "utils/use_selection_hook";
import * as styles from "styles/components.css";

/** Element position data extracted from openDesign */
interface ElementPositionData {
  imageRef: string;
  top: number;
  left: number;
  width: number;
  height: number;
  rotation: number;
  transparency: number;
}

// Frame info extends FrameConfig
interface FrameInfo extends FrameConfig {
  /** Preview URL for the image */
  previewUrl?: string;
}

export const SetupFramesScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  setConfig,
}) => {
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFrames, setSelectedFrames] = useState<FrameInfo[]>(
    config?.frames || []
  );
  const cleanupRef = useRef<(() => void) | null>(null);

  // Use the selection hook to track selected images
  const imageSelection = useSelection("image");

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleBack = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    navigateTo("setup-template");
  };

  /**
   * Add currently selected images as frames
   * Uses the Selection API to get selected image refs, then openDesign
   * to find matching elements and get their positions.
   */
  const handleAddSelectedAsFrame = useCallback(async () => {
    if (imageSelection.count === 0) {
      setError("Please select one or more images on the canvas first.");
      return;
    }

    setIsAddingFrame(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Read the current selection to get image refs
      const selectionResult = await imageSelection.read();
      const selectedImages = selectionResult.contents;

      if (selectedImages.length === 0) {
        setError("No images found in selection. Please select image elements.");
        setIsAddingFrame(false);
        return;
      }

      // Collect selected image refs (convert ImageRef to string for comparison)
      const selectedRefs = new Set<string>();
      for (const img of selectedImages) {
        if (img?.ref) {
          // Cast ImageRef to string for consistent comparison
          selectedRefs.add(img.ref as unknown as string);
        }
      }

      // Step 2: Use openDesign to find matching elements and get their positions
      const elementPositions: ElementPositionData[] = [];
      
      await openDesign({ type: "current_page" }, async (session) => {
        if (session.page.type !== "absolute") {
          return;
        }

        // Iterate through all elements on the page
        session.page.elements.forEach((element) => {
          // Check rect elements with image fills
          if (element.type === "rect") {
            const mediaRef = element.fill.mediaContainer?.ref;
            // Cast ImageRef to string for comparison with our Set
            const imageRefStr = mediaRef?.type === "image" ? (mediaRef.imageRef as unknown as string) : null;
            if (imageRefStr && selectedRefs.has(imageRefStr)) {
              elementPositions.push({
                imageRef: imageRefStr,
                top: element.top,
                left: element.left,
                width: element.width,
                height: element.height,
                rotation: element.rotation ?? 0,
                transparency: element.transparency ?? 0,
              });
            }
          }
          // Note: In Canva, images are typically rect elements with image fills
          // but we can also check for other element types if needed
        });
      });

      // Step 3: Create frame configs from the matched elements
      const newFrames: FrameInfo[] = [];
      let addedCount = 0;

      for (let i = 0; i < elementPositions.length; i++) {
        const posData = elementPositions[i];
        if (!posData) continue;

        // Skip if already added (by imageRef)
        const alreadyAdded = selectedFrames.some(
          (f) => f.imageRef === posData.imageRef
        );
        if (alreadyAdded) continue;

        newFrames.push({
          id: `frame-${Date.now()}-${i}`,
          elementType: "image",
          imageRef: posData.imageRef,
          order: selectedFrames.length + newFrames.length + 1,
          width: posData.width,
          height: posData.height,
          top: posData.top,
          left: posData.left,
          rotation: posData.rotation,
          transparency: posData.transparency,
          elementIndex: i,
        });
        addedCount++;
      }

      // If we didn't find positions via openDesign, fall back to selection data only
      // (with default positions - less ideal but allows the flow to continue)
      if (elementPositions.length === 0 && selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const selectedImage = selectedImages[i];
          if (!selectedImage?.ref) continue;

          const alreadyAdded = selectedFrames.some(
            (f) => f.imageRef === selectedImage.ref
          );
          if (alreadyAdded) continue;

          newFrames.push({
            id: `frame-${Date.now()}-${i}`,
            elementType: "image",
            imageRef: selectedImage.ref,
            order: selectedFrames.length + newFrames.length + 1,
            // Fallback: use dimensions from selection if available
            width: 200,
            height: 200,
            top: 0,
            left: 0,
            rotation: 0,
            transparency: 0,
            elementIndex: i,
          });
          addedCount++;
        }
        console.warn("Could not get position data from openDesign, using defaults");
      }

      if (newFrames.length === 0) {
        setError("All selected images are already added as frames.");
        setIsAddingFrame(false);
        return;
      }

      setSelectedFrames((prev) => [...prev, ...newFrames]);
      setSuccessMessage(`Added ${addedCount} frame${addedCount !== 1 ? "s" : ""}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add frames";
      setError(message);
    } finally {
      setIsAddingFrame(false);
    }
  }, [imageSelection, selectedFrames]);

  /**
   * Remove a frame from the list
   */
  const handleRemoveFrame = useCallback((frameId: string) => {
    setSelectedFrames((prev) => {
      const filtered = prev.filter((f) => f.id !== frameId);
      return filtered.map((f, index) => ({
        ...f,
        order: index + 1,
      }));
    });
  }, []);

  /**
   * Clear all frames
   */
  const handleClearFrames = useCallback(() => {
    setSelectedFrames([]);
    setError(null);
    setSuccessMessage(null);
  }, []);

  /**
   * Drag and drop handlers
   */
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSelectedFrames((prev) => {
      const newFrames = [...prev];
      const draggedFrame = newFrames[draggedIndex];
      if (!draggedFrame) return prev;

      // Remove from old position
      newFrames.splice(draggedIndex, 1);
      // Insert at new position
      newFrames.splice(targetIndex, 0, draggedFrame);

      // Reorder
      return newFrames.map((f, i) => ({ ...f, order: i + 1 }));
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  /**
   * Save frames and continue
   */
  const handleSave = useCallback(async () => {
    if (selectedFrames.length === 0) {
      setError("Please add at least one frame placeholder");
      return;
    }

    if (!config) {
      setError("Configuration not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    try {
      const framesForConfig: FrameConfig[] = selectedFrames.map((f) => ({
        id: f.id,
        elementType: f.elementType,
        imageRef: f.imageRef,  // Include imageRef for matching during output generation
        order: f.order,
        width: f.width,
        height: f.height,
        top: f.top,
        left: f.left,
        rotation: f.rotation,
        transparency: f.transparency,
        elementIndex: f.elementIndex,
      }));

      const updatedConfig = {
        ...config,
        frames: framesForConfig,
        captureSettings: {
          ...config.captureSettings,
          captureCount: framesForConfig.length,
        },
        updatedAt: new Date().toISOString(),
      };

      setConfig(updatedConfig);
      navigateTo("home");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save frames";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFrames, config, setConfig, navigateTo]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Box padding="4u">
            <Rows spacing="2u" align="center">
              <LoadingIndicator size="medium" />
              <Text alignment="center">
                <FormattedMessage
                  defaultMessage="Saving..."
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
                defaultMessage="Step 2: Define Frame Placeholders"
                description="Setup step title"
              />
            </Title>
            <Text tone="tertiary">
              <FormattedMessage
                defaultMessage="Select image placeholders for captured photos"
                description="Setup step description"
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

        {/* Success message */}
        {successMessage && (
          <Alert tone="positive">
            <Text>{successMessage}</Text>
          </Alert>
        )}

        {/* Instructions */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Instructions"
                description="Template tips"
              />
            </Title>
            
            <Text size="small">
              <FormattedMessage
                defaultMessage="1. Add placeholder images to your design where photos should appear"
                description="Instruction 1"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="2. Select one or more images on the canvas, then click the button below"
                description="Instruction 2"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="3. Drag and drop to reorder the capture sequence"
                description="Instruction 3"
              />
            </Text>
          </Rows>
        </Box>

        {/* Current selection indicator */}
        <Box padding="2u" background={imageSelection.count > 0 ? "neutralLow" : "neutralLow"} borderRadius="large">
          <Columns spacing="1u" alignY="center">
            <Column width="content">
              <Badge
                text={`${imageSelection.count} image${imageSelection.count !== 1 ? "s" : ""} selected`}
                tone={imageSelection.count > 0 ? "positive" : "info"}
              />
            </Column>
            <Column>
              <Text size="small" tone="tertiary">
                {imageSelection.count > 0 ? (
                  <FormattedMessage
                    defaultMessage="Click the button below to add them as frames"
                    description="Selection hint with images selected"
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Select images on the canvas to add them"
                    description="Selection hint no images"
                  />
                )}
              </Text>
            </Column>
          </Columns>
        </Box>

        {/* Add frames button */}
        <Button 
          variant="primary" 
          onClick={handleAddSelectedAsFrame} 
          stretch
          disabled={isAddingFrame || imageSelection.count === 0}
        >
          {isAddingFrame
            ? intl.formatMessage({
                defaultMessage: "Adding...",
                description: "Adding button text",
              })
            : imageSelection.count > 0
            ? intl.formatMessage(
                {
                  defaultMessage: "Add {count} Selected Image{plural} as Frame{plural}",
                  description: "Add frames button with count",
                },
                { count: imageSelection.count, plural: imageSelection.count !== 1 ? "s" : "" }
              )
            : intl.formatMessage({
                defaultMessage: "Select Images to Add as Frames",
                description: "Add frames button",
              })}
        </Button>

        {/* Frames list */}
        <Box>
          <Rows spacing="2u">
            <Rows spacing="0.5u">
              <Title size="xsmall">
                <FormattedMessage
                  defaultMessage="Frame Placeholders"
                  description="Frames section header"
                />
              </Title>
              <Badge
                text={`${selectedFrames.length} frame${selectedFrames.length !== 1 ? "s" : ""}`}
                tone={selectedFrames.length > 0 ? "positive" : "info"}
              />
            </Rows>

            {selectedFrames.length === 0 ? (
              <Box padding="3u" background="neutralLow" borderRadius="large">
                <Text tone="tertiary" size="small" alignment="center">
                  <FormattedMessage
                    defaultMessage="No frames added yet. Select images on your template, then click the button above."
                    description="Empty frames message"
                  />
                </Text>
              </Box>
            ) : (
              <Rows spacing="1u">
                {selectedFrames.map((frame, index) => (
                  <div
                    key={frame.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      cursor: "grab",
                      opacity: draggedIndex === index ? 0.5 : 1,
                      borderTop: dragOverIndex === index && draggedIndex !== null && draggedIndex > index
                        ? "2px solid #0090ff"
                        : "2px solid transparent",
                      borderBottom: dragOverIndex === index && draggedIndex !== null && draggedIndex < index
                        ? "2px solid #0090ff"
                        : "2px solid transparent",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <Box
                      padding="2u"
                      background="neutralLow"
                      borderRadius="standard"
                    >
                      <Columns spacing="2u" alignY="center">
                        {/* Drag handle and order number */}
                        <Column width="content">
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "#4a5568",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {frame.order}
                          </div>
                        </Column>

                        {/* Location and size info */}
                        <Column>
                          <Rows spacing="0.5u">
                            <Text size="small" variant="bold">
                              <FormattedMessage
                                defaultMessage="Frame {order}"
                                description="Frame label"
                                values={{ order: frame.order }}
                              />
                            </Text>
                            <Text size="xsmall" tone="tertiary">
                              <FormattedMessage
                                defaultMessage="Position: ({left}, {top}) • Size: {width} × {height}"
                                description="Frame position and size"
                                values={{
                                  left: Math.round(frame.left),
                                  top: Math.round(frame.top),
                                  width: Math.round(frame.width),
                                  height: Math.round(frame.height),
                                }}
                              />
                            </Text>
                          </Rows>
                        </Column>

                        {/* Remove button */}
                        <Column width="content">
                          <Button
                            variant="tertiary"
                            onClick={() => handleRemoveFrame(frame.id)}
                          >
                            ✕
                          </Button>
                        </Column>
                      </Columns>
                    </Box>
                  </div>
                ))}
                <Text size="xsmall" tone="tertiary" alignment="center">
                  <FormattedMessage
                    defaultMessage="Drag frames to reorder the capture sequence"
                    description="Drag hint"
                  />
                </Text>
              </Rows>
            )}
          </Rows>
        </Box>

        {/* Clear all button */}
        {selectedFrames.length > 0 && (
          <Button variant="secondary" onClick={handleClearFrames} stretch>
            {intl.formatMessage({
              defaultMessage: "Clear All Frames",
              description: "Button to clear all frames",
            })}
          </Button>
        )}

        {/* Save button */}
        <Button
          variant="primary"
          onClick={handleSave}
          stretch
          disabled={selectedFrames.length === 0}
        >
          {intl.formatMessage({
            defaultMessage: "Save & Continue",
            description: "Button to save frames and continue",
          })}
        </Button>

        {/* Back button */}
        <Button variant="tertiary" onClick={handleBack}>
          {intl.formatMessage({
            defaultMessage: "← Back to Template Selection",
            description: "Back button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

export default SetupFramesScreen;
