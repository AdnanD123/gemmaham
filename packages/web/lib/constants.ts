// Re-export shared constants for convenience
export {
  GEMMAHAM_RENDER_PROMPT,
  PROGRESS_INCREMENT,
  REDIRECT_DELAY_MS,
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  SHARE_STATUS_RESET_DELAY_MS,
  GRID_OVERLAY_SIZE,
  GRID_COLOR,
  IMAGE_RENDER_DIMENSION,
} from "@gemmaham/shared";

// Cloud Functions base URL
const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || "us-central1";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
export const CLOUD_FUNCTIONS_BASE_URL = `https://${region}-${projectId}.cloudfunctions.net`;

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];
