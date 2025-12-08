/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Rows, Text, Title, Alert } from "@canva/app-ui-kit";
import * as styles from "styles/components.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.scrollContainer}>
          <Box padding="3u">
            <Rows spacing="2u">
              <Title size="medium" alignment="center">
                Something went wrong
              </Title>

              <Alert tone="critical">
                <Text>
                  {this.state.error?.message || "An unexpected error occurred."}
                </Text>
              </Alert>

              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <Box
                  padding="2u"
                  background="neutralLow"
                  borderRadius="standard"
                >
                  <Text size="small" tone="tertiary">
                    {this.state.error?.stack?.split("\n").slice(0, 5).join("\n")}
                  </Text>
                </Box>
              )}

              <Button variant="primary" onClick={this.handleReset} stretch>
                Try Again
              </Button>
            </Rows>
          </Box>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
