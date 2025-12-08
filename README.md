# Photo Booth for Canva

A Canva app that lets you capture photos from your webcam and place them directly into your designs. Perfect for creating photo booth-style prints, event photography, ID photos, and more.

## Features

- **Webcam Capture**: Capture photos directly from your webcam
- **Template-Based**: Define exactly where photos should appear on your design
- **Countdown Timer**: Configurable countdown (1-10 seconds) before each capture
- **Multi-Photo Support**: Capture multiple photos in a single session
- **Frame Placeholders**: Use any image element as a placeholder for captured photos
- **Sound Effects**: Optional countdown and shutter sounds
- **Flash Effect**: Visual flash feedback when capturing
- **Camera Selection**: Choose between front and back cameras

## How It Works

1. **Design Your Template**: Create a page with placeholder images where you want photos to appear
2. **Select Frame Placeholders**: Mark which images should be replaced with captured photos
3. **Duplicate Your Template**: Before each session, manually duplicate the template page in Canva
4. **Capture Photos**: Use the built-in webcam interface with countdown timer
5. **Review & Place**: Review your photos and place them on the duplicated template

> **Note**: Canva's API does not support automatic page duplication with full element fidelity. You must manually duplicate your template page (right-click → Duplicate) before each photo session.

## Getting Started

### Requirements

- Node.js `v18` or `v20.10.0`
- npm `v9` or `v10`

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

The server becomes available at <http://localhost:8080>.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

## Project Structure

```
src/
├── app.tsx                 # Main app component
├── index.tsx              # Entry point
├── types/
│   └── index.ts           # TypeScript types
├── components/
│   └── screens/           # Screen components
│       ├── HomeScreen.tsx
│       ├── HelpScreen.tsx
│       ├── SetupTemplateScreen.tsx
│       ├── SetupFramesScreen.tsx
│       ├── CaptureScreen.tsx
│       ├── ReviewScreen.tsx
│       ├── CompleteScreen.tsx
│       └── SettingsScreen.tsx
└── services/
    ├── storageService.ts  # Config persistence
    └── audioService.ts    # Sound effects
```

## Configuration

### Capture Settings

- **Countdown Duration**: 1-10 seconds before each photo
- **Capture Mode**: Auto (captures all photos automatically) or Manual (click for each)
- **Camera Facing**: Front (selfie) or Back camera
- **Sound Effects**: Toggle countdown and shutter sounds
- **Flash Effect**: Toggle visual flash on capture

### Frame Placeholders

Frame placeholders are regular image elements in your Canva design. When setting up:

1. Add placeholder images to your design
2. Position and size them where you want photos to appear
3. Select them in Canva and add them as frames in the app
4. Drag to reorder the capture sequence

## Publishing Your App

### 1. Create Your App in the Developer Portal

1. Go to [Canva Developer Portal](https://www.canva.com/developers/apps)
2. Click "Create an app"
3. Fill in your app details

### 2. Configure App Settings

In the Developer Portal:
- Set your app name and description
- Upload an app icon
- Configure the app URL for production
- Set up any required permissions

### 3. Build for Production

```bash
npm run build
```

### 4. Deploy Your Backend (if applicable)

If your app uses a backend, deploy it to a production server and update the `CANVA_BACKEND_HOST` in your `.env` file.

### 5. Submit for Review

1. In the Developer Portal, navigate to your app
2. Click "Submit for review"
3. Follow the review guidelines
4. Wait for approval

## Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] App builds successfully (`npm run build`)
- [ ] App icon uploaded (256x256 PNG)
- [ ] Privacy policy URL set
- [ ] Terms of service URL set (if required)
- [ ] App description is clear and accurate
- [ ] Screenshots/preview images uploaded
- [ ] Backend deployed (if applicable)
- [ ] Environment variables configured for production

## Technical Notes

### API Limitations

- **Page Duplication**: Canva's API doesn't support automatic page duplication with full element fidelity. Users must manually duplicate their template pages.
- **Element Placement**: Uses `addElementAtPoint` to place photos on the current page at specified coordinates.
- **Image Upload**: Photos are uploaded to Canva using the `upload` API before placement.

### Browser Compatibility

The app requires:
- WebRTC for webcam access
- Web Audio API for sound effects (optional)
- Modern browser with ES6+ support

### Privacy

- Photos are captured locally and uploaded directly to Canva
- No data is sent to third-party servers
- Configuration is stored in browser localStorage

## Testing Documentation

This project includes comprehensive unit tests:

- **Services** (`src/services/__tests__/`)
- **Screen Components** (`src/components/screens/__tests__/`)
- **Utility Hooks** (`utils/__tests__/`)
- **Main App** (`src/tests/`)

See the test files for examples of how to test Canva app components.

## Resources

- [Canva Apps SDK Documentation](https://www.canva.dev/docs/apps/)
- [App UI Kit Components](https://www.canva.dev/docs/apps/app-ui-kit/)
- [Testing Documentation](https://www.canva.dev/docs/apps/testing/)
- [Publishing Guidelines](https://www.canva.dev/docs/apps/publishing/)

## License

MIT License - See [LICENSE.md](LICENSE.md) for details.
