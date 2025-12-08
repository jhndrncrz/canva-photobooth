# Photo Booth for Canva - Deployment Guide

This guide walks you through deploying your Photo Booth app to the Canva Apps Marketplace.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Building for Production](#building-for-production)
4. [Testing Your App](#testing-your-app)
5. [Preparing Marketplace Assets](#preparing-marketplace-assets)
6. [Submitting to Canva](#submitting-to-canva)
7. [Post-Submission](#post-submission)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] A [Canva Developer Account](https://www.canva.com/developers/)
- [ ] Node.js 18+ and pnpm installed
- [ ] The Canva CLI installed globally: `npm install -g @canva/cli`
- [ ] Your app registered in the [Canva Developer Portal](https://www.canva.com/developers/apps)

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass: `pnpm test`
- [ ] No TypeScript errors: `pnpm build`
- [ ] No ESLint warnings: `pnpm lint`
- [ ] Code is properly formatted

### Functionality Testing

- [ ] Template setup works correctly
- [ ] Frame placeholder selection works
- [ ] Webcam capture functions properly
- [ ] Photo placement on canvas works
- [ ] Settings persist between sessions
- [ ] Help screen displays correctly
- [ ] Reset configuration works
- [ ] Error handling displays appropriate messages

### Permissions & Scopes

Verify your `canva-app.json` has the required permissions:

```json
{
  "permissions": {
    "design_content:read": "To read the current page and selected elements",
    "design_content:write": "To place captured photos on the canvas",
    "user_media": "To access the webcam for photo capture",
    "app_storage": "To save configuration between sessions"
  }
}
```

### Browser Compatibility

Test your app in:

- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Safari (latest)
- [ ] Microsoft Edge (latest)

---

## Building for Production

### 1. Run the Production Build

```bash
# Clean previous builds
rm -rf dist

# Build for production
pnpm build
```

### 2. Verify the Build Output

Check that the `dist` folder contains:
- Bundled JavaScript files
- CSS files (if applicable)
- No source maps in production

### 3. Check Bundle Size

```bash
# View bundle size
du -sh dist/*
```

Aim to keep your bundle under 1MB for optimal loading performance.

---

## Testing Your App

### Local Preview

```bash
# Start the development server
pnpm start

# The app will be available at https://localhost:8080
```

### Testing in Canva

1. Open [Canva](https://www.canva.com)
2. Create or open a design
3. Open the Apps panel
4. Find your app under "Your Apps" or use the preview URL
5. Test all functionality thoroughly

### Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| First-time setup | Shows "Get Started" button, guides through template setup |
| Template selection | Stores current page as template |
| Frame selection | Can select multiple images as frame placeholders |
| Capture photos | Webcam works, countdown timer functions, photos captured |
| Place photos | Photos placed at correct positions on duplicated page |
| Reset config | Confirmation dialog appears, config cleared on confirm |
| Help screen | All workflow steps and tips display correctly |

---

## Preparing Marketplace Assets

### Required Assets

#### 1. App Icon (Required)
- **Size**: 240 x 240 pixels
- **Format**: PNG or JPEG
- **Background**: Should work on light and dark backgrounds

#### 2. Cover Image (Required)
- **Size**: 1920 x 1080 pixels
- **Format**: PNG or JPEG
- **Content**: Show your app in action

#### 3. Screenshots (3-5 recommended)
- **Size**: 1920 x 1080 pixels
- **Format**: PNG or JPEG
- **Content**: 
  - Template setup screen
  - Frame selection screen
  - Photo capture in action
  - Completed photo booth result
  - Settings/configuration

#### 4. Demo Video (Optional but recommended)
- **Duration**: 30-60 seconds
- **Format**: MP4
- **Content**: Quick walkthrough of the app workflow

### App Listing Content

#### App Name
```
Photo Booth
```

#### Short Description (max 80 characters)
```
Capture webcam photos and place them in your designs instantly.
```

#### Long Description (max 3000 characters)
```
Transform your Canva designs into interactive photo experiences! Photo Booth 
lets you capture photos directly from your webcam and place them perfectly 
into your design templates.

**Perfect for:**
• Photo booth templates for events and parties
• ID card and badge creation
• Social media content with personal photos
• Fun photo strip designs
• Quick headshot placement

**How it works:**
1. Design your template with placeholder images
2. Select which images should be replaced with photos
3. Duplicate your template page for each session
4. Capture photos using your webcam with countdown timer
5. Place photos on your design with one click

**Features:**
✓ Easy template setup with visual frame selection
✓ Adjustable countdown timer (1-10 seconds)
✓ Audio feedback with shutter and countdown sounds
✓ Flash effect for authentic photo booth experience
✓ Front/back camera support for mobile devices
✓ Drag-and-drop frame ordering
✓ Persistent settings between sessions

**Note:** For best results, use simple placeholder images that are easy to 
identify and delete after placing your photos.
```

#### Categories
- Photography
- Productivity

#### Tags
```
photo booth, webcam, camera, photo capture, photography, selfie, headshot
```

---

## Submitting to Canva

### Step 1: Access Developer Portal

1. Go to [Canva Developer Portal](https://www.canva.com/developers/apps)
2. Select your Photo Booth app
3. Click "Submit for Review"

### Step 2: Fill Out Submission Form

**App Information:**
- App name
- Short description
- Long description
- Categories and tags

**Assets:**
- Upload app icon
- Upload cover image
- Upload screenshots
- Upload demo video (optional)

**Technical Details:**
- Confirm permissions are correct
- Provide test instructions for reviewers

**Review Notes:**
Include any special instructions for the review team:

```
Testing Instructions:
1. Open any design with at least one image
2. Click "Get Started" to begin setup
3. Click "Use Current Page as Template"
4. Select an image and click "Add Selected as Frames"
5. Click "Save & Continue"
6. To test capture: right-click the template page → Duplicate
7. Navigate to the duplicated page
8. Click "Start Capture" and allow webcam access
9. Take a photo, then click "Place Photos"

Note: The app requires manual page duplication as the Canva API 
doesn't support automatic page creation.
```

### Step 3: Submit for Review

1. Review all information
2. Accept the developer terms
3. Click "Submit"

---

## Post-Submission

### Review Timeline

- **Initial Review**: 2-5 business days
- **Feedback Response**: If changes needed, respond within 30 days
- **Final Approval**: 1-2 business days after fixes

### Common Review Feedback

| Issue | Resolution |
|-------|------------|
| Insufficient permissions explanation | Update permission descriptions in canva-app.json |
| Missing error handling | Add user-friendly error messages |
| UI not matching Canva guidelines | Use @canva/app-ui-kit components consistently |
| Screenshots don't show functionality | Capture new screenshots showing key features |

### After Approval

1. Your app will be published to the Canva Apps Marketplace
2. Monitor user feedback and reviews
3. Address any issues promptly with updates

---

## Troubleshooting

### Build Errors

**TypeScript Errors:**
```bash
# Check for type errors
pnpm tsc --noEmit
```

**Module Resolution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Preview Issues

**HTTPS Certificate:**
```bash
# Regenerate SSL certificates
pnpm generate:ssl
```

**Port Already in Use:**
```bash
# Find and kill process on port 8080
lsof -i :8080
kill -9 <PID>
```

### Canva Connection Issues

**App Not Loading:**
1. Check browser console for errors
2. Verify app URL in Developer Portal matches your server
3. Ensure HTTPS is enabled

**Permissions Denied:**
1. Verify permissions in canva-app.json
2. Clear app data and re-authorize
3. Check for permission scope mismatches

### Webcam Issues

**Camera Not Working:**
- Ensure HTTPS is enabled (required for getUserMedia)
- Check browser permissions for camera access
- Test in incognito mode to rule out extension conflicts

---

## Support Resources

- [Canva Developer Documentation](https://www.canva.dev/docs/apps/)
- [Canva Apps SDK Reference](https://www.canva.dev/docs/apps/api/)
- [Canva Developer Community](https://community.canva.dev/)
- [App Review Guidelines](https://www.canva.dev/docs/apps/review-guidelines/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | December 2025 | Initial release |

---

## License

MIT License - See [LICENSE.md](./LICENSE.md) for details.
