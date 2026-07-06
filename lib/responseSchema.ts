// lib/responseSchema.ts
//
// Defines the structured output schema we pass to Gemini's generateContent
// call (responseSchema + responseMimeType: "application/json"). Gemini uses
// an OpenAPI-subset schema format with UPPERCASE type names.
//
// Keep this in sync with types/assessment.ts (Step 6) — that file defines
// the TypeScript interfaces that mirror this shape for type-safe use on
// our side after parsing Gemini's JSON response.

export const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    transcript: {
      type: "STRING",
      description:
        "The full verbatim transcript of what the speaker said in the audio.",
    },
    overallScore: {
      type: "INTEGER",
      description:
        "Overall pronunciation score from 0 to 100, where 100 is native-like clarity and accuracy, and 0 is completely unintelligible.",
    },
    overallFeedback: {
      type: "STRING",
      description:
        "A short 2-3 sentence summary of the speaker's overall pronunciation quality, covering general strengths and weaknesses.",
    },
    words: {
      type: "ARRAY",
      description:
        "Ordered, word-by-word breakdown of the transcript with pronunciation judgment for each word.",
      items: {
        type: "OBJECT",
        properties: {
          word: {
            type: "STRING",
            description: "The word as transcribed, in its spoken order.",
          },
          status: {
            type: "STRING",
            enum: ["correct", "mispronounced", "unclear"],
            description:
              "'correct' = clearly and accurately pronounced. 'mispronounced' = identifiable pronunciation error (wrong stress, wrong phoneme, etc). 'unclear' = ambiguous, mumbled, or too distorted to confidently judge.",
          },
          reason: {
            type: "STRING",
            description:
              "If status is 'mispronounced' or 'unclear', a brief specific reason (e.g. 'stressed second syllable instead of first', 'final consonant dropped', 'vowel sound unclear'). Empty string if status is 'correct'.",
          },
          confidence: {
            type: "NUMBER",
            description:
              "Model's confidence in this specific word-level judgment, from 0.0 to 1.0.",
          },
          startTime: {
            type: "NUMBER",
            description:
              "Estimated start time in seconds of this word within the audio clip.",
          },
          endTime: {
            type: "NUMBER",
            description:
              "Estimated end time in seconds of this word within the audio clip.",
          },
        },
        required: ["word", "status", "reason", "confidence", "startTime", "endTime"],
      },
    },
  },
  required: ["transcript", "overallScore", "overallFeedback", "words"],
} as const;