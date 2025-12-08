/**
 * Photo Booth App
 *
 * Main application component with screen navigation.
 */

import React, { useState, useCallback, useEffect } from "react";
import { LoadingIndicator, Rows, Text, Box } from "@canva/app-ui-kit";
import type {
  AppScreen,
  PhotoBoothConfig,
  CaptureSession,
  ScreenProps,
} from "./types";
import {
  HomeScreen,
  SetupTemplateScreen,
  SetupFramesScreen,
  SettingsScreen,
  CaptureScreen,
  ReviewScreen,
  CompleteScreen,
} from "./components/screens";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  loadConfigFromStorage,
  saveConfigToStorage,
} from "./services/storageService";
import * as styles from "styles/components.css";

export const App = () => {
  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");

  // Config state (persisted via localStorage)
  const [config, setConfigState] = useState<PhotoBoothConfig | null>(null);

  // Session state (current capture session)
  const [session, setSession] = useState<CaptureSession | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load config from storage on mount
  useEffect(() => {
    const storedConfig = loadConfigFromStorage();
    if (storedConfig) {
      setConfigState(storedConfig);
    }
    setIsLoading(false);
  }, []);

  // Wrapper to persist config changes
  const setConfig = useCallback((newConfig: PhotoBoothConfig | null) => {
    setConfigState(newConfig);
    if (newConfig) {
      saveConfigToStorage(newConfig);
    }
  }, []);

  /**
   * Navigate to a different screen
   */
  const navigateTo = useCallback((screen: AppScreen) => {
    setCurrentScreen(screen);
  }, []);

  /**
   * Handle error boundary reset
   */
  const handleErrorReset = useCallback(() => {
    setCurrentScreen("home");
    setSession(null);
  }, []);

  /**
   * Common props for all screens
   */
  const screenProps: ScreenProps = {
    navigateTo,
    config,
    setConfig,
    session,
    setSession,
  };

  // Loading overlay
  if (isLoading) {
    return (
      <div className={styles.scrollContainer}>
        <Box padding="4u">
          <Rows spacing="2u" align="center">
            <LoadingIndicator size="medium" />
            <Text alignment="center">Loading...</Text>
          </Rows>
        </Box>
      </div>
    );
  }

  /**
   * Render the appropriate screen based on current navigation state
   */
  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen {...screenProps} />;

      case "setup-template":
        return <SetupTemplateScreen {...screenProps} />;

      case "setup-frames":
        return <SetupFramesScreen {...screenProps} />;

      case "capture":
        return <CaptureScreen {...screenProps} />;

      case "review":
        return <ReviewScreen {...screenProps} />;

      case "complete":
        return <CompleteScreen {...screenProps} />;

      case "settings":
        return <SettingsScreen {...screenProps} />;

      case "processing":
        return (
          <div className={styles.scrollContainer}>
            <Box padding="4u">
              <Rows spacing="2u" align="center">
                <LoadingIndicator size="medium" />
                <Text alignment="center">Processing...</Text>
              </Rows>
            </Box>
          </div>
        );

      case "error":
        return (
          <div className={styles.scrollContainer}>
            <Box padding="4u">
              <Rows spacing="2u">
                <Text alignment="center">An error occurred.</Text>
              </Rows>
            </Box>
          </div>
        );

      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      {renderScreen()}
    </ErrorBoundary>
  );
};
