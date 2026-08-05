import { describe, it, expect } from "vitest";
import { GEMINI_RESPONSE_SCHEMA } from "../responseSchema";

describe("GEMINI_RESPONSE_SCHEMA", () => {
  it("is a top-level OBJECT schema", () => {
    expect(GEMINI_RESPONSE_SCHEMA.type).toBe("OBJECT");
  });

  it("declares all four top-level required properties", () => {
    expect(GEMINI_RESPONSE_SCHEMA.required).toEqual([
      "transcript",
      "overallScore",
      "overallFeedback",
      "words",
    ]);
  });

  it("defines the transcript as a string", () => {
    expect(GEMINI_RESPONSE_SCHEMA.properties.transcript.type).toBe("STRING");
  });

  it("defines overallScore as an integer", () => {
    expect(GEMINI_RESPONSE_SCHEMA.properties.overallScore.type).toBe("INTEGER");
  });

  it("defines overallFeedback as a string", () => {
    expect(GEMINI_RESPONSE_SCHEMA.properties.overallFeedback.type).toBe("STRING");
  });

  it("defines words as an array of objects", () => {
    const words = GEMINI_RESPONSE_SCHEMA.properties.words;
    expect(words.type).toBe("ARRAY");
    expect(words.items.type).toBe("OBJECT");
  });

  it("limits word status to the supported enum values", () => {
    const status = GEMINI_RESPONSE_SCHEMA.properties.words.items.properties.status;
    expect(status.enum).toEqual(["correct", "mispronounced", "unclear"]);
  });

  it("requires word, status, reason, confidence, startTime and endTime per word", () => {
    expect(GEMINI_RESPONSE_SCHEMA.properties.words.items.required).toEqual([
      "word",
      "status",
      "reason",
      "confidence",
      "startTime",
      "endTime",
    ]);
  });
});