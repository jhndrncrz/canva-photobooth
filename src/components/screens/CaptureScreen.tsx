/**
 * CaptureScreen Component
 *
 * Manages photo capture session with external camera page.
 * Auto-copies the camera URL and displays QR code.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  LoadingIndicator,
  ProgressBar,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import type { ScreenProps, CapturedPhoto, CaptureSession } from "../../types";
import { BACKEND_URL } from "../../constants";
import * as styles from "styles/components.css";

interface SessionResponse {
  sessionId: string;
  cameraUrl: string;
}

interface SessionStatusResponse {
  sessionId: string;
  status: "waiting" | "capturing" | "complete";
  frameCount: number;
  capturedCount: number;
  photos: Array<{
    id: string;
    dataUrl: string;
    capturedAt: string;
    frameIndex: number;
  }>;
}

export const CaptureScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  setSession,
}) => {
  const intl = useIntl();
  const pollIntervalRef = useRef<number | null>(null);

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [isWaitingForPhotos, setIsWaitingForPhotos] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<SessionStatusResponse["photos"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const frameCount = config?.frames.length || 0;

  /**
   * Copy URL to clipboard
   */
  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setCopyError(false);
      // Reset after 3 seconds
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (e) {
      console.error("Failed to copy:", e);
      setCopyError(true);
      setLinkCopied(false);
    }
  }, []);

  /**
   * Create a new capture session on the backend
   */
  const createSession = useCallback(async () => {
    if (!config) {
      setError("Configuration not found");
      return;
    }

    setIsCreatingSession(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/photobooth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameCount: config.frames.length,
          countdownSeconds: config.captureSettings.countdownSeconds,
          playShutterSound: config.captureSettings.playShutterSound,
          playCountdownSound: config.captureSettings.playCountdownSound,
          showFlashEffect: config.captureSettings.showFlashEffect,
          captureMode: config.captureSettings.captureMode || "manual",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create capture session");
      }

      const data: SessionResponse = await response.json();
      const fullCameraUrl = `${BACKEND_URL}${data.cameraUrl}`;
      
      setSessionId(data.sessionId);
      setCameraUrl(fullCameraUrl);

      // Auto-copy the URL to clipboard
      await copyToClipboard(fullCameraUrl);

      // Immediately start polling for photos
      setIsWaitingForPhotos(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to create capture session"
      );
    } finally {
      setIsCreatingSession(false);
    }
  }, [config, copyToClipboard]);

  /**
   * Poll the backend for session status
   */
  const pollSessionStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/photobooth/session/${sessionId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Session expired. Please start again.");
          setIsWaitingForPhotos(false);
          return;
        }
        throw new Error("Failed to fetch session status");
      }

      const data: SessionStatusResponse = await response.json();
      setCapturedCount(data.capturedCount);
      setCapturedPhotos(data.photos);

      // Check if all photos are captured
      if (data.status === "complete" || data.capturedCount >= frameCount) {
        setIsWaitingForPhotos(false);

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        const photos: CapturedPhoto[] = data.photos.map((photo, index) => ({
          id: photo.id,
          dataUrl: photo.dataUrl,
          capturedAt: photo.capturedAt,
          frameId: config?.frames[index]?.id || `frame-${index}`,
        }));

        // Use backend session ID so ReviewScreen can construct photo URLs
        const newSession: CaptureSession = {
          sessionId: sessionId,
          photos,
          status: "reviewing",
          currentPhotoIndex: photos.length,
          startedAt: new Date().toISOString(),
        };

        setSession(newSession);
        navigateTo("review");
      }
    } catch (e) {
      console.error("Failed to poll session:", e);
    }
  }, [sessionId, frameCount, config, setSession, navigateTo]);

  /**
   * Start polling when waiting for photos
   */
  useEffect(() => {
    if (isWaitingForPhotos && sessionId) {
      pollIntervalRef.current = window.setInterval(pollSessionStatus, 2000);
      pollSessionStatus();

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
    return undefined;
  }, [isWaitingForPhotos, sessionId, pollSessionStatus]);

  /**
   * Create session on mount
   */
  useEffect(() => {
    createSession();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [createSession]);

  /**
   * Cancel and go back
   */
  const handleCancel = useCallback(async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (sessionId) {
      try {
        await fetch(`${BACKEND_URL}/api/photobooth/session/${sessionId}`, {
          method: "DELETE",
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    navigateTo("home");
  }, [sessionId, navigateTo]);

  /**
   * Retry creating session
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setSessionId(null);
    setCameraUrl(null);
    setIsWaitingForPhotos(false);
    setCapturedCount(0);
    setCapturedPhotos([]);
    setLinkCopied(false);
    setCopyError(false);
    createSession();
  }, [createSession]);

  /**
   * Handle manual copy button click
   */
  const handleCopyLink = useCallback(() => {
    if (cameraUrl) {
      copyToClipboard(cameraUrl);
    }
  }, [cameraUrl, copyToClipboard]);

  // Creating session state
  if (isCreatingSession) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Box padding="4u">
            <Rows spacing="2u" align="center">
              <LoadingIndicator size="medium" />
              <Text alignment="center">
                <FormattedMessage
                  defaultMessage="Setting up camera session..."
                  description="Loading message"
                />
              </Text>
            </Rows>
          </Box>
        </Rows>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Alert tone="critical">
            <Text>{error}</Text>
          </Alert>
          <Button variant="secondary" onClick={handleRetry} stretch>
            {intl.formatMessage({
              defaultMessage: "Try Again",
              description: "Retry button",
            })}
          </Button>
          <Button variant="tertiary" onClick={handleCancel}>
            {intl.formatMessage({
              defaultMessage: "Back to Menu",
              description: "Back button",
            })}
          </Button>
        </Rows>
      </div>
    );
  }

  // Waiting for photos (main capture state)
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        {/* Header */}
        <Box>
          <Rows spacing="1u">
            <Title size="medium">
              <FormattedMessage
                defaultMessage="Capture Session Active"
                description="Screen title"
              />
            </Title>
            <Text tone="tertiary">
              <FormattedMessage
                defaultMessage="Open the camera page in a new browser tab to take photos"
                description="Instructions"
              />
            </Text>
          </Rows>
        </Box>

        {/* Link copied notification */}
        {linkCopied && (
          <Alert tone="positive">
            <Text>
              <FormattedMessage
                defaultMessage="Camera link copied to clipboard! Paste it in a new browser tab."
                description="Link copied message"
              />
            </Text>
          </Alert>
        )}

        {copyError && (
          <Alert tone="warn">
            <Text>
              <FormattedMessage
                defaultMessage="Could not auto-copy. Please use the button below to copy the link."
                description="Copy error message"
              />
            </Text>
          </Alert>
        )}

        {/* Copy link button */}
        <Button variant="primary" onClick={handleCopyLink} stretch>
          {linkCopied
            ? intl.formatMessage({
                defaultMessage: "Link Copied!",
                description: "Copied button text",
              })
            : intl.formatMessage({
                defaultMessage: "Copy Camera Link",
                description: "Copy link button",
              })}
        </Button>

        {/* QR Code */}
        {cameraUrl && (
          <Box padding="3u" background="neutralLow" borderRadius="large">
            <Rows spacing="2u" align="center">
              <Text size="small" variant="bold" alignment="center">
                <FormattedMessage
                  defaultMessage="Or scan this QR code with your phone:"
                  description="QR code instruction"
                />
              </Text>
              <Box
                padding="2u"
                background="surface"
                borderRadius="standard"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(cameraUrl)}`}
                  alt="QR Code for camera page"
                  style={{
                    width: "150px",
                    height: "150px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </Box>
            </Rows>
          </Box>
        )}

        {/* Progress */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1.5u">
            <Text size="small" variant="bold">
              <FormattedMessage
                defaultMessage="Capture Progress"
                description="Progress header"
              />
            </Text>
            <ProgressBar
              value={frameCount > 0 ? (capturedCount / frameCount) * 100 : 0}
              ariaLabel="Capture progress"
            />
            <Text size="small" alignment="center">
              <FormattedMessage
                defaultMessage="{captured} of {total} photos captured"
                description="Progress text"
                values={{ captured: capturedCount, total: frameCount }}
              />
            </Text>
          </Rows>
        </Box>

        {/* Thumbnails of captured photos */}
        {capturedPhotos.length > 0 && (
          <Box>
            <Rows spacing="1.5u">
              <Title size="xsmall">
                <FormattedMessage
                  defaultMessage="Captured Photos"
                  description="Thumbnails header"
                />
              </Title>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: "8px",
                }}
              >
                {capturedPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "60px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "4px",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </Rows>
          </Box>
        )}

        {/* Waiting indicator */}
        {capturedCount < frameCount && (
          <Box padding="2u" background="neutralLow" borderRadius="large">
            <Rows spacing="1u" align="center">
              <LoadingIndicator size="small" />
              <Text size="small" tone="tertiary" alignment="center">
                <FormattedMessage
                  defaultMessage="Waiting for photos..."
                  description="Waiting message"
                />
              </Text>
            </Rows>
          </Box>
        )}

        {/* Instructions */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Text size="xsmall">
              <FormattedMessage
                defaultMessage="Instructions:"
                description="Instructions header"
              />
            </Text>
            <Text size="xsmall" tone="tertiary">
              <FormattedMessage
                defaultMessage="1. Paste the copied link in a new browser tab"
                description="Instruction 1"
              />
            </Text>
            <Text size="xsmall" tone="tertiary">
              <FormattedMessage
                defaultMessage="2. Allow camera access when prompted"
                description="Instruction 2"
              />
            </Text>
            <Text size="xsmall" tone="tertiary">
              <FormattedMessage
                defaultMessage="3. Click 'Start Capture' to begin taking photos"
                description="Instruction 3"
              />
            </Text>
            <Text size="xsmall" tone="tertiary">
              <FormattedMessage
                defaultMessage="4. Photos will automatically appear here as they're captured"
                description="Instruction 4"
              />
            </Text>
          </Rows>
        </Box>

        {/* Cancel button */}
        <Button variant="tertiary" onClick={handleCancel}>
          {intl.formatMessage({
            defaultMessage: "Cancel Session",
            description: "Cancel button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

export default CaptureScreen;
