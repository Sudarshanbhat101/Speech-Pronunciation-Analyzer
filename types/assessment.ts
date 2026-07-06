// types/assessment.ts
// Single source of truth for the shape of a pronunciation assessment result.
// This shape must match:
//   1. lib/responseSchema.ts   (the Gemini responseSchema/JSON schema sent to the API)
//   2. lib/gemini.ts           (parses Gemini's JSON response into these types)
//   3. app/api/assess/route.ts (returns AssessmentResult to the client)
//   4. components/ScoreResult.tsx & components/WordHighlight.tsx (render these types)

/**
 * Severity/category of a pronunciation issue on a single word or short segment.
 * "correct"       - no issue, word was pronounced clearly and correctly
 * "mispronounced" - phoneme(s) clearly wrong (e.g. wrong vowel/consonant sound)
 * "unclear"       - mumbled / low confidence / hard to make out, not clearly "wrong"
 * "omitted"       - word appears to have been skipped or is missing from the audio
 */
export type IssueStatus = "correct" | "mispronounced" | "unclear" | "omitted";

/**
 * Assessment for a single word (or short multi-word segment) in the transcript.
 */
export interface WordAssessment {
  /** Stable index of this word in the transcript, 0-based, in spoken order. */
  index: number;
  /** The word (or short segment) as transcribed. */
  word: string;
  /** Classification of the pronunciation quality for this word. */
  status: IssueStatus;
  /**
   * Human-readable reason for the flag, e.g. "Vowel sound in 'th' softened,
   * heard as /d/ instead of /ð/". Empty string ("") when status is "correct".
   */
  reason: string;
  /**
   * Optional approximate start time in seconds within the audio clip.
   * Gemini is asked for this but it is best-effort, not frame-accurate.
   */
  startTime?: number;
  /** Optional approximate end time in seconds within the audio clip. */
  endTime?: number;
}

/**
 * Top-level result returned by the scoring engine (Gemini) and by
 * POST /api/assess. This is the exact JSON shape enforced by
 * lib/responseSchema.ts's responseSchema/responseMimeType config.
 */
export interface AssessmentResult {
  /** Full transcript of what the speaker said, as best transcribed. */
  transcript: string;
  /** Overall pronunciation score from 0-100 (100 = native-like clarity). */
  overallScore: number;
  /** 1-2 sentence plain-English summary of overall pronunciation quality. */
  overallFeedback: string;
  /** Per-word / per-segment breakdown, in spoken order. */
  words: WordAssessment[];
  /**
   * Count of words flagged as mispronounced or unclear, for quick display
   * (e.g. "6 of 42 words need attention"). Derived server-side if Gemini
   * omits it, but requested directly in the schema for consistency.
   */
  issueCount: number;
  /** Total word count in the transcript. */
  wordCount: number;
}

/**
 * Error shape returned by /api/assess on failure (validation error,
 * Gemini API error, malformed JSON from the model, etc).
 */
export interface AssessmentError {
  error: string;
  /** Optional machine-readable error code for client-side branching. */
  code?:
  | "NO_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_DURATION"
  | "UNSUPPORTED_FORMAT"
  | "NO_CONSENT"
  | "GEMINI_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN";
}

/**
 * Union type for what the API route can return, useful for typing the
 * fetch() call in UploadForm.tsx.
 */
export type AssessResponse = AssessmentResult | AssessmentError;

/** Type guard to distinguish a successful result from an error at runtime. */
export function isAssessmentError(
  response: AssessResponse
): response is AssessmentError {
  return (response as AssessmentError).error !== undefined;
}