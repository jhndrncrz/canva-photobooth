/**
 * SettingsScreen Component
 *
 * Allows users to configure capture session settings:
 * - Countdown duration
 * - Sound effects
 * - Flash effect
 * - Camera selection
 */

import React, { useState, useCallback } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Alert,
  Select,
  Switch,
  Columns,
  Column,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import type { ScreenProps, CaptureSettings } from "../../types";
import * as styles from "styles/components.css";

export const SettingsScreen: React.FC<ScreenProps> = ({
  navigateTo,
  config,
  setConfig,
}) => {
  const intl = useIntl();

  // Local state for settings (initialized from config)
  const [settings, setSettings] = useState<CaptureSettings>(
    config?.captureSettings || {
      countdownSeconds: 3,
      captureCount: config?.frames.length || 1,
      playShutterSound: true,
      playCountdownSound: true,
      showFlashEffect: true,
      facingMode: "user",
      captureMode: "manual",
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Update a single setting
   */
  const updateSetting = useCallback(
    <K extends keyof CaptureSettings>(key: K, value: CaptureSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  /**
   * Save settings to config
   */
  const handleSave = useCallback(async () => {
    if (!config) {
      setError("Configuration not found. Please set up photo booth first.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedConfig = {
        ...config,
        captureSettings: {
          ...settings,
          captureCount: config.frames.length, // Always sync with frame count
        },
        updatedAt: new Date().toISOString(),
      };

      setConfig(updatedConfig);
      setSuccessMessage("Settings saved successfully!");
      
      // Clear success after 2 seconds
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save settings";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [config, settings, setConfig]);

  /**
   * Go back to home
   */
  const handleBack = useCallback(() => {
    navigateTo("home");
  }, [navigateTo]);

  /**
   * Reset to defaults
   */
  const handleResetDefaults = useCallback(() => {
    setSettings({
      countdownSeconds: 3,
      captureCount: config?.frames.length || 1,
      playShutterSound: true,
      playCountdownSound: true,
      showFlashEffect: true,
      facingMode: "user",
      captureMode: "manual",
    });
  }, [config]);

  if (!config) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="3u">
          <Alert tone="critical">
            <FormattedMessage
              defaultMessage="No configuration found. Please set up photo booth first."
              description="Error when no config exists"
            />
          </Alert>
          <Button variant="secondary" onClick={handleBack} stretch>
            {intl.formatMessage({
              defaultMessage: "Back to Home",
              description: "Back button",
            })}
          </Button>
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
                defaultMessage="Capture Settings"
                description="Screen title"
              />
            </Title>
            <Text tone="tertiary">
              <FormattedMessage
                defaultMessage="Configure how photos are captured"
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

        {/* Success message */}
        {successMessage && (
          <Alert tone="positive">
            <Text>{successMessage}</Text>
          </Alert>
        )}

        {/* Countdown Setting */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Title size="small">
                    <FormattedMessage
                      defaultMessage="Countdown Duration"
                      description="Countdown setting label"
                    />
                  </Title>
                  <Text size="small" tone="tertiary">
                    <FormattedMessage
                      defaultMessage="Seconds before each photo is taken"
                      description="Countdown setting description"
                    />
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Select
                  value={String(settings.countdownSeconds)}
                  onChange={(value) =>
                    updateSetting("countdownSeconds", parseInt(value, 10))
                  }
                  options={[
                    { value: "1", label: "1 second" },
                    { value: "2", label: "2 seconds" },
                    { value: "3", label: "3 seconds" },
                    { value: "5", label: "5 seconds" },
                    { value: "10", label: "10 seconds" },
                  ]}
                />
              </Column>
            </Columns>
          </Rows>
        </Box>

        {/* Capture Mode Setting */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Title size="small">
                    <FormattedMessage
                      defaultMessage="Capture Mode"
                      description="Capture mode setting label"
                    />
                  </Title>
                  <Text size="small" tone="tertiary">
                    {settings.captureMode === "auto" ? (
                      <FormattedMessage
                        defaultMessage="Auto: Takes all photos automatically with countdown between each"
                        description="Auto mode description"
                      />
                    ) : (
                      <FormattedMessage
                        defaultMessage="Manual: Click to take each photo individually"
                        description="Manual mode description"
                      />
                    )}
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Select
                  value={settings.captureMode}
                  onChange={(value) =>
                    updateSetting("captureMode", value as "auto" | "manual")
                  }
                  options={[
                    { value: "manual", label: "Manual" },
                    { value: "auto", label: "Auto" },
                  ]}
                />
              </Column>
            </Columns>
          </Rows>
        </Box>

        {/* Camera Selection */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Title size="small">
                    <FormattedMessage
                      defaultMessage="Camera"
                      description="Camera setting label"
                    />
                  </Title>
                  <Text size="small" tone="tertiary">
                    <FormattedMessage
                      defaultMessage="Which camera to use for capture"
                      description="Camera setting description"
                    />
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Select
                  value={settings.facingMode}
                  onChange={(value) =>
                    updateSetting("facingMode", value as "user" | "environment")
                  }
                  options={[
                    { value: "user", label: "Front camera" },
                    { value: "environment", label: "Back camera" },
                  ]}
                />
              </Column>
            </Columns>
          </Rows>
        </Box>

        {/* Sound Settings */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Sound Effects"
                description="Sound settings header"
              />
            </Title>

            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Text>
                    <FormattedMessage
                      defaultMessage="Shutter Sound"
                      description="Shutter sound label"
                    />
                  </Text>
                  <Text size="small" tone="tertiary">
                    <FormattedMessage
                      defaultMessage="Play sound when photo is taken"
                      description="Shutter sound description"
                    />
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Switch
                  value={settings.playShutterSound}
                  onChange={(value) => updateSetting("playShutterSound", value)}
                />
              </Column>
            </Columns>

            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Text>
                    <FormattedMessage
                      defaultMessage="Countdown Sound"
                      description="Countdown sound label"
                    />
                  </Text>
                  <Text size="small" tone="tertiary">
                    <FormattedMessage
                      defaultMessage="Play beeps during countdown"
                      description="Countdown sound description"
                    />
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Switch
                  value={settings.playCountdownSound}
                  onChange={(value) => updateSetting("playCountdownSound", value)}
                />
              </Column>
            </Columns>
          </Rows>
        </Box>

        {/* Visual Effects */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="2u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Visual Effects"
                description="Visual settings header"
              />
            </Title>

            <Columns spacing="1u" alignY="center">
              <Column width="fluid">
                <Rows spacing="0.5u">
                  <Text>
                    <FormattedMessage
                      defaultMessage="Flash Effect"
                      description="Flash effect label"
                    />
                  </Text>
                  <Text size="small" tone="tertiary">
                    <FormattedMessage
                      defaultMessage="Show flash animation when capturing"
                      description="Flash effect description"
                    />
                  </Text>
                </Rows>
              </Column>
              <Column width="content">
                <Switch
                  value={settings.showFlashEffect}
                  onChange={(value) => updateSetting("showFlashEffect", value)}
                />
              </Column>
            </Columns>
          </Rows>
        </Box>

        {/* Info */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1u">
            <Text size="small" tone="tertiary">
              <FormattedMessage
                defaultMessage="Photos to capture: {count} (based on frame count)"
                description="Photo count info"
                values={{ count: config.frames.length }}
              />
            </Text>
          </Rows>
        </Box>

        {/* Action Buttons */}
        <Rows spacing="1u">
          <Button
            variant="primary"
            onClick={handleSave}
            stretch
            loading={isSaving}
          >
            {intl.formatMessage({
              defaultMessage: "Save Settings",
              description: "Save button",
            })}
          </Button>

          <Columns spacing="1u">
            <Column>
              <Button variant="secondary" onClick={handleResetDefaults} stretch>
                {intl.formatMessage({
                  defaultMessage: "Reset Defaults",
                  description: "Reset button",
                })}
              </Button>
            </Column>
            <Column>
              <Button variant="tertiary" onClick={handleBack} stretch>
                {intl.formatMessage({
                  defaultMessage: "Back",
                  description: "Back button",
                })}
              </Button>
            </Column>
          </Columns>
        </Rows>
      </Rows>
    </div>
  );
};
