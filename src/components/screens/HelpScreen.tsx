/**
 * HelpScreen Component
 *
 * Provides an overview of how the Photo Booth app works,
 * step-by-step instructions, and tips for best results.
 */

import React, { useState } from "react";
import {
  Button,
  Rows,
  Text,
  Title,
  Box,
  Columns,
  Column,
} from "@canva/app-ui-kit";
import { FormattedMessage, useIntl } from "react-intl";
import type { ScreenProps } from "../../types";
import * as styles from "styles/components.css";

/** Workflow step data */
interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

/** The main workflow steps */
const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: 1,
    title: "Design Your Template",
    description:
      "Create a page with placeholder images where you want photos to appear. Add text, decorations, and backgrounds around them.",
    icon: "",
  },
  {
    number: 2,
    title: "Select Frame Placeholders",
    description:
      "Use the app to mark which images should be replaced with captured photos. Set the capture order by dragging frames.",
    icon: "",
  },
  {
    number: 3,
    title: "Duplicate Your Template",
    description:
      "Before each photo session, right-click your template page and select 'Duplicate page'. Navigate to the new page.",
    icon: "",
  },
  {
    number: 4,
    title: "Capture Photos",
    description:
      "Use your webcam to capture photos. A countdown timer helps you prepare for each shot.",
    icon: "",
  },
  {
    number: 5,
    title: "Review & Place",
    description:
      "Review your photos, then place them on your duplicated template page. Delete the placeholder images underneath.",
    icon: "",
  },
];

/** Tips for best results */
const TIPS = [
  "Good lighting makes a big difference. Face a window or light source.",
  "Position yourself at arm's length from the camera for best framing.",
  "Use simple placeholder images so they're easy to identify and delete later.",
  "Use a longer countdown (5 seconds) if you need time to pose.",
  "Always duplicate your template page before each session to preserve the original.",
];

export const HelpScreen: React.FC<ScreenProps> = ({ navigateTo }) => {
  const intl = useIntl();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleBack = () => {
    navigateTo("home");
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        {/* Header */}
        <Box>
          <Rows spacing="1u" align="center">
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                color: "white",
                fontSize: "28px",
                fontWeight: "bold",
              }}
            >
              ?
            </div>
            <Title size="large" alignment="center">
              <FormattedMessage
                defaultMessage="How It Works"
                description="Help screen title"
              />
            </Title>
            <Text alignment="center" tone="tertiary">
              <FormattedMessage
                defaultMessage="Learn how to use Photo Booth in 5 easy steps"
                description="Help screen subtitle"
              />
            </Text>
          </Rows>
        </Box>

        {/* Workflow Steps */}
        <Box>
          <Rows spacing="2u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Workflow"
                description="Workflow section title"
              />
            </Title>

            {WORKFLOW_STEPS.map((step) => (
              <Box
                key={step.number}
                padding="2u"
                background="neutralLow"
                borderRadius="large"
              >
                <div
                  onClick={() => toggleStep(step.number)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleStep(step.number);
                    }
                  }}
                >
                  <Columns spacing="2u" alignY="center">
                    <Column width="content">
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#8b3dff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        {step.number}
                      </div>
                    </Column>
                    <Column>
                      <Rows spacing="0.5u">
                        <Text variant="bold">
                          {step.title}
                        </Text>
                        {expandedStep === step.number && (
                          <Text size="small" tone="tertiary">
                            {step.description}
                          </Text>
                        )}
                      </Rows>
                    </Column>
                    <Column width="content">
                      <Text tone="tertiary">
                        {expandedStep === step.number ? "-" : "+"}
                      </Text>
                    </Column>
                  </Columns>
                </div>
              </Box>
            ))}
          </Rows>
        </Box>

        {/* Quick Start Guide */}
        <Box padding="2u" background="neutralLow" borderRadius="large">
          <Rows spacing="1.5u">
            <Title size="xsmall">
              <FormattedMessage
                defaultMessage="Quick Start"
                description="Quick start section title"
              />
            </Title>
            <Text size="small">
              <FormattedMessage
                defaultMessage="1. Click 'Get Started' on the home screen"
                description="Quick start step 1"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="2. Navigate to your template page in Canva"
                description="Quick start step 2"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="3. Click 'Use Current Page as Template'"
                description="Quick start step 3"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="4. Select placeholder images and add them as frames"
                description="Quick start step 4"
              />
            </Text>
            <Text size="small">
              <FormattedMessage
                defaultMessage="5. Save, then start capturing photos!"
                description="Quick start step 5"
              />
            </Text>
          </Rows>
        </Box>

        {/* Tips Section */}
        <Box>
          <Rows spacing="1.5u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Tips for Best Results"
                description="Tips section title"
              />
            </Title>
            {TIPS.map((tip, index) => (
              <Box
                key={index}
                padding="1.5u"
                background="neutralLow"
                borderRadius="standard"
              >
                <Columns spacing="1u" alignY="start">
                  <Column width="content">
                    <Text size="small" tone="tertiary">
                      {"•"}
                    </Text>
                  </Column>
                  <Column>
                    <Text size="small">{tip}</Text>
                  </Column>
                </Columns>
              </Box>
            ))}
          </Rows>
        </Box>

        {/* Important Note */}
        <Box
          padding="2u"
          background="neutralLow"
          borderRadius="large"
        >
          <Rows spacing="1u">
            <Text size="small" variant="bold">
              <FormattedMessage
                defaultMessage="Important: Manual Page Duplication"
                description="Important note title"
              />
            </Text>
            <Text size="small" tone="tertiary">
              <FormattedMessage
                defaultMessage="The Canva API does not support automatic page duplication. Before each photo session, you must manually duplicate your template page (right-click the page → Duplicate). This ensures your original template stays intact."
                description="Important note about duplication"
              />
            </Text>
          </Rows>
        </Box>

        {/* Back button */}
        <Button variant="primary" onClick={handleBack} stretch>
          {intl.formatMessage({
            defaultMessage: "← Back to Home",
            description: "Back button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

export default HelpScreen;
