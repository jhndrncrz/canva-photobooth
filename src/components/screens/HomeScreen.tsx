/**
 * HomeScreen Component
 *
 * The main entry point of the Photo Booth app.
 * Shows clear status and appropriate actions based on configuration state.
 */

import React, { useState, useCallback } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  Columns,
  Column,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import type { ScreenProps } from "../../types";
import * as styles from "styles/components.css";

export const HomeScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  setConfig,
}) => {
  const intl = useIntl();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const hasConfig = config !== null;
  const hasFrames = config && config.frames.length > 0;
  const isReady = hasConfig && hasFrames;

  const handleSetup = () => {
    navigateTo("setup-template");
  };

  const handleStartCapture = () => {
    navigateTo("capture");
  };

  const handleEditFrames = () => {
    navigateTo("setup-frames");
  };

  const handleEditTemplate = () => {
    navigateTo("setup-template");
  };

  const handleCaptureSettings = () => {
    navigateTo("settings");
  };

  const handleHelp = () => {
    navigateTo("help");
  };

  /**
   * Reset all configuration to start fresh
   */
  const handleResetConfig = useCallback(() => {
    setConfig(null);
    setShowResetConfirm(false);
  }, [setConfig]);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        {/* Header with logo placeholder */}
        <Box paddingBottom="1u">
          <Rows spacing="1u" align="center">
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #c41e3a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              PB
            </div>
            <Title size="large" alignment="center">
              <FormattedMessage
                defaultMessage="Photo Booth"
                description="App title"
              />
            </Title>
            <Text alignment="center" tone="tertiary" size="small">
              <FormattedMessage
                defaultMessage="Capture and place photos in your designs"
                description="App subtitle"
              />
            </Text>
          </Rows>
        </Box>

        {/* Status indicator */}
        <Box
          padding="2u"
          background={isReady ? "neutralLow" : "neutralLow"}
          borderRadius="large"
        >
          <Rows spacing="1u" align="center">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: isReady ? "#00c853" : hasConfig ? "#ff9800" : "#757575",
                }}
              />
              <Text>
                {isReady ? (
                  <FormattedMessage
                    defaultMessage="Ready to capture"
                    description="Ready status"
                  />
                ) : hasConfig ? (
                  <FormattedMessage
                    defaultMessage="Setup incomplete"
                    description="Incomplete status"
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Setup required"
                    description="Not configured status"
                  />
                )}
              </Text>
            </div>
            {hasConfig && (
              <Text size="small" tone="tertiary">
                <FormattedMessage
                  defaultMessage="{frameCount, plural, one {# frame} other {# frames}} • {seconds}s countdown"
                  description="Config summary"
                  values={{
                    frameCount: config.frames.length,
                    seconds: config.captureSettings.countdownSeconds,
                  }}
                />
              </Text>
            )}
          </Rows>
        </Box>

        {/* Main actions */}
        {!hasConfig ? (
          <Rows spacing="2u">
            <Alert tone="info">
              <FormattedMessage
                defaultMessage="Welcome! Set up your photo booth by selecting a template page and marking image placeholders."
                description="Welcome message"
              />
            </Alert>

            <Button variant="primary" onClick={handleSetup} stretch>
              {intl.formatMessage({
                defaultMessage: "Get Started",
                description: "Setup button",
              })}
            </Button>
          </Rows>
        ) : (
          <Rows spacing="2u">
            {!hasFrames && (
              <Alert tone="warn">
                <FormattedMessage
                  defaultMessage="Add at least one frame placeholder to start capturing photos."
                  description="No frames warning"
                />
              </Alert>
            )}

            <Button
              variant="primary"
              onClick={handleStartCapture}
              stretch
              disabled={!hasFrames}
            >
              {intl.formatMessage({
                defaultMessage: "Start Capture",
                description: "Start capture button",
              })}
            </Button>

            <Columns spacing="1u">
              <Column>
                <Button variant="secondary" onClick={handleEditFrames} stretch>
                  {intl.formatMessage({
                    defaultMessage: "Edit Frames",
                    description: "Edit frames button",
                  })}
                </Button>
              </Column>
              <Column>
                <Button variant="secondary" onClick={handleEditTemplate} stretch>
                  {intl.formatMessage({
                    defaultMessage: "Template",
                    description: "Edit template button",
                  })}
                </Button>
              </Column>
            </Columns>

            <Button variant="tertiary" onClick={handleCaptureSettings} stretch>
              {intl.formatMessage({
                defaultMessage: "Settings",
                description: "Settings button",
              })}
            </Button>

            {/* Reset configuration button */}
            {!showResetConfirm ? (
              <Button
                variant="tertiary"
                onClick={() => setShowResetConfirm(true)}
                stretch
              >
                {intl.formatMessage({
                  defaultMessage: "Reset Configuration",
                  description: "Reset config button",
                })}
              </Button>
            ) : (
              <Alert tone="warn">
                <Rows spacing="1u">
                  <Text size="small">
                    <FormattedMessage
                      defaultMessage="Are you sure? This will clear all frame settings."
                      description="Reset confirmation message"
                    />
                  </Text>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="primary"
                      onClick={handleResetConfig}
                    >
                      {intl.formatMessage({
                        defaultMessage: "Yes, Reset",
                        description: "Confirm reset button",
                      })}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      {intl.formatMessage({
                        defaultMessage: "Cancel",
                        description: "Cancel reset button",
                      })}
                    </Button>
                  </div>
                </Rows>
              </Alert>
            )}
          </Rows>
        )}

        {/* Help button and workflow summary */}
        <Box paddingTop="1u">
          <Rows spacing="1.5u">
            <Button variant="tertiary" onClick={handleHelp} stretch>
              {intl.formatMessage({
                defaultMessage: "How It Works",
                description: "Help button",
              })}
            </Button>
            <Text size="small" tone="tertiary" alignment="center">
              <FormattedMessage
                defaultMessage="Design template → Select frames → Capture → Place photos"
                description="Simple workflow"
              />
            </Text>
          </Rows>
        </Box>
      </Rows>
    </div>
  );
};

export default HomeScreen;
