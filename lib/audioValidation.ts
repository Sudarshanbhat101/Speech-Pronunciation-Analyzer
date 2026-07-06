// lib/audioValidation.ts
//
// Server-side validation for uploaded audio, run inside app/api/assess/route.ts
// BEFORE the file is sent to Gemini. Client-side duration checking (Web Audio
// API, in UploadForm.tsx) is a UX nicety — this is the real gate, since a
// client can always be bypassed by calling the API directly.
//
// Duration is estimated from MIME type + byte size using rough bitrate
// assumptions, since fully decoding audio server-side (e.g. with ffmpeg)
// is unnecessary complexity for a size/duration sanity check. This is a
// deliberate trade-off — see docs/architecture.md.

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB raw upload cap
export const MIN_DURATION_SECONDS = 25; // small buffer below the 30s floor
export const MAX_DURATION_SECONDS = 50; // small buffer above the 45s ceiling

export const ACCEPTED_MIME_TYPES = [
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
] as const;

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  estimatedDurationSeconds?: number;
}

// Rough average bitrates (bits per second) used ONLY to sanity-check
// duration from file size when we don't have an actual decoded duration.
// These are intentionally conservative estimates for compressed formats;
// WAV is uncompressed so its estimate is far more reliable than mp3/webm/ogg.
const ESTIMATED_BITRATE_BY_MIME: Record<string, number> = {
  "audio/webm": 96_000,
  "audio/wav": 1_411_200,
  "audio/wave": 1_411_200,
  "audio/x-wav": 1_411_200,
  "audio/mp3": 128_000,
  "audio/mpeg": 128_000,
  "audio/mp4": 128_000,
  "audio/m4a": 128_000,
  "audio/x-m4a": 128_000,
  "audio/ogg": 96_000,
};

export function validateAudioFile(
  mimeType: string,
  sizeBytes: number
): AudioValidationResult {
  if (!mimeType) {
    return {
      valid: false,
      error: "No file type detected. Please upload a valid audio file.",
    };
  }

  const normalizedMime = mimeType.toLowerCase().split(";")[0].trim();

  if (!ACCEPTED_MIME_TYPES.includes(normalizedMime as any)) {
    return {
      valid: false,
      error: `Unsupported audio format: "${mimeType}". Accepted formats: WAV, MP3, M4A, WEBM, OGG.`,
    };
  }

  if (sizeBytes <= 0) {
    return {
      valid: false,
      error: "Uploaded file is empty.",
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(sizeBytes / (1024 * 1024)).toFixed(
        1
      )}MB). Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  const bitrate = ESTIMATED_BITRATE_BY_MIME[normalizedMime] ?? 128_000;
  const estimatedDurationSeconds = (sizeBytes * 8) / bitrate;

  if (estimatedDurationSeconds < MIN_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Audio appears too short (~${estimatedDurationSeconds.toFixed(
        1
      )}s estimated). Please upload a recording between 30-45 seconds.`,
      estimatedDurationSeconds,
    };
  }

  if (estimatedDurationSeconds > MAX_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Audio appears too long (~${estimatedDurationSeconds.toFixed(
        1
      )}s estimated). Please upload a recording between 30-45 seconds.`,
      estimatedDurationSeconds,
    };
  }

  return {
    valid: true,
    estimatedDurationSeconds,
  };
}