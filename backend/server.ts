/**
 * Photo Booth Backend Server
 *
 * Provides camera session management and photo storage for the Photo Booth app.
 * The camera capture page runs outside the Canva iframe to access webcam.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import cors from "cors";
import express from "express";
import path from "path";
import { createBaseServer } from "../utils/backend/base_backend/create";

const router = express.Router();

// ============================================================================
// CORS Middleware - Must be first
// ============================================================================
router.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
router.options("*", cors());

// ============================================================================
// In-memory Session Storage
// ============================================================================

interface Photo {
  id: string;
  dataUrl: string;
  capturedAt: string;
  frameIndex: number;
}

interface PhotoSession {
  sessionId: string;
  photos: Photo[];
  frameCount: number;
  countdownSeconds: number;
  createdAt: number;
  status: "waiting" | "capturing" | "complete";
  // Audio/visual settings
  playShutterSound: boolean;
  playCountdownSound: boolean;
  showFlashEffect: boolean;
  // Capture mode: auto or manual
  captureMode: "auto" | "manual";
}

const sessions = new Map<string, PhotoSession>();

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      sessions.delete(sessionId);
      console.log(`[PhotoBooth] Cleaned up expired session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// API Routes
// ============================================================================

/**
 * Create a new camera session
 * POST /api/photobooth/session
 */
router.post("/api/photobooth/session", (req, res) => {
  const { 
    frameCount, 
    countdownSeconds,
    playShutterSound,
    playCountdownSound,
    showFlashEffect,
    captureMode
  } = req.body;

  if (!frameCount || frameCount < 1) {
    res
      .status(400)
      .json({ error: "frameCount is required and must be at least 1" });
    return;
  }

  const sessionId = `pb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const session: PhotoSession = {
    sessionId,
    photos: [],
    frameCount: frameCount,
    countdownSeconds: countdownSeconds || 3,
    createdAt: Date.now(),
    status: "waiting",
    playShutterSound: playShutterSound !== false,
    playCountdownSound: playCountdownSound !== false,
    showFlashEffect: showFlashEffect !== false,
    captureMode: captureMode || "manual",
  };

  sessions.set(sessionId, session);

  console.log(
    `[PhotoBooth] Created session: ${sessionId} for ${frameCount} photos`
  );

  res.json({
    sessionId,
    cameraUrl: `/photobooth/camera.html?session=${sessionId}`,
  });
});

/**
 * Get session status and photos
 * GET /api/photobooth/session/:sessionId
 */
router.get("/api/photobooth/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({
    sessionId: session.sessionId,
    status: session.status,
    frameCount: session.frameCount,
    countdownSeconds: session.countdownSeconds,
    capturedCount: session.photos.length,
    photos: session.photos,
    playShutterSound: session.playShutterSound,
    playCountdownSound: session.playCountdownSound,
    showFlashEffect: session.showFlashEffect,
    captureMode: session.captureMode,
  });
});

/**
 * Add a photo to a session
 * POST /api/photobooth/session/:sessionId/photo
 */
router.post("/api/photobooth/session/:sessionId/photo", (req, res) => {
  const { sessionId } = req.params;
  const { dataUrl, frameIndex } = req.body;

  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (!dataUrl) {
    res.status(400).json({ error: "dataUrl is required" });
    return;
  }

  const photo: Photo = {
    id: `photo-${Date.now()}`,
    dataUrl,
    capturedAt: new Date().toISOString(),
    frameIndex: frameIndex ?? session.photos.length,
  };

  session.photos.push(photo);
  session.status = "capturing";

  // Check if all photos are captured
  if (session.photos.length >= session.frameCount) {
    session.status = "complete";
  }

  console.log(
    `[PhotoBooth] Session ${sessionId}: Captured photo ${session.photos.length}/${session.frameCount}`
  );

  res.json({
    success: true,
    photoId: photo.id,
    capturedCount: session.photos.length,
    isComplete: session.status === "complete",
  });
});

/**
 * Delete a session
 * DELETE /api/photobooth/session/:sessionId
 */
router.delete("/api/photobooth/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`[PhotoBooth] Deleted session: ${sessionId}`);
  }

  res.json({ success: true });
});

/**
 * Mark a session as complete
 * POST /api/photobooth/session/:sessionId/complete
 */
router.post("/api/photobooth/session/:sessionId/complete", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  session.status = "complete";
  console.log(`[PhotoBooth] Session ${sessionId} marked as complete with ${session.photos.length} photos`);

  res.json({ 
    success: true,
    photoCount: session.photos.length 
  });
});

/**
 * Clear photos from a session (for retake all)
 * POST /api/photobooth/session/:sessionId/clear
 */
router.post("/api/photobooth/session/:sessionId/clear", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  session.photos = [];
  session.status = "waiting";
  console.log(`[PhotoBooth] Session ${sessionId} photos cleared`);

  res.json({ success: true });
});

/**
 * Serve a photo as an image file
 * GET /api/photobooth/session/:sessionId/photo/:photoId
 */
router.get("/api/photobooth/session/:sessionId/photo/:photoId", (req, res) => {
  const { sessionId, photoId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const photo = session.photos.find((p) => p.id === photoId);
  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  // Convert data URL to buffer
  const dataUrl = photo.dataUrl;
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    res.status(500).json({ error: "Invalid photo data" });
    return;
  }

  const mimeType = matches[1] || 'image/jpeg';
  const base64Data = matches[2] || '';
  const buffer = Buffer.from(base64Data, "base64");

  res.set({
    "Content-Type": mimeType,
    "Content-Length": buffer.length,
    "Cache-Control": "public, max-age=3600",
  });

  res.send(buffer);
});

// ============================================================================
// Static Files
// ============================================================================

/**
 * Serve the camera HTML page
 */
router.get("/photobooth/camera.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../utils/backend/photobooth/camera.html"));
});

// ============================================================================
// Start Server
// ============================================================================

const server = createBaseServer(router);
server.start(process.env.CANVA_BACKEND_PORT || 3001);

console.log("[PhotoBooth] Backend server started");
console.log(
  "[PhotoBooth] Camera page available at: /photobooth/camera.html?session=<sessionId>"
);
