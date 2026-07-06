// lib/gemini.ts
//
// Isolates all Gemini scoring logic behind a single function: assessPronunciation().
// Swappable later for Azure Pronunciation Assessment or another provider —
// callers (app/api/assess/route.ts) only depend on this function's signature
// and the AssessmentResult shape, not on anything Gemini-specific.
//
// Uses the STABLE generateContent REST endpoint (not the beta Interactions
// API), per Google's own guidance for production use. Audio is sent as
// inline base64 data alongside a text prompt, with responseSchema +
// responseMimeType forcing structured JSON back.

import { GEMINI_RESPONSE_SCHEMA } from "./responseSchema";
import type { AssessmentResult, WordAssessment } from "@/types/assessment";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AssessPronunciationParams {
  base64Audio: string;
  mimeType: string;
}

export interface GeminiRawResponse {
  transcript: string;
  overallScore: number;
  overallFeedback: string;
  words: Array<{
    word: string;
    status: "correct" | "mispronounced" | "unclear";
    reason: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
}

const PRONUNCIATION_PROMPT = `You are an expert English pronunciation coach and phonetician. Listen carefully to the attached audio of a speaker reading or speaking English.

Your task:
1. Transcribe exactly what was said, word for word, including filler words like "um" or "uh" if present.
2. For EVERY word in the transcript, judge whether it was pronounced correctly, mispronounced, or was unclear/unintelligible. Base this on standard English phonetics (you may use a neutral General American or Received Pronunciation standard) — consider stress placement, vowel sounds, consonant clarity, phoneme accuracy, and articulation speed/clarity.
3. Apply real scrutiny word by word — do not default to marking speech as entirely correct just because it is broadly understandable. Listen specifically for: dropped or slurred final consonants, reduced/swallowed vowels, wrong syllable stress, sounds substituted for similar ones (e.g. /v/ for /w/, /th/ softened to /d/ or /f/), and words that are mumbled, rushed, or trail off unclearly. If in genuine doubt about a word's clarity, mark it "unclear" rather than defaulting to "correct".
4. For any word that is "mispronounced" or "unclear", give a brief, specific, technical-but-understandable reason (e.g. "stressed the wrong syllable", "substituted /v/ for /w/", "final consonant dropped", "vowel sound too short").
5. Give an overall pronunciation score from 0-100 reflecting general intelligibility and accuracy across the whole clip, and a short overall feedback summary (2-3 sentences) covering strengths and the most important areas to improve. Reserve scores of 95+ for speech with genuinely zero detectable issues — most real speech, even fluent speech, has at least minor imperfections worth noting.
6. For EVERY word in the transcript, estimate its approximate start and end timestamps in seconds (e.g., startTime = 1.45, endTime = 1.90) relative to the start of the audio file. Make sure they are sequentially increasing.

Be fair and precise. Do not mark a word as mispronounced just because of natural regional accent variation (e.g. British vs American vowel differences) unless it affects intelligibility. Only flag genuine pronunciation errors or unclear articulation — but do apply real scrutiny rather than being lenient by default.

Return your response strictly according to the provided JSON schema. Do not include any text outside the JSON.`;

export async function assessPronunciation({
  base64Audio,
  mimeType,
}: AssessPronunciationParams): Promise<AssessmentResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (dev) or your Vercel project env vars (prod)."
    );
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PRONUNCIATION_PROMPT },
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new Error(
      `Failed to reach Gemini API: ${err instanceof Error ? err.message : "unknown network error"
      }`
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      errorDetail = JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(
      `Gemini API error (status ${response.status}): ${errorDetail}`
    );
  }

  const data = await response.json();

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (!candidate) {
    throw new Error(
      `Gemini returned no candidates. Full response: ${JSON.stringify(data)}`
    );
  }

  if (finishReason && finishReason !== "STOP") {
    throw new Error(
      `Gemini generation did not finish normally (finishReason: ${finishReason}). This may mean the audio was rejected, too long, or blocked by safety filters.`
    );
  }

  const rawText: string | undefined = candidate?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error(
      `Gemini response missing expected text content. Full response: ${JSON.stringify(
        data
      )}`
    );
  }

  let parsed: GeminiRawResponse;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini JSON response: ${err instanceof Error ? err.message : "unknown parse error"
      }. Raw text: ${rawText}`
    );
  }

  if (
    typeof parsed.transcript !== "string" ||
    typeof parsed.overallScore !== "number" ||
    typeof parsed.overallFeedback !== "string" ||
    !Array.isArray(parsed.words)
  ) {
    throw new Error(
      `Gemini JSON response did not match expected shape: ${JSON.stringify(
        parsed
      )}`
    );
  }

  const mappedWords: WordAssessment[] = parsed.words.map((w, index) => ({
    index,
    word: w.word,
    status: w.status,
    reason: w.reason,
    startTime: w.startTime,
    endTime: w.endTime,
  }));

  const finalResult: AssessmentResult = {
    transcript: parsed.transcript,
    overallScore: parsed.overallScore,
    overallFeedback: parsed.overallFeedback,
    words: mappedWords,
    wordCount: mappedWords.length,
    issueCount: mappedWords.filter((w) => w.status !== "correct").length,
  };

  return finalResult;
}